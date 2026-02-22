import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { S3Event, S3EventRecord, Context } from 'aws-lambda'

// ---------------------------------------------------------------------------
// Mock setup — vi.hoisted ensures variables are available when vi.mock
// factory functions run (vi.mock is hoisted above all other code).
// ---------------------------------------------------------------------------

const { mockToBuffer, mockWebp, mockResize, mockMetadata, mockSharp, mockSend } =
  vi.hoisted(() => {
    const mockToBuffer = vi.fn()
    const mockWebp = vi.fn(() => ({ toBuffer: mockToBuffer }))
    const mockResize = vi.fn(() => ({ webp: mockWebp }))
    const mockMetadata = vi.fn()
    const mockClone = vi.fn(() => ({
      resize: mockResize,
      webp: mockWebp,
      toBuffer: mockToBuffer,
    }))
    const mockSharp = vi.fn(() => ({
      metadata: mockMetadata,
      clone: mockClone,
      resize: mockResize,
      webp: mockWebp,
      toBuffer: mockToBuffer,
    }))
    const mockSend = vi.fn()
    return { mockToBuffer, mockWebp, mockResize, mockMetadata, mockSharp, mockSend }
  })

vi.mock('sharp', () => ({ default: mockSharp }))

vi.mock('@aws-sdk/client-s3', () => {
  return {
    S3Client: class { send = mockSend },
    GetObjectCommand: class { constructor(params: Record<string, unknown>) { Object.assign(this, params) } },
    PutObjectCommand: class { constructor(params: Record<string, unknown>) { Object.assign(this, params) } },
  }
})

// Import the handler after mocks are set up
import { handler } from './index.js'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createS3Event(
  bucket: string,
  key: string,
  eventName = 'ObjectCreated:Put'
): S3Event {
  const record: S3EventRecord = {
    eventVersion: '2.1',
    eventSource: 'aws:s3',
    awsRegion: 'us-east-1',
    eventTime: '2026-01-01T00:00:00.000Z',
    eventName,
    userIdentity: { principalId: 'test' },
    requestParameters: { sourceIPAddress: '127.0.0.1' },
    responseElements: {
      'x-amz-request-id': 'test-request-id',
      'x-amz-id-2': 'test-id-2',
    },
    s3: {
      s3SchemaVersion: '1.0',
      configurationId: 'test-config',
      bucket: {
        name: bucket,
        ownerIdentity: { principalId: 'test' },
        arn: `arn:aws:s3:::${bucket}`,
      },
      object: {
        key,
        size: 1024,
        eTag: 'test-etag',
        sequencer: '0000000000',
      },
    },
  }

  return { Records: [record] }
}

function createMockContext(): Context {
  return {
    callbackWaitsForEmptyEventLoop: false,
    functionName: 'test-function',
    functionVersion: '1',
    invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789:function:test',
    memoryLimitInMB: '512',
    awsRequestId: 'test-request-id',
    logGroupName: '/aws/lambda/test',
    logStreamName: '2026/01/01/[$LATEST]test',
    getRemainingTimeInMillis: () => 30000,
    done: vi.fn(),
    fail: vi.fn(),
    succeed: vi.fn(),
  }
}

/** Helper to build a Readable-like Body for the S3 GetObject response */
function createS3Body(buffer: Buffer) {
  return {
    transformToByteArray: vi.fn().mockResolvedValue(new Uint8Array(buffer)),
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('image-processor Lambda handler', () => {
  const BUCKET = 'surfaced-art-dev-media'
  const context = createMockContext()

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.AWS_REGION = 'us-east-1'
  })

  it('processes a JPEG and generates 3 WebP variants at 400, 800, 1200 widths', async () => {
    const key = 'uploads/artist-123/listing-456/photo.jpg'
    const event = createS3Event(BUCKET, key)

    // S3 GetObject returns a fake image buffer
    const fakeImage = Buffer.from('fake-image-data')
    mockSend.mockResolvedValueOnce({ Body: createS3Body(fakeImage) })

    // Sharp metadata says the image is 2000px wide
    mockMetadata.mockResolvedValue({ width: 2000, height: 1500 })

    // Sharp processing returns a buffer for each variant
    const variant400 = Buffer.from('webp-400')
    const variant800 = Buffer.from('webp-800')
    const variant1200 = Buffer.from('webp-1200')
    mockToBuffer
      .mockResolvedValueOnce(variant400)
      .mockResolvedValueOnce(variant800)
      .mockResolvedValueOnce(variant1200)

    // S3 PutObject calls for each variant
    mockSend
      .mockResolvedValueOnce({}) // 400w
      .mockResolvedValueOnce({}) // 800w
      .mockResolvedValueOnce({}) // 1200w

    const result = await handler(event, context)

    expect(result).toEqual({
      statusCode: 200,
      body: JSON.stringify({
        message: 'Processed 3 variant(s) for uploads/artist-123/listing-456/photo.jpg',
        variants: [
          'uploads/artist-123/listing-456/photo/400w.webp',
          'uploads/artist-123/listing-456/photo/800w.webp',
          'uploads/artist-123/listing-456/photo/1200w.webp',
        ],
      }),
    })

    // Verify GetObject was called with the correct bucket/key
    expect(mockSend).toHaveBeenCalledTimes(4) // 1 GetObject + 3 PutObject

    // Verify sharp was called with the image buffer
    expect(mockSharp).toHaveBeenCalledWith(expect.any(Buffer))

    // Verify resize was called for each target width
    expect(mockResize).toHaveBeenCalledTimes(3)
    expect(mockResize).toHaveBeenCalledWith(400, null, { fit: 'inside', withoutEnlargement: true })
    expect(mockResize).toHaveBeenCalledWith(800, null, { fit: 'inside', withoutEnlargement: true })
    expect(mockResize).toHaveBeenCalledWith(1200, null, { fit: 'inside', withoutEnlargement: true })

    // Verify WebP conversion with quality 82
    expect(mockWebp).toHaveBeenCalledTimes(3)
    expect(mockWebp).toHaveBeenCalledWith({ quality: 82 })
  })

  it('skips variants where the image is smaller than the target width', async () => {
    const key = 'uploads/artist-123/listing-456/small.png'
    const event = createS3Event(BUCKET, key)

    const fakeImage = Buffer.from('small-image')
    mockSend.mockResolvedValueOnce({ Body: createS3Body(fakeImage) })

    // Image is only 600px wide — should skip 800w and 1200w
    mockMetadata.mockResolvedValue({ width: 600, height: 400 })

    const variant400 = Buffer.from('webp-400')
    mockToBuffer.mockResolvedValueOnce(variant400)

    // Only 1 PutObject call (for 400w)
    mockSend.mockResolvedValueOnce({})

    const result = await handler(event, context)

    expect(result).toEqual({
      statusCode: 200,
      body: JSON.stringify({
        message: 'Processed 1 variant(s) for uploads/artist-123/listing-456/small.png',
        variants: [
          'uploads/artist-123/listing-456/small/400w.webp',
        ],
      }),
    })

    // 1 GetObject + 1 PutObject
    expect(mockSend).toHaveBeenCalledTimes(2)
    expect(mockResize).toHaveBeenCalledTimes(1)
    expect(mockResize).toHaveBeenCalledWith(400, null, { fit: 'inside', withoutEnlargement: true })
  })

  it('skips all variants when image is smaller than smallest target width', async () => {
    const key = 'uploads/artist-123/listing-456/tiny.jpg'
    const event = createS3Event(BUCKET, key)

    const fakeImage = Buffer.from('tiny-image')
    mockSend.mockResolvedValueOnce({ Body: createS3Body(fakeImage) })

    // Image is only 200px wide — smaller than all targets
    mockMetadata.mockResolvedValue({ width: 200, height: 150 })

    const result = await handler(event, context)

    expect(result).toEqual({
      statusCode: 200,
      body: JSON.stringify({
        message: 'Processed 0 variant(s) for uploads/artist-123/listing-456/tiny.jpg',
        variants: [],
      }),
    })

    // Only 1 GetObject, no PutObject calls
    expect(mockSend).toHaveBeenCalledTimes(1)
    expect(mockResize).not.toHaveBeenCalled()
  })

  it('skips non-image files (e.g. .txt, .webp, .pdf)', async () => {
    const key = 'uploads/artist-123/notes.txt'
    const event = createS3Event(BUCKET, key)

    const result = await handler(event, context)

    expect(result).toEqual({
      statusCode: 200,
      body: JSON.stringify({
        message: 'Skipped non-image file: uploads/artist-123/notes.txt',
      }),
    })

    // Should not call S3 at all
    expect(mockSend).not.toHaveBeenCalled()
  })

  it('skips .webp files to avoid processing its own output', async () => {
    const key = 'uploads/artist-123/listing-456/photo/400w.webp'
    const event = createS3Event(BUCKET, key)

    const result = await handler(event, context)

    expect(result).toEqual({
      statusCode: 200,
      body: JSON.stringify({
        message: 'Skipped non-image file: uploads/artist-123/listing-456/photo/400w.webp',
      }),
    })

    expect(mockSend).not.toHaveBeenCalled()
  })

  it('handles URL-encoded S3 keys (spaces become +)', async () => {
    const key = 'uploads/artist-123/my+photo.jpg'
    const event = createS3Event(BUCKET, key)

    const fakeImage = Buffer.from('fake-image-data')
    mockSend.mockResolvedValueOnce({ Body: createS3Body(fakeImage) })

    mockMetadata.mockResolvedValue({ width: 2000, height: 1500 })

    const variant400 = Buffer.from('webp-400')
    const variant800 = Buffer.from('webp-800')
    const variant1200 = Buffer.from('webp-1200')
    mockToBuffer
      .mockResolvedValueOnce(variant400)
      .mockResolvedValueOnce(variant800)
      .mockResolvedValueOnce(variant1200)

    mockSend
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({})

    const result = await handler(event, context)

    expect(result).toEqual({
      statusCode: 200,
      body: JSON.stringify({
        message: 'Processed 3 variant(s) for uploads/artist-123/my photo.jpg',
        variants: [
          'uploads/artist-123/my photo/400w.webp',
          'uploads/artist-123/my photo/800w.webp',
          'uploads/artist-123/my photo/1200w.webp',
        ],
      }),
    })
  })

  it('returns error response when S3 GetObject fails', async () => {
    const key = 'uploads/artist-123/listing-456/photo.jpg'
    const event = createS3Event(BUCKET, key)

    mockSend.mockRejectedValueOnce(new Error('Access Denied'))

    const result = await handler(event, context)

    expect(result).toEqual({
      statusCode: 500,
      body: JSON.stringify({
        message: 'Failed to process uploads/artist-123/listing-456/photo.jpg',
        error: 'Access Denied',
      }),
    })
  })

  it('returns error response when Sharp processing fails', async () => {
    const key = 'uploads/artist-123/listing-456/corrupt.jpg'
    const event = createS3Event(BUCKET, key)

    const fakeImage = Buffer.from('corrupt-data')
    mockSend.mockResolvedValueOnce({ Body: createS3Body(fakeImage) })

    mockMetadata.mockRejectedValue(new Error('Input buffer contains unsupported image format'))

    const result = await handler(event, context)

    expect(result).toEqual({
      statusCode: 500,
      body: JSON.stringify({
        message: 'Failed to process uploads/artist-123/listing-456/corrupt.jpg',
        error: 'Input buffer contains unsupported image format',
      }),
    })
  })

  it('returns error response when S3 PutObject fails', async () => {
    const key = 'uploads/artist-123/listing-456/photo.jpg'
    const event = createS3Event(BUCKET, key)

    const fakeImage = Buffer.from('fake-image-data')
    mockSend.mockResolvedValueOnce({ Body: createS3Body(fakeImage) })

    mockMetadata.mockResolvedValue({ width: 2000, height: 1500 })

    const variant400 = Buffer.from('webp-400')
    mockToBuffer.mockResolvedValueOnce(variant400)

    // PutObject fails
    mockSend.mockRejectedValueOnce(new Error('Bucket quota exceeded'))

    const result = await handler(event, context)

    expect(result).toEqual({
      statusCode: 500,
      body: JSON.stringify({
        message: 'Failed to process uploads/artist-123/listing-456/photo.jpg',
        error: 'Bucket quota exceeded',
      }),
    })
  })

  it('handles events with no records gracefully', async () => {
    const event: S3Event = { Records: [] }

    const result = await handler(event, context)

    expect(result).toEqual({
      statusCode: 200,
      body: JSON.stringify({ message: 'No records to process' }),
    })
  })

  it('processes multiple records in a single event', async () => {
    const event = createS3Event(BUCKET, 'uploads/artist-1/photo1.jpg')
    // Add a second record
    const secondRecord = { ...event.Records[0]! }
    secondRecord.s3 = {
      ...secondRecord.s3,
      object: { ...secondRecord.s3.object, key: 'uploads/artist-2/photo2.png' },
    }
    event.Records.push(secondRecord)

    // First image: 2000px wide
    const fakeImage1 = Buffer.from('image-1')
    mockSend.mockResolvedValueOnce({ Body: createS3Body(fakeImage1) })
    mockMetadata.mockResolvedValueOnce({ width: 2000, height: 1500 })
    mockToBuffer
      .mockResolvedValueOnce(Buffer.from('v1-400'))
      .mockResolvedValueOnce(Buffer.from('v1-800'))
      .mockResolvedValueOnce(Buffer.from('v1-1200'))
    mockSend
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({})

    // Second image: 500px wide (only 400w variant)
    const fakeImage2 = Buffer.from('image-2')
    mockSend.mockResolvedValueOnce({ Body: createS3Body(fakeImage2) })
    mockMetadata.mockResolvedValueOnce({ width: 500, height: 400 })
    mockToBuffer.mockResolvedValueOnce(Buffer.from('v2-400'))
    mockSend.mockResolvedValueOnce({})

    const result = await handler(event, context)

    // Should report results for both images
    expect(result.statusCode).toBe(200)
    const body = JSON.parse(result.body)
    expect(body.results).toHaveLength(2)
    expect(body.results[0].variants).toHaveLength(3)
    expect(body.results[1].variants).toHaveLength(1)
  })

  it('strips file extension correctly for variant key naming', async () => {
    const key = 'uploads/artist-123/my.complex.name.jpeg'
    const event = createS3Event(BUCKET, key)

    const fakeImage = Buffer.from('fake')
    mockSend.mockResolvedValueOnce({ Body: createS3Body(fakeImage) })

    // Only generates 400w variant
    mockMetadata.mockResolvedValue({ width: 500, height: 400 })
    mockToBuffer.mockResolvedValueOnce(Buffer.from('webp'))
    mockSend.mockResolvedValueOnce({})

    const result = await handler(event, context)
    const body = JSON.parse(result.body)

    // Should strip only the final extension
    expect(body.variants[0]).toBe('uploads/artist-123/my.complex.name/400w.webp')
  })

  it('handles missing Body in S3 GetObject response', async () => {
    const key = 'uploads/artist-123/photo.jpg'
    const event = createS3Event(BUCKET, key)

    mockSend.mockResolvedValueOnce({ Body: undefined })

    const result = await handler(event, context)

    expect(result).toEqual({
      statusCode: 500,
      body: JSON.stringify({
        message: 'Failed to process uploads/artist-123/photo.jpg',
        error: 'Empty response body from S3',
      }),
    })
  })
})
