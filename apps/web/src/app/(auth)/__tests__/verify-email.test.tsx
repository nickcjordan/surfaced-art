import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { VerifyEmailForm as VerifyEmailPage } from '../verify-email/verify-email-form'

const mockConfirmSignUp = vi.fn()
const mockResendCode = vi.fn()
const mockAuth = {
  user: null,
  loading: false,
  signIn: vi.fn(),
  signUp: vi.fn(),
  confirmSignUp: mockConfirmSignUp,
  resendCode: mockResendCode,
  signOut: vi.fn(),
  forgotPassword: vi.fn(),
  confirmPassword: vi.fn(),
  getIdToken: vi.fn(),
}

vi.mock('@/lib/auth', () => ({
  useAuth: () => mockAuth,
}))

import { mockPush } from '@/test/mocks/next-navigation'

// Mock useSearchParams to return email
let searchParamsEmail = 'test@example.com'
vi.mock('next/navigation', async () => {
  const actual = await vi.importActual<typeof import('next/navigation')>('@/test/mocks/next-navigation')
  return {
    ...actual,
    useSearchParams: () => ({
      get: (key: string) => key === 'email' ? searchParamsEmail : null,
    }),
  }
})

beforeEach(() => {
  vi.clearAllMocks()
  searchParamsEmail = 'test@example.com'
})

describe('Verify Email Page', () => {
  it('should render verification code form', () => {
    render(<VerifyEmailPage />)

    expect(screen.getByTestId('verify-email-form')).toBeInTheDocument()
    expect(screen.getByLabelText(/verification code/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /verify/i })).toBeInTheDocument()
  })

  it('should display the email being verified', () => {
    render(<VerifyEmailPage />)

    expect(screen.getByText(/test@example.com/)).toBeInTheDocument()
  })

  it('should call confirmSignUp and redirect on success', async () => {
    const user = userEvent.setup()
    mockConfirmSignUp.mockResolvedValue(undefined)

    render(<VerifyEmailPage />)

    await user.type(screen.getByLabelText(/verification code/i), '123456')
    await user.click(screen.getByRole('button', { name: /verify/i }))

    expect(mockConfirmSignUp).toHaveBeenCalledWith('test@example.com', '123456')
    expect(mockPush).toHaveBeenCalledWith('/sign-in?verified=true')
  })

  it('should display error on invalid code', async () => {
    const user = userEvent.setup()
    mockConfirmSignUp.mockRejectedValue(new Error('Invalid verification code provided, please try again.'))

    render(<VerifyEmailPage />)

    await user.type(screen.getByLabelText(/verification code/i), '000000')
    await user.click(screen.getByRole('button', { name: /verify/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/invalid verification code/i)
  })

  it('should have a resend code button', async () => {
    const user = userEvent.setup()
    mockResendCode.mockResolvedValue(undefined)

    render(<VerifyEmailPage />)

    const resendButton = screen.getByRole('button', { name: /resend code/i })
    expect(resendButton).toBeInTheDocument()

    await user.click(resendButton)
    expect(mockResendCode).toHaveBeenCalledWith('test@example.com')
  })
})
