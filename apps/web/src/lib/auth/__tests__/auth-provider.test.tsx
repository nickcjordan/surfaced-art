import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { AuthProvider, useAuth } from '../auth-provider'

// Mock the cognito module
vi.mock('../cognito', () => ({
  signUp: vi.fn(),
  confirmSignUp: vi.fn(),
  resendConfirmationCode: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
  getCurrentSession: vi.fn(),
  forgotPassword: vi.fn(),
  confirmPassword: vi.fn(),
}))

import * as cognito from '../cognito'

const mockedCognito = vi.mocked(cognito)

// Helper to create a fake ID token with claims
function fakeIdToken(claims: { email: string; name: string }) {
  const payload = btoa(JSON.stringify(claims))
  return `header.${payload}.signature`
}

// Test component that uses useAuth
function TestConsumer() {
  const auth = useAuth()
  return (
    <div>
      <span data-testid="loading">{String(auth.loading)}</span>
      <span data-testid="user-email">{auth.user?.email ?? 'none'}</span>
      <span data-testid="user-name">{auth.user?.name ?? 'none'}</span>
      <button onClick={() => auth.signIn('test@example.com', 'Password1')}>Sign In</button>
      <button onClick={() => auth.signOut()}>Sign Out</button>
    </div>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('AuthProvider', () => {
  it('should start in loading state and resolve to no user when no session exists', async () => {
    mockedCognito.getCurrentSession.mockResolvedValue(null)

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )

    // Initially loading
    expect(screen.getByTestId('loading').textContent).toBe('true')

    // Wait for session check to complete
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0))
    })

    expect(screen.getByTestId('loading').textContent).toBe('false')
    expect(screen.getByTestId('user-email').textContent).toBe('none')
  })

  it('should restore user from existing session on mount', async () => {
    const tokens = {
      idToken: fakeIdToken({ email: 'alice@example.com', name: 'Alice' }),
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    }
    mockedCognito.getCurrentSession.mockResolvedValue(tokens)

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0))
    })

    expect(screen.getByTestId('loading').textContent).toBe('false')
    expect(screen.getByTestId('user-email').textContent).toBe('alice@example.com')
    expect(screen.getByTestId('user-name').textContent).toBe('Alice')
  })

  it('should set user after successful sign-in', async () => {
    mockedCognito.getCurrentSession.mockResolvedValue(null)
    const tokens = {
      idToken: fakeIdToken({ email: 'bob@example.com', name: 'Bob' }),
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    }
    mockedCognito.signIn.mockResolvedValue(tokens)

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0))
    })

    // Click sign in
    await act(async () => {
      screen.getByText('Sign In').click()
    })

    expect(screen.getByTestId('user-email').textContent).toBe('bob@example.com')
  })

  it('should clear user on sign-out', async () => {
    const tokens = {
      idToken: fakeIdToken({ email: 'alice@example.com', name: 'Alice' }),
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    }
    mockedCognito.getCurrentSession.mockResolvedValue(tokens)

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0))
    })

    expect(screen.getByTestId('user-email').textContent).toBe('alice@example.com')

    // Click sign out
    await act(async () => {
      screen.getByText('Sign Out').click()
    })

    expect(screen.getByTestId('user-email').textContent).toBe('none')
    expect(mockedCognito.signOut).toHaveBeenCalled()
  })
})

describe('useAuth', () => {
  it('should throw when used outside AuthProvider', () => {
    // Suppress console.error for this test
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})

    function BadConsumer() {
      useAuth()
      return null
    }

    expect(() => render(<BadConsumer />)).toThrow('useAuth must be used within an AuthProvider')
    spy.mockRestore()
  })
})
