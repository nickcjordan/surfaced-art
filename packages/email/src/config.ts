/**
 * Email configuration — reads from environment variables.
 */

export interface EmailConfig {
  fromAddress: string
  fromName: string
  replyToAddress: string
  postmarkToken: string
}

/**
 * Get the admin email for internal notifications (e.g., new artist applications).
 * Reads from ADMIN_EMAIL env var. Throws if not set.
 */
export function getAdminEmail(): string {
  const email = process.env.ADMIN_EMAIL
  if (!email) {
    throw new Error('ADMIN_EMAIL must be set')
  }
  return email
}

/**
 * Build email config from environment variables.
 * Throws if required variables are missing.
 */
export function getEmailConfig(): EmailConfig {
  const fromAddress = process.env.EMAIL_FROM_ADDRESS
  if (!fromAddress) {
    throw new Error('EMAIL_FROM_ADDRESS must be set')
  }

  const postmarkToken = process.env.POSTMARK_SERVER_TOKEN
  if (!postmarkToken) {
    throw new Error('POSTMARK_SERVER_TOKEN must be set')
  }

  return {
    fromAddress: `Surfaced Art <${fromAddress}>`,
    fromName: 'Surfaced Art',
    replyToAddress: fromAddress,
    postmarkToken,
  }
}
