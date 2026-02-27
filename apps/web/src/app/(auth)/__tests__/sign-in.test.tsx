import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SignInForm as SignInPage } from '../sign-in/sign-in-form'

// Mock the auth provider
const mockSignIn = vi.fn()
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
    mockSignIn.mockResolvedValue(undefined)

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
