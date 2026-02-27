import { describe, it, expect } from 'vitest'
import robots from '../robots'

describe('robots.txt', () => {
  const config = robots()

  it('should allow all crawlers on root', () => {
    const rules = Array.isArray(config.rules) ? config.rules : [config.rules]
    const mainRule = rules.find((r) => r.userAgent === '*')
    expect(mainRule).toBeDefined()
    expect(mainRule!.allow).toBe('/')
  })

  it('should disallow /api/ path', () => {
    const rules = Array.isArray(config.rules) ? config.rules : [config.rules]
    const mainRule = rules.find((r) => r.userAgent === '*')!
    const disallowed = Array.isArray(mainRule.disallow) ? mainRule.disallow : [mainRule.disallow]
    expect(disallowed).toContain('/api/')
  })

  it('should disallow /dashboard/ path', () => {
    const rules = Array.isArray(config.rules) ? config.rules : [config.rules]
    const mainRule = rules.find((r) => r.userAgent === '*')!
    const disallowed = Array.isArray(mainRule.disallow) ? mainRule.disallow : [mainRule.disallow]
    expect(disallowed).toContain('/dashboard/')
  })

  it('should disallow /apply path', () => {
    const rules = Array.isArray(config.rules) ? config.rules : [config.rules]
    const mainRule = rules.find((r) => r.userAgent === '*')!
    const disallowed = Array.isArray(mainRule.disallow) ? mainRule.disallow : [mainRule.disallow]
    expect(disallowed).toContain('/apply')
  })

  it('should reference sitemap URL', () => {
    expect(config.sitemap).toBe('https://surfaced.art/sitemap.xml')
  })
})
