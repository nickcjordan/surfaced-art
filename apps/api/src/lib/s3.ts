/**
 * S3 client singleton — lazy-initialized on first use.
 *
 * Follows the same pattern as the Cognito verifier in auth.ts:
 * getS3Client(), setS3Client(), resetS3Client().
 */

import { S3Client } from '@aws-sdk/client-s3'

let client: S3Client | null = null

export function getS3Client(): S3Client {
  if (!client) {
    const region = process.env.AWS_REGION ?? 'us-east-1'
    client = new S3Client({ region })
  }
  return client
}

/** Set a custom S3 client — used for testing with mocks. */
export function setS3Client(c: S3Client): void {
  client = c
}

/** Reset the cached client — used only by tests. */
export function resetS3Client(): void {
  client = null
}
