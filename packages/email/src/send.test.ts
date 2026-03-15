import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { sendEmail } from './send.js'
import { setPostmarkClient, resetPostmarkClient } from './client.js'
import { resetRateLimit, configureRateLimit } from './rate-limiter.js'
import type { ServerClient } from 'postmark'
import React from 'react'

// Minimal React element for testing — a plain text node
function TestTemplate() {
  return React.createElement('div', null, 'Test email content')
}

const mockSendEmail = vi.fn()
const mockPostmarkClient = { sendEmail: mockSendEmail } as unknown as ServerClient

describe('sendEmail', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    vi.clearAllMocks()
    resetRateLimit()
    configureRateLimit({ maxPerSecond: 100, windowMs: 1000 })
    setPostmarkClient(mockPostmarkClient)
    process.env.EMAIL_FROM_ADDRESS = 'support@surfaced.art'
    process.env.POSTMARK_SERVER_TOKEN = 'test-postmark-token'
    process.env.ADMIN_EMAIL = 'admin@surfaced.art'
    mockSendEmail.mockResolvedValue({ MessageID: 'test-message-id-123' })
  })

  afterEach(() => {
    resetPostmarkClient()
    process.env = { ...originalEnv }
  })

  it('should send an email successfully', async () => {
    const result = await sendEmail({
      to: 'artist@example.com',
      subject: 'Test Subject',
      template: React.createElement(TestTemplate),
    })

    expect(result.success).toBe(true)
    expect(result.messageId).toBe('test-message-id-123')
    expect(result.error).toBeUndefined()
  })

  it('should call Postmark with correct params', async () => {
    await sendEmail({
      to: 'artist@example.com',
      subject: 'Welcome',
      template: React.createElement(TestTemplate),
    })

    expect(mockSendEmail).toHaveBeenCalledOnce()
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        From: 'Surfaced Art <support@surfaced.art>',
        To: 'artist@example.com',
        Subject: 'Welcome',
        ReplyTo: 'support@surfaced.art',
        MessageStream: 'outbound',
      }),
    )

    const callArgs = mockSendEmail.mock.calls[0]![0]
    expect(callArgs.HtmlBody).toContain('Test email content')
    expect(callArgs.TextBody).toBeTruthy()
  })

  it('should support multiple recipients via array', async () => {
    await sendEmail({
      to: ['a@example.com', 'b@example.com'],
      subject: 'Multi',
      template: React.createElement(TestTemplate),
    })

    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        To: 'a@example.com, b@example.com',
      }),
    )
  })

  it('should return error when Postmark send fails', async () => {
    mockSendEmail.mockRejectedValue(new Error('Postmark rate limited'))

    const result = await sendEmail({
      to: 'artist@example.com',
      subject: 'Test',
      template: React.createElement(TestTemplate),
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe('Postmark rate limited')
    expect(result.messageId).toBeUndefined()
  })

  it('should reject when rate limited', async () => {
    configureRateLimit({ maxPerSecond: 1, windowMs: 60_000 })

    // First call succeeds
    await sendEmail({
      to: 'a@example.com',
      subject: 'First',
      template: React.createElement(TestTemplate),
    })

    // Second call is rate limited
    const result = await sendEmail({
      to: 'b@example.com',
      subject: 'Second',
      template: React.createElement(TestTemplate),
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe('Rate limit exceeded')
    // Postmark client should NOT have been called for the rate-limited request
    expect(mockSendEmail).toHaveBeenCalledOnce()
  })

  it('should return error when EMAIL_FROM_ADDRESS is missing', async () => {
    delete process.env.EMAIL_FROM_ADDRESS

    const result = await sendEmail({
      to: 'artist@example.com',
      subject: 'Test',
      template: React.createElement(TestTemplate),
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe('EMAIL_FROM_ADDRESS must be set')
    expect(mockSendEmail).not.toHaveBeenCalled()
  })

  it('should return error when POSTMARK_SERVER_TOKEN is missing', async () => {
    delete process.env.POSTMARK_SERVER_TOKEN

    const result = await sendEmail({
      to: 'artist@example.com',
      subject: 'Test',
      template: React.createElement(TestTemplate),
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe('POSTMARK_SERVER_TOKEN must be set')
    expect(mockSendEmail).not.toHaveBeenCalled()
  })
})
