import { vi } from 'vitest'

export const useTheme = vi.fn(() => ({
  theme: 'light',
  resolvedTheme: 'light',
  setTheme: vi.fn(),
  themes: ['light', 'dark', 'system'],
}))

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return children
}
