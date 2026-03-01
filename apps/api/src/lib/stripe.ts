import Stripe from 'stripe'

/**
 * Create a Stripe client instance.
 * Uses the STRIPE_SECRET_KEY environment variable.
 * Creates a fresh instance each call — Lambda cold starts are cheap
 * and this avoids stale state between invocations.
 */
export function getStripeClient(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not configured')
  }
  return new Stripe(key)
}
