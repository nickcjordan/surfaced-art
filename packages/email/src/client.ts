/**
 * Postmark client singleton — lazy-initialized on first use.
 *
 * Follows the same pattern as the Cognito verifier in
 * apps/api/src/middleware/auth.ts (getVerifier/setVerifier/resetVerifier).
 */

import { ServerClient } from 'postmark'
import { getEmailConfig } from './config.js'

let client: ServerClient | null = null

export function getPostmarkClient(): ServerClient {
  if (!client) {
    const config = getEmailConfig()
    client = new ServerClient(config.postmarkToken)
  }
  return client
}

/** Override the Postmark client — used for testing with mocks. */
export function setPostmarkClient(c: ServerClient): void {
  client = c
}

/** Reset the Postmark client singleton — used by tests. */
export function resetPostmarkClient(): void {
  client = null
}
