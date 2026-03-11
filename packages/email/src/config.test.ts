import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { getEmailConfig, ADMIN_EMAIL } from './config.js'

describe('getEmailConfig', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    process.env.SES_FROM_ADDRESS = 'support@surfaced.art'
    process.env.SES_CONFIGURATION_SET = 'surfaced-art-prod'
    process.env.AWS_REGION = 'us-east-1'
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it('should return correct config when all env vars are set', () => {
    const config = getEmailConfig()

    expect(config.fromAddress).toBe('Surfaced Art <support@surfaced.art>')
    expect(config.fromName).toBe('Surfaced Art')
    expect(config.replyToAddress).toBe('support@surfaced.art')
    expect(config.configurationSet).toBe('surfaced-art-prod')
    expect(config.region).toBe('us-east-1')
  })

  it('should throw when SES_FROM_ADDRESS is not set', () => {
    delete process.env.SES_FROM_ADDRESS

    expect(() => getEmailConfig()).toThrow('SES_FROM_ADDRESS must be set')
  })

  it('should throw when AWS_REGION is not set', () => {
    delete process.env.AWS_REGION

    expect(() => getEmailConfig()).toThrow('AWS_REGION must be set')
  })

  it('should return undefined configurationSet when SES_CONFIGURATION_SET is not set', () => {
    delete process.env.SES_CONFIGURATION_SET

    const config = getEmailConfig()
    expect(config.configurationSet).toBeUndefined()
  })
})

describe('ADMIN_EMAIL', () => {
  it('should be the hardcoded admin email address', () => {
    expect(ADMIN_EMAIL).toBe('surfacedartllc@gmail.com')
  })
})
