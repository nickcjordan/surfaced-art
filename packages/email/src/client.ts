/**
 * SES client singleton — lazy-initialized on first use.
 *
 * Follows the same pattern as the Cognito verifier in
 * apps/api/src/middleware/auth.ts (getVerifier/setVerifier/resetVerifier).
 */

import { SESClient } from '@aws-sdk/client-ses'

let client: SESClient | null = null

export function getSESClient(): SESClient {
  if (!client) {
    const region = process.env.AWS_REGION ?? 'us-east-1'
    client = new SESClient({ region })
  }
  return client
}

/** Override the SES client — used for testing with mocks. */
export function setSESClient(c: SESClient): void {
  client = c
}

/** Reset the SES client singleton — used by tests. */
export function resetSESClient(): void {
  client = null
}
