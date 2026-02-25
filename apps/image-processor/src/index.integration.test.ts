/**
 * Integration tests for the image-processor Lambda handler.
 *
 * These tests use REAL Sharp processing (not mocked) with test fixture images
 * to verify actual WebP variant output: correct dimensions, aspect ratios,
 * format, and S3 key naming. S3 is mocked to capture PutObject calls and
 * serve fixture files for GetObject.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { join } from 'node:path'
import sharp from 'sharp'
import type { S3Event, S3EventRecord, Context } from 'aws-lambda'

// ---------------------------------------------------------------------------
// Test fixture paths
// ---------------------------------------------------------------------------

const FIXTURES_DIR = join(import.meta.dirname, '__fixtures__')
const FIXTURE_JPEG_LARGE = join(FIXTURES_DIR, 'test-1600x1200.jpg')
const FIXTURE_PNG_LARGE = join(FIXTURES_DIR, 'test-1600x1200.png')
const FIXTURE_JPEG_SMALL = join(FIXTURES_DIR, 'test-300x200.jpg')
const FIXTURE_JPEG_PORTRAIT = join(FIXTURES_DIR, 'test-600x900.jpg')

// ---------------------------------------------------------------------------
// S3 mock — captures PutObject calls, serves fixtures for GetObject
//
// vi.hoisted ensures mockSend is available when vi.mock factory runs
// (vi.mock is hoisted above all other code by Vitest).
// ---------------------------------------------------------------------------

const { mockSend } = vi.hoisted(() => {
  const _uploadedVariants = new Map<string, Buffer>()
  const _s3Store = new Map<string, string>()

  const mockSend = vi.fn(async (command: unknown) => {
    const cmd = command as Record<string, unknown>
    const ctorName = cmd.constructor?.name ?? ''

    if (ctorName === 'GetObjectCommand') {
      const key = cmd.Key as string
      const fixturePath = _s3Store.get(key)
      if (!fixturePath) {
        const err = new Error(`NoSuchKey: ${key}`)
        err.name = 'NoSuchKey'
        throw err
      }
      // Dynamic import avoids hoisting issues with node:fs
      const fs = await import('node:fs')
      const buffer = fs.readFileSync(fixturePath)
      return {
        Body: {
          transformToByteArray: async () => new Uint8Array(buffer),
        },
      }
    }

    if (ctorName === 'PutObjectCommand') {
      const key = cmd.Key as string
      const body = cmd.Body as Buffer
      _uploadedVariants.set(key, Buffer.from(body))
      return {}
    }

    return {}
  })

  // Expose the maps so tests outside the hoisted block can access them.
  // We assign to the outer maps in beforeEach via a helper.
  ;(mockSend as Record<string, unknown>)._uploadedVariants = _uploadedVariants
  ;(mockSend as Record<string, unknown>)._s3Store = _s3Store

  return { mockSend }
})

// Wire the hoisted maps to the outer references for test access
const _hoistedUploads = (mockSend as Record<string, unknown>)._uploadedVariants as Map<string, Buffer>
const _hoistedStore = (mockSend as Record<string, unknown>)._s3Store as Map<string, string>

vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: class {
    send = mockSend
  },
  GetObjectCommand: class {
    Key: string
    Bucket: string
    constructor(params: { Key: string; Bucket: string }) {
      this.Key = params.Key
      this.Bucket = params.Bucket
    }
  },
  PutObjectCommand: class {
    Key: string
    Bucket: string
    Body: unknown
    ContentType?: string
    CacheControl?: string
    constructor(params: Record<string, unknown>) {
      this.Key = params.Key as string
      this.Bucket = params.Bucket as string
      this.Body = params.Body
      this.ContentType = params.ContentType as string | undefined
      this.CacheControl = params.CacheControl as string | undefined
    }
  },
}))

// Import handler AFTER mocks are set up
import { handler } from './index.js'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createS3Event(bucket: string, key: string): S3Event {
  const record: S3EventRecord = {
    eventVersion: '2.1',
    eventSource: 'aws:s3',
    awsRegion: 'us-east-1',
    eventTime: new Date().toISOString(),
    eventName: 'ObjectCreated:Put',
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
        key: encodeURIComponent(key).replace(/%2F/g, '/'),
        size: 1000,
        eTag: 'test-etag',
        sequencer: '0',
      },
    },
  }
  return { Records: [record] }
}

const stubContext: Context = {
  callbackWaitsForEmptyEventLoop: false,
  functionName: 'test',
  functionVersion: '1',
  invokedFunctionArn: 'arn:aws:lambda:us-east-1:123:function:test',
  memoryLimitInMB: '512',
  awsRequestId: 'test-request-id',
  logGroupName: '/aws/lambda/test',
  logStreamName: 'test-stream',
  getRemainingTimeInMillis: () => 30000,
  done: () => {},
  fail: () => {},
  succeed: () => {},
}

const TEST_BUCKET = 'test-media-bucket'

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('image-processor integration tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    _hoistedUploads.clear()
    _hoistedStore.clear()
  })

  it('generates 3 WebP variants at 400, 800, 1200px for a 1600px JPEG', async () => {
    const s3Key = 'uploads/seed/artists/test/listings/photo.jpg'
    _hoistedStore.set(s3Key, FIXTURE_JPEG_LARGE)

    const event = createS3Event(TEST_BUCKET, s3Key)
    const result = await handler(event, stubContext)

    expect(result.statusCode).toBe(200)
    const body = JSON.parse(result.body)
    expect(body.variants).toHaveLength(3)
    expect(body.variants).toEqual([
      'uploads/seed/artists/test/listings/photo/400w.webp',
      'uploads/seed/artists/test/listings/photo/800w.webp',
      'uploads/seed/artists/test/listings/photo/1200w.webp',
    ])

    // Verify all 3 variants were uploaded
    expect(_hoistedUploads.size).toBe(3)

    // Verify each variant is valid WebP with correct width
    for (const [width, key] of [
      [400, 'uploads/seed/artists/test/listings/photo/400w.webp'],
      [800, 'uploads/seed/artists/test/listings/photo/800w.webp'],
      [1200, 'uploads/seed/artists/test/listings/photo/1200w.webp'],
    ] as const) {
      const buffer = _hoistedUploads.get(key)!
      expect(buffer).toBeDefined()
      const metadata = await sharp(buffer).metadata()
      expect(metadata.format).toBe('webp')
      expect(metadata.width).toBe(width)
    }
  })

  it('maintains correct aspect ratio in generated variants', async () => {
    const s3Key = 'uploads/seed/artists/test/listings/landscape.jpg'
    _hoistedStore.set(s3Key, FIXTURE_JPEG_LARGE)

    const event = createS3Event(TEST_BUCKET, s3Key)
    await handler(event, stubContext)

    // Original is 1600x1200 (4:3 ratio)
    // Each variant should maintain the ratio: height = width * (1200/1600) = width * 0.75
    for (const [width, key] of [
      [400, 'uploads/seed/artists/test/listings/landscape/400w.webp'],
      [800, 'uploads/seed/artists/test/listings/landscape/800w.webp'],
      [1200, 'uploads/seed/artists/test/listings/landscape/1200w.webp'],
    ] as const) {
      const buffer = _hoistedUploads.get(key)!
      const metadata = await sharp(buffer).metadata()
      expect(metadata.width).toBe(width)
      expect(metadata.height).toBe(Math.round(width * (1200 / 1600)))
    }
  })

  it('stores variants with the correct S3 key naming convention', async () => {
    const s3Key = 'uploads/seed/artists/abbey-peters/listings/ocean-breeze.jpg'
    _hoistedStore.set(s3Key, FIXTURE_JPEG_LARGE)

    const event = createS3Event(TEST_BUCKET, s3Key)
    await handler(event, stubContext)

    // Verify naming: {original-key-without-extension}/{width}w.webp
    const expectedKeys = [
      'uploads/seed/artists/abbey-peters/listings/ocean-breeze/400w.webp',
      'uploads/seed/artists/abbey-peters/listings/ocean-breeze/800w.webp',
      'uploads/seed/artists/abbey-peters/listings/ocean-breeze/1200w.webp',
    ]
    for (const key of expectedKeys) {
      expect(_hoistedUploads.has(key)).toBe(true)
    }
  })

  it('processes a PNG upload identically to JPEG', async () => {
    const s3Key = 'uploads/seed/artists/test/listings/artwork.png'
    _hoistedStore.set(s3Key, FIXTURE_PNG_LARGE)

    const event = createS3Event(TEST_BUCKET, s3Key)
    const result = await handler(event, stubContext)

    expect(result.statusCode).toBe(200)
    const body = JSON.parse(result.body)
    expect(body.variants).toHaveLength(3)

    // Verify PNG source produces valid WebP variants at correct widths
    for (const [width, key] of [
      [400, 'uploads/seed/artists/test/listings/artwork/400w.webp'],
      [800, 'uploads/seed/artists/test/listings/artwork/800w.webp'],
      [1200, 'uploads/seed/artists/test/listings/artwork/1200w.webp'],
    ] as const) {
      const buffer = _hoistedUploads.get(key)!
      expect(buffer).toBeDefined()
      const metadata = await sharp(buffer).metadata()
      expect(metadata.format).toBe('webp')
      expect(metadata.width).toBe(width)
    }
  })

  it('does not upscale images smaller than all target widths', async () => {
    // 300x200 image — smaller than 400px, so no variants should be generated
    const s3Key = 'uploads/seed/artists/test/listings/tiny.jpg'
    _hoistedStore.set(s3Key, FIXTURE_JPEG_SMALL)

    const event = createS3Event(TEST_BUCKET, s3Key)
    const result = await handler(event, stubContext)

    expect(result.statusCode).toBe(200)
    const body = JSON.parse(result.body)
    expect(body.variants).toHaveLength(0)
    expect(_hoistedUploads.size).toBe(0)
  })

  it('generates only variants for widths smaller than the source', async () => {
    // 600x900 portrait — should only generate 400w variant (600 > 400 but 600 <= 800)
    const s3Key = 'uploads/seed/artists/test/listings/portrait.jpg'
    _hoistedStore.set(s3Key, FIXTURE_JPEG_PORTRAIT)

    const event = createS3Event(TEST_BUCKET, s3Key)
    const result = await handler(event, stubContext)

    expect(result.statusCode).toBe(200)
    const body = JSON.parse(result.body)
    expect(body.variants).toHaveLength(1)
    expect(body.variants[0]).toBe(
      'uploads/seed/artists/test/listings/portrait/400w.webp'
    )

    // Verify the 400w variant has correct dimensions (portrait aspect ratio)
    const buffer = _hoistedUploads.get(body.variants[0])!
    const metadata = await sharp(buffer).metadata()
    expect(metadata.format).toBe('webp')
    expect(metadata.width).toBe(400)
    // 600x900 → 400w should be 400x600 (2:3 ratio)
    expect(metadata.height).toBe(600)
  })

  it('preserves the original image unchanged (no delete or overwrite)', async () => {
    const s3Key = 'uploads/seed/artists/test/listings/original.jpg'
    _hoistedStore.set(s3Key, FIXTURE_JPEG_LARGE)

    const event = createS3Event(TEST_BUCKET, s3Key)
    await handler(event, stubContext)

    // Verify no PutObject was called with the original key
    const uploadedKeys = Array.from(_hoistedUploads.keys())
    expect(uploadedKeys).not.toContain(s3Key)

    // Verify only variant keys were uploaded (all end in /NNNw.webp)
    for (const key of uploadedKeys) {
      expect(key).toMatch(/\/\d+w\.webp$/)
    }
  })

  it('skips non-image files gracefully', async () => {
    const s3Key = 'uploads/seed/artists/test/document.pdf'
    // No fixture needed — handler should skip before attempting S3 fetch

    const event = createS3Event(TEST_BUCKET, s3Key)
    const result = await handler(event, stubContext)

    expect(result.statusCode).toBe(200)
    const body = JSON.parse(result.body)
    expect(body.message).toContain('Skipped non-image file')
    expect(_hoistedUploads.size).toBe(0)
    // S3 GetObject should not have been called
    expect(mockSend).not.toHaveBeenCalled()
  })

  it('completes processing of a large image within a reasonable time', async () => {
    const s3Key = 'uploads/seed/artists/test/listings/large.jpg'
    _hoistedStore.set(s3Key, FIXTURE_JPEG_LARGE)

    const event = createS3Event(TEST_BUCKET, s3Key)

    const start = performance.now()
    const result = await handler(event, stubContext)
    const elapsed = performance.now() - start

    expect(result.statusCode).toBe(200)
    // Processing a ~12KB test image through Sharp should complete well under 10s
    // Real 2MB images on Lambda (512MB memory) complete in ~3-5s
    expect(elapsed).toBeLessThan(10_000)
  })

  it('uploads variants with correct ContentType and CacheControl headers', async () => {
    const s3Key = 'uploads/seed/artists/test/listings/headers.jpg'
    _hoistedStore.set(s3Key, FIXTURE_JPEG_LARGE)

    const event = createS3Event(TEST_BUCKET, s3Key)
    await handler(event, stubContext)

    // Verify PutObject was called with correct headers for each variant
    const putCalls = mockSend.mock.calls.filter(
      ([cmd]: [unknown]) =>
        (cmd as Record<string, unknown>).constructor?.name === 'PutObjectCommand'
    )
    expect(putCalls).toHaveLength(3)

    for (const [cmd] of putCalls) {
      const putCmd = cmd as Record<string, unknown>
      expect(putCmd.ContentType).toBe('image/webp')
      expect(putCmd.CacheControl).toBe('public, max-age=31536000, immutable')
      expect(putCmd.Bucket).toBe(TEST_BUCKET)
    }
  })
})
