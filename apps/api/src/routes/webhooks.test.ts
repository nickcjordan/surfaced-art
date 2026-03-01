import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Hono } from 'hono'
import { createWebhookRoutes } from './webhooks'
import type { PrismaClient } from '@surfaced-art/db'

// Mock the Stripe client module
const mockStripeWebhooksConstructEvent = vi.fn()
vi.mock('../lib/stripe', () => ({
  getStripeClient: () => ({
    webhooks: {
      constructEvent: mockStripeWebhooksConstructEvent,
    },
  }),
}))

// ─── Test helpers ────────────────────────────────────────────────────

function createMockPrisma() {
  return {
    artistProfile: {
      findFirst: vi.fn().mockResolvedValue(null),
    },
  } as unknown as PrismaClient
}

function createTestApp(prisma: PrismaClient) {
  const app = new Hono()
  app.route('/webhooks', createWebhookRoutes(prisma))
  return app
}

function postStripeWebhook(
  app: ReturnType<typeof createTestApp>,
  body: string,
  signature?: string,
) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (signature) headers['stripe-signature'] = signature
  return app.request('/webhooks/stripe', {
    method: 'POST',
    headers,
    body,
  })
}

// ─── Tests ──────────────────────────────────────────────────────────

describe('POST /webhooks/stripe', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('STRIPE_WEBHOOK_SECRET', 'whsec_test_secret')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('should return 400 when stripe-signature header is missing', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)

    const res = await postStripeWebhook(app, '{}')
    expect(res.status).toBe(400)

    const body = await res.json()
    expect(body.error.code).toBe('BAD_REQUEST')
  })

  it('should return 400 when signature verification fails', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)

    mockStripeWebhooksConstructEvent.mockImplementation(() => {
      throw new Error('Webhook signature verification failed')
    })

    const res = await postStripeWebhook(app, '{}', 'invalid-sig')
    expect(res.status).toBe(400)

    const body = await res.json()
    expect(body.error.code).toBe('BAD_REQUEST')
  })

  it('should handle account.updated with charges_enabled and log success', async () => {
    const prisma = createMockPrisma()
    ;(prisma.artistProfile.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'artist-uuid-123',
      stripeAccountId: 'acct_test_123',
    })
    const app = createTestApp(prisma)

    mockStripeWebhooksConstructEvent.mockReturnValue({
      type: 'account.updated',
      data: {
        object: {
          id: 'acct_test_123',
          charges_enabled: true,
        },
      },
    })

    const res = await postStripeWebhook(app, '{}', 'valid-sig')
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.received).toBe(true)

    // Should have looked up the artist by Stripe account ID
    expect(prisma.artistProfile.findFirst).toHaveBeenCalledWith({
      where: { stripeAccountId: 'acct_test_123' },
    })
  })

  it('should ignore unrelated event types with 200', async () => {
    const prisma = createMockPrisma()
    const app = createTestApp(prisma)

    mockStripeWebhooksConstructEvent.mockReturnValue({
      type: 'payment_intent.succeeded',
      data: { object: { id: 'pi_123' } },
    })

    const res = await postStripeWebhook(app, '{}', 'valid-sig')
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.received).toBe(true)

    // Should NOT have queried the artist profile
    expect(prisma.artistProfile.findFirst).not.toHaveBeenCalled()
  })

  it('should return 200 when artist not found for account.updated', async () => {
    const prisma = createMockPrisma()
    ;(prisma.artistProfile.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null)
    const app = createTestApp(prisma)

    mockStripeWebhooksConstructEvent.mockReturnValue({
      type: 'account.updated',
      data: {
        object: {
          id: 'acct_unknown_999',
          charges_enabled: true,
        },
      },
    })

    const res = await postStripeWebhook(app, '{}', 'valid-sig')
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.received).toBe(true)
  })
})
