// Email package — public exports

// Core sending
export { sendEmail } from './send.js'
export type { SendEmailOptions, SendEmailResult } from './send.js'

// Config
export { getEmailConfig, ADMIN_EMAIL } from './config.js'
export type { EmailConfig } from './config.js'

// Client (for testing)
export { getSESClient, setSESClient, resetSESClient } from './client.js'

// Rate limiter
export { checkRateLimit, configureRateLimit, resetRateLimit } from './rate-limiter.js'

// Templates
export { ArtistApplicationConfirmation } from './templates/artist-application-confirmation.js'
export { ArtistAcceptance } from './templates/artist-acceptance.js'
export { AdminApplicationNotification } from './templates/admin-application-notification.js'
export { WaitlistWelcome } from './templates/waitlist-welcome.js'

// Layout (for custom templates)
export { Layout, BRAND } from './templates/components/Layout.js'
