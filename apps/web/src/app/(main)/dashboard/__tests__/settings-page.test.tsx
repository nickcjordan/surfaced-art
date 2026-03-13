import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@/lib/auth', () => ({
  useAuth: () => ({
    user: { email: 'buyer@test.com', name: 'Test Buyer' },
    loading: false,
    isArtist: false,
    isAdmin: false,
    roles: ['buyer'],
    hasRole: () => false,
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
  }),
}))

import SettingsPage from '../settings/page'

describe('SettingsPage', () => {
  it('should render settings page with data-testid', () => {
    render(<SettingsPage />)
    expect(screen.getByTestId('settings-page')).toBeInTheDocument()
  })

  it('should display user name', () => {
    render(<SettingsPage />)
    expect(screen.getByTestId('settings-name')).toHaveTextContent('Test Buyer')
  })

  it('should display user email', () => {
    render(<SettingsPage />)
    expect(screen.getByTestId('settings-email')).toHaveTextContent('buyer@test.com')
  })

  it('should show change password link', () => {
    render(<SettingsPage />)
    const link = screen.getByRole('link', { name: /change password/i })
    expect(link).toHaveAttribute('href', '/forgot-password')
  })

  it('should show account information card', () => {
    render(<SettingsPage />)
    expect(screen.getByTestId('settings-account')).toBeInTheDocument()
    expect(screen.getByText('Account Information')).toBeInTheDocument()
  })

  it('should show security card', () => {
    render(<SettingsPage />)
    expect(screen.getByTestId('settings-security')).toBeInTheDocument()
    expect(screen.getByText('Security')).toBeInTheDocument()
  })
})
