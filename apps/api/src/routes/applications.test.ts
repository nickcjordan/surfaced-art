import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'
import { createApplicationRoutes } from './applications'

const validApplication = {
  fullName: 'Jane Artist',
  email: 'jane@example.com',
  instagramUrl: 'https://instagram.com/janeartist',
  websiteUrl: 'https://janeartist.com',
  statement:
    'I create handmade ceramics that explore the intersection of form and function in everyday life.',
  exhibitionHistory: 'Solo show at Local Gallery, 2024',
  categories: ['ceramics', 'mixed_media'],
}

const minimalApplication = {
  fullName: 'Jane Artist',
  email: 'jane@example.com',
  statement:
    'I create handmade ceramics that explore the intersection of form and function in everyday life.',
  categories: ['ceramics'],
}

function createMockPrisma(overrides?: {
  findUnique?: unknown
  create?: unknown
  update?: unknown
  createError?: Error
}) {
  return {
    artistApplication: {
      findUnique: vi.fn().mockResolvedValue(overrides?.findUnique ?? null),
      create: overrides?.createError
        ? vi.fn().mockRejectedValue(overrides.createError)
        : vi.fn().mockResolvedValue(
            overrides?.create ?? {
              id: '550e8400-e29b-41d4-a716-446655440030',
              email: 'jane@example.com',
              fullName: 'Jane Artist',
              status: 'pending',
              submittedAt: new Date('2025-02-27T00:00:00Z'),
            }
          ),
      update: vi.fn().mockResolvedValue(
        overrides?.update ?? {
          id: '550e8400-e29b-41d4-a716-446655440030',
          email: 'jane@example.com',
          fullName: 'Jane Artist',
          status: 'pending',
          submittedAt: new Date('2025-02-27T00:00:00Z'),
        }
      ),
    },
  } as unknown as Parameters<typeof createApplicationRoutes>[0]
}

function createTestApp(prisma: ReturnType<typeof createMockPrisma>) {
  const app = new Hono()
  app.route('/artists/apply', createApplicationRoutes(prisma))
  return app
}

function postApply(app: ReturnType<typeof createTestApp>, body: unknown) {
  return app.request('/artists/apply', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function getCheckEmail(app: ReturnType<typeof createTestApp>, email: string) {
  return app.request(`/artists/apply/check-email?email=${encodeURIComponent(email)}`)
}

describe('POST /artists/apply', () => {
  let mockPrisma: ReturnType<typeof createMockPrisma>
  let app: ReturnType<typeof createTestApp>

  describe('successful submission', () => {
    beforeEach(() => {
      vi.clearAllMocks()
      mockPrisma = createMockPrisma()
      app = createTestApp(mockPrisma)
    })

    it('should return 201 for valid complete submission', async () => {
      const res = await postApply(app, validApplication)
      expect(res.status).toBe(201)

      const body = await res.json()
      expect(body.message).toBeDefined()
      expect(body.applicationId).toBeDefined()
    })

    it('should return 201 for valid minimal submission', async () => {
      const res = await postApply(app, minimalApplication)
      expect(res.status).toBe(201)
    })

    it('should call Prisma create with sanitized data', async () => {
      await postApply(app, {
        ...validApplication,
        fullName: '  Jane  <b>Artist</b>  ',
        statement:
          'I create <script>alert("xss")</script> handmade ceramics that explore the intersection of form and function.',
      })

      expect(mockPrisma.artistApplication.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          fullName: 'Jane Artist',
          statement: expect.not.stringContaining('<script>'),
        }),
      })
    })

    it('should normalize email to lowercase', async () => {
      await postApply(app, {
        ...validApplication,
        email: 'Jane@Example.COM',
      })

      expect(mockPrisma.artistApplication.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: 'jane@example.com',
        }),
      })
    })

    it('should convert empty optional strings to null', async () => {
      await postApply(app, {
        ...minimalApplication,
        instagramUrl: '',
        websiteUrl: '',
        exhibitionHistory: '',
      })

      expect(mockPrisma.artistApplication.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          instagramUrl: null,
          websiteUrl: null,
          exhibitionHistory: null,
        }),
      })
    })
  })

  describe('validation errors', () => {
    beforeEach(() => {
      vi.clearAllMocks()
      mockPrisma = createMockPrisma()
      app = createTestApp(mockPrisma)
    })

    it('should return 400 for missing required fields', async () => {
      const res = await postApply(app, {})
      expect(res.status).toBe(400)

      const body = await res.json()
      expect(body.error.code).toBe('VALIDATION_ERROR')
    })

    it('should return 400 for invalid email format', async () => {
      const res = await postApply(app, {
        ...validApplication,
        email: 'not-an-email',
      })
      expect(res.status).toBe(400)

      const body = await res.json()
      expect(body.error.code).toBe('VALIDATION_ERROR')
      expect(body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'email' }),
        ])
      )
    })

    it('should return 400 for statement too short', async () => {
      const res = await postApply(app, {
        ...validApplication,
        statement: 'Too short.',
      })
      expect(res.status).toBe(400)

      const body = await res.json()
      expect(body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'statement' }),
        ])
      )
    })

    it('should return 400 for empty categories array', async () => {
      const res = await postApply(app, {
        ...validApplication,
        categories: [],
      })
      expect(res.status).toBe(400)

      const body = await res.json()
      expect(body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'categories' }),
        ])
      )
    })

    it('should return 400 for invalid category values', async () => {
      const res = await postApply(app, {
        ...validApplication,
        categories: ['not_a_category'],
      })
      expect(res.status).toBe(400)
    })

    it('should return 400 for malformed JSON', async () => {
      const res = await app.request('/artists/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'not valid json{',
      })
      expect(res.status).toBe(400)

      const body = await res.json()
      expect(body.error.code).toBe('BAD_REQUEST')
    })

    it('should not call Prisma for invalid input', async () => {
      await postApply(app, { email: 'bad' })

      expect(mockPrisma.artistApplication.create).not.toHaveBeenCalled()
      expect(mockPrisma.artistApplication.findUnique).not.toHaveBeenCalled()
    })
  })

  describe('duplicate handling', () => {
    it('should return 409 for duplicate email with pending application', async () => {
      vi.clearAllMocks()
      mockPrisma = createMockPrisma({
        findUnique: {
          id: 'existing-id',
          email: 'jane@example.com',
          status: 'pending',
        },
      })
      app = createTestApp(mockPrisma)

      const res = await postApply(app, validApplication)
      expect(res.status).toBe(409)

      const body = await res.json()
      expect(body.error.code).toBe('CONFLICT')
    })

    it('should return 409 for duplicate email with approved application', async () => {
      vi.clearAllMocks()
      mockPrisma = createMockPrisma({
        findUnique: {
          id: 'existing-id',
          email: 'jane@example.com',
          status: 'approved',
        },
      })
      app = createTestApp(mockPrisma)

      const res = await postApply(app, validApplication)
      expect(res.status).toBe(409)

      const body = await res.json()
      expect(body.error.code).toBe('CONFLICT')
    })

    it('should allow resubmission for rejected application', async () => {
      vi.clearAllMocks()
      mockPrisma = createMockPrisma({
        findUnique: {
          id: 'existing-id',
          email: 'jane@example.com',
          status: 'rejected',
        },
      })
      app = createTestApp(mockPrisma)

      const res = await postApply(app, validApplication)
      expect(res.status).toBe(201)

      expect(mockPrisma.artistApplication.update).toHaveBeenCalledWith({
        where: { id: 'existing-id' },
        data: expect.objectContaining({
          fullName: 'Jane Artist',
          status: 'pending',
        }),
      })
    })

    it('should allow resubmission for withdrawn application', async () => {
      vi.clearAllMocks()
      mockPrisma = createMockPrisma({
        findUnique: {
          id: 'existing-id',
          email: 'jane@example.com',
          status: 'withdrawn',
        },
      })
      app = createTestApp(mockPrisma)

      const res = await postApply(app, validApplication)
      expect(res.status).toBe(201)

      expect(mockPrisma.artistApplication.update).toHaveBeenCalled()
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
      const res = await postApply(app, validApplication)
      expect(res.status).toBe(500)

      const body = await res.json()
      expect(body.error.code).toBe('INTERNAL_ERROR')
    })
  })
})

describe('GET /artists/apply/check-email', () => {
  let mockPrisma: ReturnType<typeof createMockPrisma>
  let app: ReturnType<typeof createTestApp>

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return exists: false for new email', async () => {
    mockPrisma = createMockPrisma({ findUnique: null })
    app = createTestApp(mockPrisma)

    const res = await getCheckEmail(app, 'new@example.com')
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.exists).toBe(false)
  })

  it('should return exists: true for existing pending email', async () => {
    mockPrisma = createMockPrisma({
      findUnique: { id: 'existing-id', email: 'existing@example.com', status: 'pending' },
    })
    app = createTestApp(mockPrisma)

    const res = await getCheckEmail(app, 'existing@example.com')
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.exists).toBe(true)
    expect(body.status).toBe('pending')
  })

  it('should return exists: false for rejected email (reapplication allowed)', async () => {
    mockPrisma = createMockPrisma({
      findUnique: { id: 'existing-id', email: 'rejected@example.com', status: 'rejected' },
    })
    app = createTestApp(mockPrisma)

    const res = await getCheckEmail(app, 'rejected@example.com')
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.exists).toBe(false)
  })

  it('should return 400 for invalid email format', async () => {
    mockPrisma = createMockPrisma()
    app = createTestApp(mockPrisma)

    const res = await getCheckEmail(app, 'not-an-email')
    expect(res.status).toBe(400)
  })

  it('should normalize email to lowercase before lookup', async () => {
    mockPrisma = createMockPrisma({ findUnique: null })
    app = createTestApp(mockPrisma)

    await getCheckEmail(app, 'Jane@Example.COM')

    expect(mockPrisma.artistApplication.findUnique).toHaveBeenCalledWith({
      where: { email: 'jane@example.com' },
      select: { id: true, status: true },
    })
  })
})
