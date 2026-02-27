/**
 * Email configuration — reads from environment variables.
 */

export interface EmailConfig {
  fromAddress: string
  fromName: string
  replyToAddress: string
  configurationSet: string
  region: string
}

/**
 * Admin email for internal notifications (e.g., new artist applications).
 */
export const ADMIN_EMAIL = 'surfacedartllc@gmail.com'

/**
 * Build email config from environment variables.
 * Throws if required variables are missing.
 */
export function getEmailConfig(): EmailConfig {
  const fromAddress = process.env.SES_FROM_ADDRESS
  if (!fromAddress) {
    throw new Error('SES_FROM_ADDRESS must be set')
  }

  const configurationSet = process.env.SES_CONFIGURATION_SET ?? ''
  const region = process.env.AWS_REGION ?? 'us-east-1'

  return {
    fromAddress: `Surfaced Art <${fromAddress}>`,
    fromName: 'Surfaced Art',
    replyToAddress: fromAddress,
    configurationSet,
    region,
  }
}
