import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ForgotPasswordPage from '../forgot-password/page'

const mockForgotPassword = vi.fn()
const mockAuth = {
  user: null,
  loading: false,
  signIn: vi.fn(),
  signUp: vi.fn(),
  confirmSignUp: vi.fn(),
  resendCode: vi.fn(),
  signOut: vi.fn(),
  forgotPassword: mockForgotPassword,
  confirmPassword: vi.fn(),
  getIdToken: vi.fn(),
}

vi.mock('@/lib/auth', () => ({
  useAuth: () => mockAuth,
}))

import { mockPush } from '@/test/mocks/next-navigation'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('Forgot Password Page', () => {
  it('should render forgot password form with email field', () => {
    render(<ForgotPasswordPage />)

    expect(screen.getByTestId('forgot-password-form')).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /send reset code/i })).toBeInTheDocument()
  })

  it('should have a link back to sign-in', () => {
    render(<ForgotPasswordPage />)

    const link = screen.getByRole('link', { name: /back to sign in/i })
    expect(link).toHaveAttribute('href', '/sign-in')
  })

  it('should call forgotPassword and redirect to reset-password on success', async () => {
    const user = userEvent.setup()
    mockForgotPassword.mockResolvedValue(undefined)

    render(<ForgotPasswordPage />)

    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.click(screen.getByRole('button', { name: /send reset code/i }))

    expect(mockForgotPassword).toHaveBeenCalledWith('test@example.com')
    expect(mockPush).toHaveBeenCalledWith('/reset-password?email=test%40example.com')
  })

  it('should display error when email not found', async () => {
    const user = userEvent.setup()
    mockForgotPassword.mockRejectedValue(new Error('Username/client id combination not found.'))

    render(<ForgotPasswordPage />)

    await user.type(screen.getByLabelText(/email/i), 'unknown@example.com')
    await user.click(screen.getByRole('button', { name: /send reset code/i }))

    expect(await screen.findByRole('alert')).toBeInTheDocument()
  })
})
