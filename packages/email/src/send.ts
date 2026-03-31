/**
 * Core email sending utility.
 *
 * Renders a React Email template to HTML + plaintext, then sends via Postmark.
 * Includes rate limiting and structured logging.
 */

import { render } from '@react-email/render'
import { logger } from '@surfaced-art/utils'
import { getPostmarkClient } from './client.js'
import { getEmailConfig } from './config.js'
import { checkRateLimit } from './rate-limiter.js'
import type { ReactElement } from 'react'

export interface SendEmailOptions {
  to: string | string[]
  subject: string
  template: ReactElement
  replyTo?: string
}

export interface SendEmailResult {
  success: boolean
  messageId?: string
  error?: string
}

export async function sendEmail(
  options: SendEmailOptions,
): Promise<SendEmailResult> {
  // Rate limit check
  if (!checkRateLimit()) {
    logger.warn('Email rate limit exceeded', { subject: options.subject })
    return { success: false, error: 'Rate limit exceeded' }
  }

  let config: ReturnType<typeof getEmailConfig>
  try {
    config = getEmailConfig()
  } catch (err) {
    logger.error('Email config error', {
      errorMessage: err instanceof Error ? err.message : String(err),
      subject: options.subject,
    })
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Email configuration error',
    }
  }

  let client: ReturnType<typeof getPostmarkClient>
  try {
    client = getPostmarkClient()
  } catch (err) {
    logger.error('Postmark client initialization error', {
      errorMessage: err instanceof Error ? err.message : String(err),
      subject: options.subject,
    })
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Postmark client error',
    }
  }

  // Render React Email template to HTML and plain text
  const html = await render(options.template)
  const text = await render(options.template, { plainText: true })

  const toAddress = Array.isArray(options.to)
    ? options.to.join(', ')
    : options.to

  try {
    const result = await client.sendEmail({
      From: config.fromAddress,
      To: toAddress,
      Subject: options.subject,
      HtmlBody: html,
      TextBody: text,
      ReplyTo: options.replyTo ?? config.replyToAddress,
      MessageStream: 'outbound',
    })
    logger.info('Email sent', {
      messageId: result.MessageID,
      subject: options.subject,
    })
    return { success: true, messageId: result.MessageID }
  } catch (err) {
    logger.error('Email send failed', {
      errorMessage: err instanceof Error ? err.message : String(err),
      errorName: err instanceof Error ? err.name : undefined,
      subject: options.subject,
    })
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}
