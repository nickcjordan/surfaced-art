import { test, expect } from '@playwright/test'

test.describe('Visual QA Scaffold', () => {
  test('config loads and base URL is set', () => {
    const baseURL = process.env.VISUAL_QA_BASE_URL
    if (!baseURL) throw new Error('VISUAL_QA_BASE_URL is not set')
    expect(baseURL).toMatch(/^https?:\/\//)
  })
})
