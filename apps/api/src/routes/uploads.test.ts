import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Hono } from 'hono'
import { createUploadRoutes } from './uploads'
import { setVerifier, resetVerifier } from '../middleware/auth'
import { setS3Client, resetS3Client } from '../lib/s3'
import type { PrismaClient } from '@surfaced-art/db'

// Mock createPresignedPost — must be hoisted
vi.mock('@aws-sdk/s3-presigned-post', () => ({
  createPresignedPost: vi.fn(),
}))

import { createPresignedPost } from '@aws-sdk/s3-presigned-post'
const mockCreatePresignedPost = vi.mocked(createPresignedPost)

// ─── Test helpers ────────────────────────────────────────────────────

function createMockVerifier(sub = 'cognito-123', email = 'artist@example.com', name = 'Test Artist') {
  return {
    verify: vi.fn().mockResolvedValue({ sub, email, name }),
  } as unknown as ReturnType<typeof setVerifier extends (v: infer T) => void ? () => T : never>
}

function createMockPrisma(roles: string[] = ['artist']) {
  return {
    user: {
      findUnique: vi.fn().mockResolvedValue({
        id: 'user-uuid-123',
        cognitoId: 'cognito-123',
        email: 'artist@example.com',
        fullName: 'Test Artist',
        roles: roles.map((r) => ({ role: r })),
      }),
    },
  } as unknown as PrismaClient
}

function createTestApp(prisma: PrismaClient) {
  const app = new Hono()
  app.route('/uploads', createUploadRoutes(prisma))
  return app
}

function postPresignedUrl(
  app: ReturnType<typeof createTestApp>,
  body: unknown,
  token?: string,
) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return app.request('/uploads/presigned-url', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
}

const validBody = {
  context: 'listing',
  contentType: 'image/jpeg',
}

// ─── Tests ───────────────────────────────────────────────────────────

describe('POST /uploads/presigned-url', () => {
  const originalEnv = process.env.S3_BUCKET_NAME

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.S3_BUCKET_NAME = 'test-bucket'

    // Set up mock verifier
    setVerifier(createMockVerifier() as never)

    // Set up mock S3 client
    setS3Client({} as never)

    // Set up mock presigned post response
    mockCreatePresignedPost.mockResolvedValue({
      url: 'https://test-bucket.s3.amazonaws.com',
      fields: {
        key: 'uploads/listing/user-uuid-123/test-uuid.jpg',
        Policy: 'base64policy',
        'X-Amz-Signature': 'sig123',
      },
    })
  })

  afterEach(() => {
    resetVerifier()
    resetS3Client()
    if (originalEnv !== undefined) {
      process.env.S3_BUCKET_NAME = originalEnv
    } else {
      delete process.env.S3_BUCKET_NAME
    }
  })

  describe('authentication', () => {
    it('should return 401 without auth token', async () => {
      const prisma = createMockPrisma()
      const app = createTestApp(prisma)

      const res = await postPresignedUrl(app, validBody)
      expect(res.status).toBe(401)

      const body = await res.json()
      expect(body.error.code).toBe('UNAUTHORIZED')
    })

    it('should return 403 for buyer role (no artist/admin)', async () => {
      const prisma = createMockPrisma(['buyer'])
      const app = createTestApp(prisma)

      const res = await postPresignedUrl(app, validBody, 'valid-token')
      expect(res.status).toBe(403)

      const body = await res.json()
      expect(body.error.code).toBe('FORBIDDEN')
    })

    it('should allow artist role', async () => {
      const prisma = createMockPrisma(['artist'])
      const app = createTestApp(prisma)

      const res = await postPresignedUrl(app, validBody, 'valid-token')
      expect(res.status).toBe(200)
    })

    it('should allow admin role', async () => {
      const prisma = createMockPrisma(['admin'])
      const app = createTestApp(prisma)

      const res = await postPresignedUrl(app, validBody, 'valid-token')
      expect(res.status).toBe(200)
    })
  })

  describe('validation', () => {
    it('should return 400 for missing body', async () => {
      const prisma = createMockPrisma()
      const app = createTestApp(prisma)

      const res = await app.request('/uploads/presigned-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer valid-token',
        },
        body: JSON.stringify({}),
      })
      expect(res.status).toBe(400)
    })

    it('should return 400 for invalid content type', async () => {
      const prisma = createMockPrisma()
      const app = createTestApp(prisma)

      const res = await postPresignedUrl(
        app,
        { context: 'listing', contentType: 'image/gif' },
        'valid-token',
      )
      expect(res.status).toBe(400)

      const body = await res.json()
      expect(body.error.code).toBe('VALIDATION_ERROR')
    })

    it('should return 400 for invalid context', async () => {
      const prisma = createMockPrisma()
      const app = createTestApp(prisma)

      const res = await postPresignedUrl(
        app,
        { context: 'avatar', contentType: 'image/jpeg' },
        'valid-token',
      )
      expect(res.status).toBe(400)
    })

    it('should return 400 for malformed JSON', async () => {
      const prisma = createMockPrisma()
      const app = createTestApp(prisma)

      const res = await app.request('/uploads/presigned-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer valid-token',
        },
        body: 'not valid json{',
      })
      expect(res.status).toBe(400)
    })
  })

  describe('success response', () => {
    it('should return 200 with presigned post data', async () => {
      const prisma = createMockPrisma()
      const app = createTestApp(prisma)

      const res = await postPresignedUrl(app, validBody, 'valid-token')
      expect(res.status).toBe(200)

      const body = await res.json()
      expect(body.url).toBe('https://test-bucket.s3.amazonaws.com')
      expect(body.fields).toBeDefined()
      expect(body.key).toBeDefined()
      expect(body.expiresIn).toBe(900)
    })

    it('should generate S3 key with correct pattern: uploads/{context}/{userId}/{uuid}.{ext}', async () => {
      const prisma = createMockPrisma()
      const app = createTestApp(prisma)

      await postPresignedUrl(app, validBody, 'valid-token')

      expect(mockCreatePresignedPost).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          Key: expect.stringMatching(
            /^uploads\/listing\/user-uuid-123\/[0-9a-f-]+\.jpg$/,
          ),
        }),
      )
    })

    it('should use correct key prefix for each context', async () => {
      const prisma = createMockPrisma()
      const app = createTestApp(prisma)

      for (const context of ['profile', 'cover', 'listing', 'process']) {
        vi.clearAllMocks()
        mockCreatePresignedPost.mockResolvedValue({
          url: 'https://test-bucket.s3.amazonaws.com',
          fields: { key: `uploads/${context}/user-uuid-123/test.jpg` },
        })

        await postPresignedUrl(
          app,
          { context, contentType: 'image/jpeg' },
          'valid-token',
        )

        expect(mockCreatePresignedPost).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            Key: expect.stringContaining(`uploads/${context}/user-uuid-123/`),
          }),
        )
      }
    })

    it('should use correct file extension for each content type', async () => {
      const prisma = createMockPrisma()
      const app = createTestApp(prisma)

      const cases = [
        { contentType: 'image/jpeg', ext: 'jpg' },
        { contentType: 'image/png', ext: 'png' },
        { contentType: 'image/webp', ext: 'webp' },
      ]

      for (const { contentType, ext } of cases) {
        vi.clearAllMocks()
        mockCreatePresignedPost.mockResolvedValue({
          url: 'https://test-bucket.s3.amazonaws.com',
          fields: { key: `uploads/listing/user-uuid-123/test.${ext}` },
        })

        await postPresignedUrl(
          app,
          { context: 'listing', contentType },
          'valid-token',
        )

        expect(mockCreatePresignedPost).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            Key: expect.stringMatching(new RegExp(`\\.${ext}$`)),
          }),
        )
      }
    })
  })

  describe('presigned POST policy conditions', () => {
    it('should include content-length-range condition (0 to 2MB)', async () => {
      const prisma = createMockPrisma()
      const app = createTestApp(prisma)

      await postPresignedUrl(app, validBody, 'valid-token')

      expect(mockCreatePresignedPost).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          Conditions: expect.arrayContaining([
            ['content-length-range', 0, 2 * 1024 * 1024],
          ]),
        }),
      )
    })

    it('should include Content-Type condition', async () => {
      const prisma = createMockPrisma()
      const app = createTestApp(prisma)

      await postPresignedUrl(app, validBody, 'valid-token')

      expect(mockCreatePresignedPost).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          Conditions: expect.arrayContaining([
            ['eq', '$Content-Type', 'image/jpeg'],
          ]),
        }),
      )
    })

    it('should include key prefix condition', async () => {
      const prisma = createMockPrisma()
      const app = createTestApp(prisma)

      await postPresignedUrl(app, validBody, 'valid-token')

      expect(mockCreatePresignedPost).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          Conditions: expect.arrayContaining([
            ['starts-with', '$key', 'uploads/listing/user-uuid-123/'],
          ]),
        }),
      )
    })
  })

  describe('error handling', () => {
    it('should return 500 when S3_BUCKET_NAME is missing', async () => {
      delete process.env.S3_BUCKET_NAME

      const prisma = createMockPrisma()
      const app = createTestApp(prisma)

      const res = await postPresignedUrl(app, validBody, 'valid-token')
      expect(res.status).toBe(500)

      const body = await res.json()
      expect(body.error.code).toBe('INTERNAL_ERROR')
    })

    it('should return 500 when createPresignedPost throws', async () => {
      mockCreatePresignedPost.mockRejectedValue(new Error('S3 error'))

      const prisma = createMockPrisma()
      const app = createTestApp(prisma)

      const res = await postPresignedUrl(app, validBody, 'valid-token')
      expect(res.status).toBe(500)

      const body = await res.json()
      expect(body.error.code).toBe('INTERNAL_ERROR')
    })
  })
})
