import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SignInForm as SignInPage } from '../sign-in/sign-in-form'

// Mock the auth provider
const mockSignIn = vi.fn()
const mockCompleteNewPassword = vi.fn()
const mockCompleteMfa = vi.fn()
const mockAuth = {
  user: null,
  loading: false,
  signIn: mockSignIn,
  signUp: vi.fn(),
  confirmSignUp: vi.fn(),
  resendCode: vi.fn(),
  signOut: vi.fn(),
  forgotPassword: vi.fn(),
  confirmPassword: vi.fn(),
  getIdToken: vi.fn(),
  pendingChallenge: null as string | null,
  completeNewPassword: mockCompleteNewPassword,
  completeMfa: mockCompleteMfa,
}

vi.mock('@/lib/auth', () => ({
  useAuth: () => mockAuth,
}))

import { mockPush } from '@/test/mocks/next-navigation'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('Sign In Page', () => {
  it('should render sign-in form with email and password fields', () => {
    render(<SignInPage />)

    expect(screen.getByTestId('sign-in-form')).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('should have a link to sign-up page', () => {
    render(<SignInPage />)

    const link = screen.getByRole('link', { name: /sign up/i })
    expect(link).toHaveAttribute('href', '/sign-up')
  })

  it('should have a link to forgot password page', () => {
    render(<SignInPage />)

    const link = screen.getByRole('link', { name: /forgot password/i })
    expect(link).toHaveAttribute('href', '/forgot-password')
  })

  it('should call signIn and redirect on successful submission', async () => {
    const user = userEvent.setup()
    mockSignIn.mockResolvedValue(true)

    render(<SignInPage />)

    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'Password1')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'Password1')
    expect(mockPush).toHaveBeenCalledWith('/dashboard')
  })

  it('should display error message on failed sign-in', async () => {
    const user = userEvent.setup()
    mockSignIn.mockRejectedValue(new Error('Incorrect username or password.'))

    render(<SignInPage />)

    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'WrongPass1')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/incorrect username or password/i)
  })

  it('should redirect to verify-email when user is not confirmed', async () => {
    const user = userEvent.setup()
    const error = new Error('User is not confirmed.')
    error.name = 'UserNotConfirmedException'
    mockSignIn.mockRejectedValue(error)

    render(<SignInPage />)

    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'Password1')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(mockPush).toHaveBeenCalledWith('/verify-email?email=test%40example.com')
  })

  it('should disable submit button while loading', async () => {
    const user = userEvent.setup()
    // Never resolves — simulates loading
    mockSignIn.mockReturnValue(new Promise(() => {}))

    render(<SignInPage />)

    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'Password1')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled()
  })
})

describe('Sign In - New Password Required', () => {
  beforeEach(() => {
    mockAuth.pendingChallenge = 'NEW_PASSWORD_REQUIRED'
  })

  afterEach(() => {
    mockAuth.pendingChallenge = null
  })

  it('should show new password form when pendingChallenge is NEW_PASSWORD_REQUIRED', () => {
    render(<SignInPage />)

    expect(screen.getByText(/set a new password/i)).toBeInTheDocument()
    expect(screen.getByLabelText('New password')).toBeInTheDocument()
    expect(screen.getByLabelText('Confirm new password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /set password/i })).toBeInTheDocument()
    // Should NOT show the sign-in form
    expect(screen.queryByTestId('sign-in-form')).not.toBeInTheDocument()
  })

  it('should call completeNewPassword and redirect on successful submission', async () => {
    const user = userEvent.setup()
    mockCompleteNewPassword.mockResolvedValue(undefined)

    render(<SignInPage />)

    await user.type(screen.getByLabelText('New password'), 'NewPassword1!')
    await user.type(screen.getByLabelText('Confirm new password'), 'NewPassword1!')
    await user.click(screen.getByRole('button', { name: /set password/i }))

    expect(mockCompleteNewPassword).toHaveBeenCalledWith('NewPassword1!')
    expect(mockPush).toHaveBeenCalledWith('/dashboard')
  })

  it('should show error when passwords do not match', async () => {
    const user = userEvent.setup()

    render(<SignInPage />)

    await user.type(screen.getByLabelText('New password'), 'NewPassword1!')
    await user.type(screen.getByLabelText('Confirm new password'), 'DifferentPass1!')
    await user.click(screen.getByRole('button', { name: /set password/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/passwords do not match/i)
    expect(mockCompleteNewPassword).not.toHaveBeenCalled()
  })

  it('should show error when completeNewPassword fails', async () => {
    const user = userEvent.setup()
    mockCompleteNewPassword.mockRejectedValue(new Error('Password does not meet requirements'))

    render(<SignInPage />)

    await user.type(screen.getByLabelText('New password'), 'weak')
    await user.type(screen.getByLabelText('Confirm new password'), 'weak')
    await user.click(screen.getByRole('button', { name: /set password/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/password does not meet requirements/i)
  })
})

describe('Sign In - MFA Required', () => {
  beforeEach(() => {
    mockAuth.pendingChallenge = 'MFA_REQUIRED'
  })

  afterEach(() => {
    mockAuth.pendingChallenge = null
  })

  it('should show MFA code form when pendingChallenge is MFA_REQUIRED', () => {
    render(<SignInPage />)

    expect(screen.getByTestId('mfa-form')).toBeInTheDocument()
    expect(screen.getByLabelText(/code/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /verify/i })).toBeInTheDocument()
    expect(screen.queryByTestId('sign-in-form')).not.toBeInTheDocument()
  })

  it('should call completeMfa and redirect on successful submission', async () => {
    const user = userEvent.setup()
    mockCompleteMfa.mockResolvedValue(undefined)

    render(<SignInPage />)

    await user.type(screen.getByLabelText(/code/i), '123456')
    await user.click(screen.getByRole('button', { name: /verify/i }))

    expect(mockCompleteMfa).toHaveBeenCalledWith('123456')
    expect(mockPush).toHaveBeenCalledWith('/dashboard')
  })

  it('should show error when MFA verification fails', async () => {
    const user = userEvent.setup()
    mockCompleteMfa.mockRejectedValue(new Error('Invalid code'))

    render(<SignInPage />)

    await user.type(screen.getByLabelText(/code/i), '000000')
    await user.click(screen.getByRole('button', { name: /verify/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/invalid code/i)
  })
})
