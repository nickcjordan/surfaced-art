import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'
import { Prisma } from '@surfaced-art/db'
import { createWaitlistRoutes } from './waitlist'

function createMockPrisma(overrides?: {
  create?: unknown
  createError?: Error
}) {
  return {
    waitlist: {
      create: overrides?.createError
        ? vi.fn().mockRejectedValue(overrides.createError)
        : vi.fn().mockResolvedValue(overrides?.create ?? {
            id: '550e8400-e29b-41d4-a716-446655440020',
            email: 'test@example.com',
            createdAt: new Date('2025-02-01T00:00:00Z'),
          }),
    },
  } as unknown as Parameters<typeof createWaitlistRoutes>[0]
}

function createTestApp(prisma: ReturnType<typeof createMockPrisma>) {
  const app = new Hono()
  app.route('/waitlist', createWaitlistRoutes(prisma))
  return app
}

describe('POST /waitlist', () => {
  let mockPrisma: ReturnType<typeof createMockPrisma>
  let app: ReturnType<typeof createTestApp>

  describe('successful signup', () => {
    beforeEach(() => {
      vi.clearAllMocks()
      mockPrisma = createMockPrisma()
      app = createTestApp(mockPrisma)
    })

    it('should return 201 for valid email', async () => {
      const res = await app.request('/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'newuser@example.com' }),
      })
      expect(res.status).toBe(201)

      const body = await res.json()
      expect(body.message).toBe('Successfully joined the waitlist')
    })

    it('should call Prisma create with the provided email', async () => {
      await app.request('/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'newuser@example.com' }),
      })

      expect(mockPrisma.waitlist.create).toHaveBeenCalledWith({
        data: { email: 'newuser@example.com' },
      })
    })

    it('should normalize email to lowercase', async () => {
      await app.request('/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'User@Example.COM' }),
      })

      expect(mockPrisma.waitlist.create).toHaveBeenCalledWith({
        data: { email: 'user@example.com' },
      })
    })
  })

  describe('invalid input', () => {
    beforeEach(() => {
      vi.clearAllMocks()
      mockPrisma = createMockPrisma()
      app = createTestApp(mockPrisma)
    })

    it('should return 400 for invalid email format', async () => {
      const res = await app.request('/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'not-an-email' }),
      })
      expect(res.status).toBe(400)

      const body = await res.json()
      expect(body.error.code).toBe('VALIDATION_ERROR')
      expect(body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'email', message: 'Invalid email address' }),
        ])
      )
    })

    it('should return 400 for empty email', async () => {
      const res = await app.request('/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: '' }),
      })
      expect(res.status).toBe(400)

      const body = await res.json()
      expect(body.error.code).toBe('VALIDATION_ERROR')
      expect(body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'email', message: 'Email is required' }),
        ])
      )
    })

    it('should return 400 for missing email field', async () => {
      const res = await app.request('/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      expect(res.status).toBe(400)

      const body = await res.json()
      expect(body.error.code).toBe('VALIDATION_ERROR')
    })

    it('should return 400 for non-string email', async () => {
      const res = await app.request('/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 123 }),
      })
      expect(res.status).toBe(400)

      const body = await res.json()
      expect(body.error.code).toBe('VALIDATION_ERROR')
    })

    it('should return 400 for malformed JSON', async () => {
      const res = await app.request('/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'not valid json{',
      })
      expect(res.status).toBe(400)

      const body = await res.json()
      expect(body.error.code).toBe('BAD_REQUEST')
      expect(body.error.message).toBe('Invalid JSON payload')
    })

    it('should not call Prisma for invalid email', async () => {
      await app.request('/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'bad' }),
      })

      expect(mockPrisma.waitlist.create).not.toHaveBeenCalled()
    })
  })

  describe('duplicate email', () => {
    beforeEach(() => {
      vi.clearAllMocks()
      const uniqueError = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed on the fields: (`email`)',
        { code: 'P2002', clientVersion: '5.0.0' }
      )
      mockPrisma = createMockPrisma({ createError: uniqueError })
      app = createTestApp(mockPrisma)
    })

    it('should return 200 with success message for duplicate email', async () => {
      const res = await app.request('/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'existing@example.com' }),
      })
      expect(res.status).toBe(200)

      const body = await res.json()
      // Same success message — don't leak whether email exists
      expect(body.message).toBe('Successfully joined the waitlist')
    })
  })

  describe('unexpected errors', () => {
    beforeEach(() => {
      vi.clearAllMocks()
      mockPrisma = createMockPrisma({
        createError: new Error('Database connection failed'),
      })
      app = createTestApp(mockPrisma)
    })

    it('should return 500 for unexpected database errors', async () => {
      const res = await app.request('/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'user@example.com' }),
      })
      expect(res.status).toBe(500)

      const body = await res.json()
      expect(body.error.code).toBe('INTERNAL_ERROR')
      expect(body.error.message).toBe('Internal server error')
    })
  })
})
