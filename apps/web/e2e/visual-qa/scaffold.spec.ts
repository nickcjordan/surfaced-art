import { test, expect } from '@playwright/test'

test.describe('Visual QA Scaffold', () => {
  test('config loads and base URL is set', () => {
    const baseURL = process.env.VISUAL_QA_BASE_URL || 'https://surfaced.art'
    expect(baseURL).toBeTruthy()
    expect(baseURL).toMatch(/^https?:\/\//)
  })
})
