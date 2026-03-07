import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SignUpPage from '../sign-up/page'

const mockSignUp = vi.fn()
const mockAuth = {
  user: null,
  loading: false,
  signIn: vi.fn(),
  signUp: mockSignUp,
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

describe('Sign Up Page', () => {
  it('should render sign-up form with name, email, and password fields', () => {
    render(<SignUpPage />)

    expect(screen.getByTestId('sign-up-form')).toBeInTheDocument()
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
  })

  it('should have a link to sign-in page', () => {
    render(<SignUpPage />)

    const link = screen.getByRole('link', { name: /sign in/i })
    expect(link).toHaveAttribute('href', '/sign-in')
  })

  it('should show error when passwords do not match', async () => {
    const user = userEvent.setup()

    render(<SignUpPage />)

    await user.type(screen.getByLabelText(/full name/i), 'Test User')
    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/^password$/i), 'Password1')
    await user.type(screen.getByLabelText(/confirm password/i), 'Password2')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/passwords do not match/i)
    expect(mockSignUp).not.toHaveBeenCalled()
  })

  it('should call signUp and redirect to verify-email on success', async () => {
    const user = userEvent.setup()
    mockSignUp.mockResolvedValue({ userConfirmed: false })

    render(<SignUpPage />)

    await user.type(screen.getByLabelText(/full name/i), 'Alice Smith')
    await user.type(screen.getByLabelText(/email/i), 'alice@example.com')
    await user.type(screen.getByLabelText(/^password$/i), 'Password1')
    await user.type(screen.getByLabelText(/confirm password/i), 'Password1')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    expect(mockSignUp).toHaveBeenCalledWith('alice@example.com', 'Password1', 'Alice Smith')
    expect(mockPush).toHaveBeenCalledWith('/verify-email?email=alice%40example.com')
  })

  it('should display error on failed sign-up', async () => {
    const user = userEvent.setup()
    mockSignUp.mockRejectedValue(new Error('An account with the given email already exists.'))

    render(<SignUpPage />)

    await user.type(screen.getByLabelText(/full name/i), 'Test User')
    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/^password$/i), 'Password1')
    await user.type(screen.getByLabelText(/confirm password/i), 'Password1')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/already exists/i)
  })

  it('should show password requirements hint', () => {
    render(<SignUpPage />)

    expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument()
  })

  it('should disable submit button while loading', async () => {
    const user = userEvent.setup()
    mockSignUp.mockReturnValue(new Promise(() => {}))

    render(<SignUpPage />)

    await user.type(screen.getByLabelText(/full name/i), 'Test User')
    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/^password$/i), 'Password1')
    await user.type(screen.getByLabelText(/confirm password/i), 'Password1')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    expect(screen.getByRole('button', { name: /creating account/i })).toBeDisabled()
  })
})
