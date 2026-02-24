import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import type { PrismaClient } from '@surfaced-art/db'
import {
  setupTestDatabase,
  teardownTestDatabase,
  cleanupDatabase,
} from '@surfaced-art/db/test-helpers'
import { createTestApp } from '../test-helpers/create-test-app.js'
import type { Hono } from 'hono'

describe('POST /waitlist — integration', () => {
  let prisma: PrismaClient
  let app: Hono

  beforeAll(async () => {
    prisma = await setupTestDatabase()
    app = createTestApp(prisma)
  })

  afterAll(async () => {
    await teardownTestDatabase()
  })

  beforeEach(async () => {
    await cleanupDatabase(prisma)
  })

  it('should return 201 for a valid new email', async () => {
    const res = await app.request('/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'new@example.com' }),
    })

    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.message).toContain('waitlist')

    // Verify persistence
    const entry = await prisma.waitlist.findUnique({
      where: { email: 'new@example.com' },
    })
    expect(entry).not.toBeNull()
  })

  it('should store email as lowercase', async () => {
    await app.request('/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'MiXeD@ExAmPlE.com' }),
    })

    const entry = await prisma.waitlist.findUnique({
      where: { email: 'mixed@example.com' },
    })
    expect(entry).not.toBeNull()
  })

  it('should return 200 for duplicate email with same success message', async () => {
    // First signup
    const first = await app.request('/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'dup@example.com' }),
    })
    const firstBody = await first.json()

    // Second signup (duplicate)
    const second = await app.request('/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'dup@example.com' }),
    })
    expect(second.status).toBe(200)
    const secondBody = await second.json()

    // Same message to avoid leaking whether email exists
    expect(secondBody.message).toBe(firstBody.message)
  })

  it('should handle case-insensitive duplicate detection', async () => {
    await app.request('/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com' }),
    })

    const res = await app.request('/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'TEST@EXAMPLE.COM' }),
    })

    // Should be handled as duplicate, not error
    expect(res.status).toBeLessThan(500)
  })

  it('should return 400 for invalid email', async () => {
    const res = await app.request('/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'not-an-email' }),
    })

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBeTruthy()
  })

  it('should return 400 for empty email', async () => {
    const res = await app.request('/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: '' }),
    })

    expect(res.status).toBe(400)
  })

  it('should return 400 for missing email field', async () => {
    const res = await app.request('/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })

    expect(res.status).toBe(400)
  })

  it('should return 400 for invalid JSON body', async () => {
    const res = await app.request('/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not json',
    })

    expect(res.status).toBe(400)
  })
})
