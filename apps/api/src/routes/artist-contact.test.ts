import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'
import { createArtistContactRoutes } from './artist-contact'

// Mock email module
vi.mock('@surfaced-art/email', () => ({
  sendEmail: vi.fn().mockResolvedValue({ success: true, messageId: 'msg-123' }),
  ArtistContactMessage: vi.fn(() => null),
}))

const mockArtist = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  displayName: 'Abbey Peters',
  contactEmail: 'abbey@example.com',
  contactEnabled: true,
  status: 'approved' as const,
}

const validBody = {
  firstName: 'Jane',
  lastName: 'Smith',
  email: 'jane@example.com',
  subject: 'Interested in a commission',
  message: 'I love your ceramic work. Would you be open to a custom piece for my home?',
}

function createMockPrisma(findUniqueResult: unknown = null, messageCount = 0) {
  return {
    artistProfile: {
      findUnique: vi.fn().mockResolvedValue(findUniqueResult),
    },
    contactMessage: {
      count: vi.fn().mockResolvedValue(messageCount),
      create: vi.fn().mockResolvedValue({ id: 'msg-1' }),
    },
  } as unknown as Parameters<typeof createArtistContactRoutes>[0]
}

function createTestApp(prisma: ReturnType<typeof createMockPrisma>) {
  const app = new Hono()
  app.route('/artists', createArtistContactRoutes(prisma))
  return app
}

async function postContact(
  app: ReturnType<typeof createTestApp>,
  slug: string,
  body: Record<string, unknown>,
) {
  return app.request(`/artists/${slug}/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /artists/:slug/contact', () => {
  let mockPrisma: ReturnType<typeof createMockPrisma>
  let app: ReturnType<typeof createTestApp>

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('happy path', () => {
    beforeEach(() => {
      mockPrisma = createMockPrisma(mockArtist)
      app = createTestApp(mockPrisma)
    })

    it('should return 200 with success message', async () => {
      const res = await postContact(app, 'abbey-peters', validBody)
      expect(res.status).toBe(200)

      const data = await res.json()
      expect(data.message).toBe('Your message has been sent')
    })

    it('should store the message in the database', async () => {
      await postContact(app, 'abbey-peters', validBody)

      expect(mockPrisma.contactMessage.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          artistId: mockArtist.id,
          senderName: 'Jane Smith',
          senderEmail: 'jane@example.com',
          subject: 'Interested in a commission',
          message: expect.stringContaining('ceramic work'),
        }),
      })
    })

    it('should send an email to the artist', async () => {
      const { sendEmail } = await import('@surfaced-art/email')

      await postContact(app, 'abbey-peters', validBody)

      expect(sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'abbey@example.com',
          subject: '[Surfaced Art] Interested in a commission',
          replyTo: 'jane@example.com',
        }),
      )
    })

    it('should look up the artist by slug', async () => {
      await postContact(app, 'abbey-peters', validBody)

      expect(mockPrisma.artistProfile.findUnique).toHaveBeenCalledWith({
        where: { slug: 'abbey-peters' },
        select: {
          id: true,
          displayName: true,
          contactEmail: true,
          contactEnabled: true,
          status: true,
        },
      })
    })

    it('should check rate limit for the sender/artist pair', async () => {
      await postContact(app, 'abbey-peters', validBody)

      expect(mockPrisma.contactMessage.count).toHaveBeenCalledWith({
        where: {
          artistId: mockArtist.id,
          senderEmail: 'jane@example.com',
          sentAt: { gte: expect.any(Date) },
        },
      })
    })
  })

  describe('honeypot', () => {
    beforeEach(() => {
      mockPrisma = createMockPrisma(mockArtist)
      app = createTestApp(mockPrisma)
    })

    it('should silently accept when honeypot field is filled', async () => {
      const res = await postContact(app, 'abbey-peters', {
        ...validBody,
        website: 'http://spambot.com',
      })

      // Returns 200 but doesn't actually process
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.message).toBe('Your message has been sent')

      // Should not look up artist or store message
      expect(mockPrisma.artistProfile.findUnique).not.toHaveBeenCalled()
      expect(mockPrisma.contactMessage.create).not.toHaveBeenCalled()
    })
  })

  describe('validation errors', () => {
    beforeEach(() => {
      mockPrisma = createMockPrisma(mockArtist)
      app = createTestApp(mockPrisma)
    })

    it('should return 400 for missing required fields', async () => {
      const res = await postContact(app, 'abbey-peters', {})
      expect(res.status).toBe(400)

      const data = await res.json()
      expect(data.error.code).toBe('VALIDATION_ERROR')
    })

    it('should return 400 for invalid email', async () => {
      const res = await postContact(app, 'abbey-peters', {
        ...validBody,
        email: 'not-an-email',
      })
      expect(res.status).toBe(400)
    })

    it('should return 400 for message too short', async () => {
      const res = await postContact(app, 'abbey-peters', {
        ...validBody,
        message: 'Hi',
      })
      expect(res.status).toBe(400)
    })

    it('should return 400 for invalid slug', async () => {
      const res = await postContact(app, 'INVALID SLUG!', validBody)
      expect(res.status).toBe(400)
    })
  })

  describe('artist not found', () => {
    it('should return 404 when artist does not exist', async () => {
      mockPrisma = createMockPrisma(null)
      app = createTestApp(mockPrisma)

      const res = await postContact(app, 'nonexistent', validBody)
      expect(res.status).toBe(404)

      const data = await res.json()
      expect(data.error.code).toBe('NOT_FOUND')
    })

    it('should return 404 when artist is not approved', async () => {
      mockPrisma = createMockPrisma({ ...mockArtist, status: 'pending' })
      app = createTestApp(mockPrisma)

      const res = await postContact(app, 'abbey-peters', validBody)
      expect(res.status).toBe(404)
    })

    it('should return 404 when artist has no contactEmail', async () => {
      mockPrisma = createMockPrisma({ ...mockArtist, contactEmail: null })
      app = createTestApp(mockPrisma)

      const res = await postContact(app, 'abbey-peters', validBody)
      expect(res.status).toBe(404)
    })

    it('should return 404 when contactEnabled is false', async () => {
      mockPrisma = createMockPrisma({ ...mockArtist, contactEnabled: false })
      app = createTestApp(mockPrisma)

      const res = await postContact(app, 'abbey-peters', validBody)
      expect(res.status).toBe(404)
    })
  })

  describe('rate limiting', () => {
    it('should return 429 when sender exceeds message limit', async () => {
      mockPrisma = createMockPrisma(mockArtist, 3) // 3 messages already sent
      app = createTestApp(mockPrisma)

      const res = await postContact(app, 'abbey-peters', validBody)
      expect(res.status).toBe(429)

      const data = await res.json()
      expect(data.error.code).toBe('RATE_LIMITED')
      expect(data.error.message).toContain('too many messages')
    })

    it('should allow messages when under the limit', async () => {
      mockPrisma = createMockPrisma(mockArtist, 2) // 2 messages — one more allowed
      app = createTestApp(mockPrisma)

      const res = await postContact(app, 'abbey-peters', validBody)
      expect(res.status).toBe(200)
    })
  })

  describe('email failure', () => {
    it('should still return 200 if email sending fails', async () => {
      const { sendEmail } = await import('@surfaced-art/email')
      vi.mocked(sendEmail).mockRejectedValueOnce(new Error('Postmark unavailable'))

      mockPrisma = createMockPrisma(mockArtist)
      app = createTestApp(mockPrisma)

      const res = await postContact(app, 'abbey-peters', validBody)
      expect(res.status).toBe(200)

      // Message should still be stored
      expect(mockPrisma.contactMessage.create).toHaveBeenCalled()
    })
  })
})
