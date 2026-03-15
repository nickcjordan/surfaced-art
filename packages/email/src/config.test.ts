import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { getEmailConfig, getAdminEmail } from './config.js'

describe('getEmailConfig', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    process.env.EMAIL_FROM_ADDRESS = 'support@surfaced.art'
    process.env.POSTMARK_SERVER_TOKEN = 'test-postmark-token'
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it('should return correct config when all env vars are set', () => {
    const config = getEmailConfig()

    expect(config.fromAddress).toBe('Surfaced Art <support@surfaced.art>')
    expect(config.fromName).toBe('Surfaced Art')
    expect(config.replyToAddress).toBe('support@surfaced.art')
    expect(config.postmarkToken).toBe('test-postmark-token')
  })

  it('should throw when EMAIL_FROM_ADDRESS is not set', () => {
    delete process.env.EMAIL_FROM_ADDRESS

    expect(() => getEmailConfig()).toThrow('EMAIL_FROM_ADDRESS must be set')
  })

  it('should throw when POSTMARK_SERVER_TOKEN is not set', () => {
    delete process.env.POSTMARK_SERVER_TOKEN

    expect(() => getEmailConfig()).toThrow('POSTMARK_SERVER_TOKEN must be set')
  })
})

describe('getAdminEmail', () => {
  const originalEnv = { ...process.env }

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it('should return the admin email from env var', () => {
    process.env.ADMIN_EMAIL = 'admin@surfaced.art'

    expect(getAdminEmail()).toBe('admin@surfaced.art')
  })

  it('should throw when ADMIN_EMAIL is not set', () => {
    delete process.env.ADMIN_EMAIL

    expect(() => getAdminEmail()).toThrow('ADMIN_EMAIL must be set')
  })
})
