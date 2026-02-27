/**
 * Mock for next/navigation used in Vitest tests.
 * Provides mock implementations of useRouter, useSearchParams, usePathname.
 */
import { vi } from 'vitest'

export const mockPush = vi.fn()
export const mockReplace = vi.fn()
export const mockBack = vi.fn()

export function useRouter() {
  return {
    push: mockPush,
    replace: mockReplace,
    back: mockBack,
    prefetch: vi.fn(),
    refresh: vi.fn(),
  }
}

export function useSearchParams() {
  return new URLSearchParams()
}

export function usePathname() {
  return '/'
}

export function redirect(url: string) {
  throw new Error(`NEXT_REDIRECT:${url}`)
}
