import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ResetPasswordForm as ResetPasswordPage } from '../reset-password/reset-password-form'

const mockConfirmPassword = vi.fn()
const mockAuth = {
  user: null,
  loading: false,
  signIn: vi.fn(),
  signUp: vi.fn(),
  confirmSignUp: vi.fn(),
  resendCode: vi.fn(),
  signOut: vi.fn(),
  forgotPassword: vi.fn(),
  confirmPassword: mockConfirmPassword,
  getIdToken: vi.fn(),
}

vi.mock('@/lib/auth', () => ({
  useAuth: () => mockAuth,
}))

import { mockPush } from '@/test/mocks/next-navigation'

// Mock useSearchParams to return email
vi.mock('next/navigation', async () => {
  const actual = await vi.importActual<typeof import('next/navigation')>('@/test/mocks/next-navigation')
  return {
    ...actual,
    useSearchParams: () => ({
      get: (key: string) => key === 'email' ? 'test@example.com' : null,
    }),
  }
})

beforeEach(() => {
  vi.clearAllMocks()
})

describe('Reset Password Page', () => {
  it('should render reset password form with code and new password fields', () => {
    render(<ResetPasswordPage />)

    expect(screen.getByTestId('reset-password-form')).toBeInTheDocument()
    expect(screen.getByLabelText(/verification code/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^new password$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/confirm.*password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /reset password/i })).toBeInTheDocument()
  })

  it('should show error when passwords do not match', async () => {
    const user = userEvent.setup()

    render(<ResetPasswordPage />)

    await user.type(screen.getByLabelText(/verification code/i), '123456')
    await user.type(screen.getByLabelText(/^new password$/i), 'NewPass1')
    await user.type(screen.getByLabelText(/confirm.*password/i), 'NewPass2')
    await user.click(screen.getByRole('button', { name: /reset password/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/passwords do not match/i)
    expect(mockConfirmPassword).not.toHaveBeenCalled()
  })

  it('should call confirmPassword and redirect on success', async () => {
    const user = userEvent.setup()
    mockConfirmPassword.mockResolvedValue(undefined)

    render(<ResetPasswordPage />)

    await user.type(screen.getByLabelText(/verification code/i), '123456')
    await user.type(screen.getByLabelText(/^new password$/i), 'NewPass1')
    await user.type(screen.getByLabelText(/confirm.*password/i), 'NewPass1')
    await user.click(screen.getByRole('button', { name: /reset password/i }))

    expect(mockConfirmPassword).toHaveBeenCalledWith('test@example.com', '123456', 'NewPass1')
    expect(mockPush).toHaveBeenCalledWith('/sign-in?reset=true')
  })

  it('should display error on invalid code', async () => {
    const user = userEvent.setup()
    mockConfirmPassword.mockRejectedValue(new Error('Invalid verification code provided, please try again.'))

    render(<ResetPasswordPage />)

    await user.type(screen.getByLabelText(/verification code/i), '000000')
    await user.type(screen.getByLabelText(/^new password$/i), 'NewPass1')
    await user.type(screen.getByLabelText(/confirm.*password/i), 'NewPass1')
    await user.click(screen.getByRole('button', { name: /reset password/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/invalid verification code/i)
  })
})
