import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { SendEmailCommand } from '@aws-sdk/client-ses'
import { sendEmail } from './send.js'
import { setSESClient, resetSESClient } from './client.js'
import { resetRateLimit, configureRateLimit } from './rate-limiter.js'
import React from 'react'

// Minimal React element for testing — a plain text node
function TestTemplate() {
  return React.createElement('div', null, 'Test email content')
}

const mockSend = vi.fn()
const mockSESClient = { send: mockSend } as unknown as import('@aws-sdk/client-ses').SESClient

describe('sendEmail', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    vi.clearAllMocks()
    resetRateLimit()
    configureRateLimit({ maxPerSecond: 100, windowMs: 1000 })
    setSESClient(mockSESClient)
    process.env.SES_FROM_ADDRESS = 'support@surfacedart.com'
    process.env.SES_CONFIGURATION_SET = 'surfaced-art-prod'
    process.env.AWS_REGION = 'us-east-1'
    mockSend.mockResolvedValue({ MessageId: 'test-message-id-123' })
  })

  afterEach(() => {
    resetSESClient()
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

  it('should call SES with correct SendEmailCommand params', async () => {
    await sendEmail({
      to: 'artist@example.com',
      subject: 'Welcome',
      template: React.createElement(TestTemplate),
    })

    expect(mockSend).toHaveBeenCalledOnce()

    const command = mockSend.mock.calls[0]![0] as SendEmailCommand
    const input = command.input

    expect(input.Source).toBe('Surfaced Art <support@surfacedart.com>')
    expect(input.Destination?.ToAddresses).toEqual(['artist@example.com'])
    expect(input.Message?.Subject?.Data).toBe('Welcome')
    expect(input.Message?.Subject?.Charset).toBe('UTF-8')
    expect(input.Message?.Body?.Html?.Data).toContain('Test email content')
    expect(input.Message?.Body?.Html?.Charset).toBe('UTF-8')
    expect(input.Message?.Body?.Text?.Charset).toBe('UTF-8')
    expect(input.ReplyToAddresses).toEqual(['support@surfacedart.com'])
    expect(input.ConfigurationSetName).toBe('surfaced-art-prod')
  })

  it('should support multiple recipients via array', async () => {
    await sendEmail({
      to: ['a@example.com', 'b@example.com'],
      subject: 'Multi',
      template: React.createElement(TestTemplate),
    })

    const command = mockSend.mock.calls[0]![0] as SendEmailCommand
    expect(command.input.Destination?.ToAddresses).toEqual([
      'a@example.com',
      'b@example.com',
    ])
  })

  it('should return error when SES send fails', async () => {
    mockSend.mockRejectedValue(new Error('SES throttled'))

    const result = await sendEmail({
      to: 'artist@example.com',
      subject: 'Test',
      template: React.createElement(TestTemplate),
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe('SES throttled')
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
    // SES client should NOT have been called for the rate-limited request
    expect(mockSend).toHaveBeenCalledOnce()
  })

  it('should omit ConfigurationSetName when not configured', async () => {
    delete process.env.SES_CONFIGURATION_SET

    await sendEmail({
      to: 'artist@example.com',
      subject: 'Test',
      template: React.createElement(TestTemplate),
    })

    const command = mockSend.mock.calls[0]![0] as SendEmailCommand
    expect(command.input.ConfigurationSetName).toBeUndefined()
  })
})
