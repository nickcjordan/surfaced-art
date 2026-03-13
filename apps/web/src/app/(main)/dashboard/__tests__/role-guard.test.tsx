import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

const mockAuth = {
  user: { email: 'user@test.com', name: 'Test User' } as { email: string; name: string } | null,
  loading: false,
  roles: [] as string[],
  isAdmin: false,
  isArtist: false,
  hasRole: vi.fn((_role: string) => false),
  signIn: vi.fn(),
  signUp: vi.fn(),
  confirmSignUp: vi.fn(),
  resendCode: vi.fn(),
  signOut: vi.fn(),
  forgotPassword: vi.fn(),
  confirmPassword: vi.fn(),
  getIdToken: vi.fn(),
  completeNewPassword: vi.fn(),
  completeMfa: vi.fn(),
  pendingChallenge: null,
}

vi.mock('@/lib/auth', () => ({
  useAuth: () => mockAuth,
}))

import { RoleGuard } from '../components/role-guard'

beforeEach(() => {
  vi.clearAllMocks()
  mockAuth.user = { email: 'user@test.com', name: 'Test User' }
  mockAuth.loading = false
  mockAuth.hasRole = vi.fn(() => false)
})

describe('RoleGuard', () => {
  it('should show loading skeleton while auth is resolving', () => {
    mockAuth.loading = true

    render(
      <RoleGuard requiredRole="artist">
        <div>Protected content</div>
      </RoleGuard>
    )

    expect(screen.getByTestId('role-guard-loading')).toBeInTheDocument()
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument()
  })

  it('should show access denied when user lacks the required role', () => {
    mockAuth.hasRole = vi.fn(() => false)

    render(
      <RoleGuard requiredRole="artist">
        <div>Protected content</div>
      </RoleGuard>
    )

    expect(screen.getByTestId('role-guard-denied')).toBeInTheDocument()
    expect(screen.getByText('Access Denied')).toBeInTheDocument()
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument()
  })

  it('should show access denied when user is not authenticated', () => {
    mockAuth.user = null

    render(
      <RoleGuard requiredRole="artist">
        <div>Protected content</div>
      </RoleGuard>
    )

    expect(screen.getByTestId('role-guard-denied')).toBeInTheDocument()
  })

  it('should render children when user has the required role', () => {
    mockAuth.hasRole = vi.fn(() => true)

    render(
      <RoleGuard requiredRole="artist">
        <div>Protected content</div>
      </RoleGuard>
    )

    expect(screen.getByText('Protected content')).toBeInTheDocument()
    expect(screen.queryByTestId('role-guard-denied')).not.toBeInTheDocument()
  })

  it('should include a link back to dashboard in the denied state', () => {
    mockAuth.hasRole = vi.fn(() => false)

    render(
      <RoleGuard requiredRole="artist">
        <div>Protected content</div>
      </RoleGuard>
    )

    const link = screen.getByRole('link', { name: /go to dashboard/i })
    expect(link).toHaveAttribute('href', '/dashboard')
  })

  it('should call hasRole with the correct role', () => {
    mockAuth.hasRole = vi.fn(() => false)

    render(
      <RoleGuard requiredRole="artist">
        <div>Protected content</div>
      </RoleGuard>
    )

    expect(mockAuth.hasRole).toHaveBeenCalledWith('artist')
  })
})
