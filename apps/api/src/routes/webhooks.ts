import { Hono } from 'hono'
import type { PrismaClient } from '@surfaced-art/db'
import { logger } from '@surfaced-art/utils'
import { badRequest } from '../errors'
import { getStripeClient } from '../lib/stripe'

export function createWebhookRoutes(prisma: PrismaClient) {
  const webhooks = new Hono()

  webhooks.post('/stripe', async (c) => {
    const signature = c.req.header('stripe-signature')
    if (!signature) {
      return badRequest(c, 'Missing stripe-signature header')
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (!webhookSecret) {
      logger.error('STRIPE_WEBHOOK_SECRET not configured')
      return c.json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }, 500)
    }

    const stripe = getStripeClient()
    const rawBody = await c.req.text()

    let event
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
    } catch (err) {
      logger.warn('Stripe webhook signature verification failed', {
        error: err instanceof Error ? err.message : String(err),
      })
      return badRequest(c, 'Invalid webhook signature')
    }

    // Handle specific event types
    if (event.type === 'account.updated') {
      const account = event.data.object as { id: string; charges_enabled: boolean }

      if (account.charges_enabled) {
        const artist = await prisma.artistProfile.findFirst({
          where: { stripeAccountId: account.id },
        })

        if (artist) {
          logger.info('Stripe Connect onboarding completed', {
            artistId: artist.id,
            stripeAccountId: account.id,
          })
        } else {
          logger.warn('Stripe account.updated for unknown artist', {
            stripeAccountId: account.id,
          })
        }
      } else {
        // charges_enabled is false — partial onboarding, just look up for logging
        const artist = await prisma.artistProfile.findFirst({
          where: { stripeAccountId: account.id },
        })

        if (artist) {
          logger.info('Stripe Connect onboarding in progress', {
            artistId: artist.id,
            stripeAccountId: account.id,
          })
        }
      }
    }

    return c.json({ received: true })
  })

  return webhooks
}
