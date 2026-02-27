/**
 * Core email sending utility.
 *
 * Renders a React Email template to HTML + plaintext, then sends via SES.
 * Includes rate limiting and structured logging.
 */

import { SendEmailCommand } from '@aws-sdk/client-ses'
import { render } from '@react-email/render'
import { logger } from '@surfaced-art/utils'
import { getSESClient } from './client.js'
import { getEmailConfig } from './config.js'
import { checkRateLimit } from './rate-limiter.js'
import type { ReactElement } from 'react'

export interface SendEmailOptions {
  to: string | string[]
  subject: string
  template: ReactElement
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

  let client: ReturnType<typeof getSESClient>
  try {
    client = getSESClient()
  } catch (err) {
    logger.error('SES client initialization error', {
      errorMessage: err instanceof Error ? err.message : String(err),
      subject: options.subject,
    })
    return {
      success: false,
      error: err instanceof Error ? err.message : 'SES client error',
    }
  }

  // Render React Email template to HTML and plain text
  const html = await render(options.template)
  const text = await render(options.template, { plainText: true })

  const toAddresses = Array.isArray(options.to) ? options.to : [options.to]

  const command = new SendEmailCommand({
    Source: config.fromAddress,
    Destination: { ToAddresses: toAddresses },
    Message: {
      Subject: { Data: options.subject, Charset: 'UTF-8' },
      Body: {
        Html: { Data: html, Charset: 'UTF-8' },
        Text: { Data: text, Charset: 'UTF-8' },
      },
    },
    ReplyToAddresses: [config.replyToAddress],
    ConfigurationSetName: config.configurationSet || undefined,
  })

  try {
    const result = await client.send(command)
    logger.info('Email sent', {
      messageId: result.MessageId,
      subject: options.subject,
    })
    return { success: true, messageId: result.MessageId }
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
