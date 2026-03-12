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
  completeNewPassword: vi.fn(),
  completeMfaChallenge: vi.fn(),
}))

// Mock the API client
vi.mock('@/lib/api', () => ({
  getAuthMe: vi.fn(),
}))

import * as cognito from '../cognito'
import { getAuthMe } from '@/lib/api'

const mockedCognito = vi.mocked(cognito)
const mockedGetAuthMe = vi.mocked(getAuthMe)

// Helper to create a fake ID token with claims
function fakeIdToken(claims: { email: string; name: string }) {
  const payload = btoa(JSON.stringify(claims))
  return `header.${payload}.signature`
}

const FAKE_TOKENS = {
  idToken: fakeIdToken({ email: 'bob@example.com', name: 'Bob' }),
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
}

// Test component that uses useAuth
function TestConsumer() {
  const auth = useAuth()
  return (
    <div>
      <span data-testid="loading">{String(auth.loading)}</span>
      <span data-testid="user-email">{auth.user?.email ?? 'none'}</span>
      <span data-testid="user-name">{auth.user?.name ?? 'none'}</span>
      <span data-testid="challenge">{auth.pendingChallenge ?? 'none'}</span>
      <span data-testid="roles">{auth.roles.join(',') || 'none'}</span>
      <span data-testid="is-admin">{String(auth.isAdmin)}</span>
      <span data-testid="is-artist">{String(auth.isArtist)}</span>
      <button onClick={() => auth.signIn('test@example.com', 'Password1')}>Sign In</button>
      <button onClick={() => auth.signOut()}>Sign Out</button>
      <button onClick={() => auth.completeNewPassword('NewPassword1')}>Complete New Password</button>
      <button onClick={() => auth.completeMfa('123456')}>Complete MFA</button>
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
    expect(screen.getByTestId('roles').textContent).toBe('none')
    expect(screen.getByTestId('is-admin').textContent).toBe('false')
    expect(screen.getByTestId('is-artist').textContent).toBe('false')
  })

  it('should restore user and roles from existing session on mount', async () => {
    const tokens = {
      idToken: fakeIdToken({ email: 'alice@example.com', name: 'Alice' }),
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    }
    mockedCognito.getCurrentSession.mockResolvedValue(tokens)
    mockedGetAuthMe.mockResolvedValue({
      id: 'user-1',
      email: 'alice@example.com',
      fullName: 'Alice',
      roles: ['artist', 'buyer'],
    })

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
    expect(screen.getByTestId('roles').textContent).toBe('artist,buyer')
    expect(screen.getByTestId('is-artist').textContent).toBe('true')
    expect(screen.getByTestId('is-admin').textContent).toBe('false')
  })

  it('should gracefully degrade when getAuthMe fails during session restore', async () => {
    const tokens = {
      idToken: fakeIdToken({ email: 'alice@example.com', name: 'Alice' }),
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    }
    mockedCognito.getCurrentSession.mockResolvedValue(tokens)
    mockedGetAuthMe.mockRejectedValue(new Error('Network error'))

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0))
    })

    // User is still signed in (Cognito session is valid)
    expect(screen.getByTestId('loading').textContent).toBe('false')
    expect(screen.getByTestId('user-email').textContent).toBe('alice@example.com')
    // But roles are empty (graceful degradation)
    expect(screen.getByTestId('roles').textContent).toBe('none')
  })

  it('should set user and fetch roles after successful sign-in', async () => {
    mockedCognito.getCurrentSession.mockResolvedValue(null)
    mockedCognito.signIn.mockResolvedValue({ type: 'success', tokens: FAKE_TOKENS })
    mockedGetAuthMe.mockResolvedValue({
      id: 'user-1',
      email: 'bob@example.com',
      fullName: 'Bob',
      roles: ['admin', 'buyer'],
    })

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
    expect(screen.getByTestId('challenge').textContent).toBe('none')
    expect(screen.getByTestId('roles').textContent).toBe('admin,buyer')
    expect(screen.getByTestId('is-admin').textContent).toBe('true')
  })

  it('should return roles from signIn', async () => {
    mockedCognito.getCurrentSession.mockResolvedValue(null)
    mockedCognito.signIn.mockResolvedValue({ type: 'success', tokens: FAKE_TOKENS })
    mockedGetAuthMe.mockResolvedValue({
      id: 'user-1',
      email: 'bob@example.com',
      fullName: 'Bob',
      roles: ['admin'],
    })

    let signInResult: { authenticated: boolean; roles: string[] } | undefined

    function SignInConsumer() {
      const auth = useAuth()
      return (
        <button
          onClick={async () => {
            signInResult = await auth.signIn('test@example.com', 'Password1')
          }}
        >
          Sign In
        </button>
      )
    }

    render(
      <AuthProvider>
        <SignInConsumer />
      </AuthProvider>
    )

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0))
    })

    await act(async () => {
      screen.getByText('Sign In').click()
    })

    expect(signInResult).toEqual({ authenticated: true, roles: ['admin'] })
  })

  it('should return not-authenticated from signIn when challenge is pending', async () => {
    mockedCognito.getCurrentSession.mockResolvedValue(null)
    mockedCognito.signIn.mockResolvedValue({
      type: 'newPasswordRequired',
      cognitoUser: {} as never,
      requiredAttributes: {},
    })

    let signInResult: { authenticated: boolean; roles: string[] } | undefined

    function SignInConsumer() {
      const auth = useAuth()
      return (
        <button
          onClick={async () => {
            signInResult = await auth.signIn('test@example.com', 'Password1')
          }}
        >
          Sign In
        </button>
      )
    }

    render(
      <AuthProvider>
        <SignInConsumer />
      </AuthProvider>
    )

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0))
    })

    await act(async () => {
      screen.getByText('Sign In').click()
    })

    expect(signInResult).toEqual({ authenticated: false, roles: [] })
  })

  it('should set pendingChallenge when sign-in returns NEW_PASSWORD_REQUIRED', async () => {
    mockedCognito.getCurrentSession.mockResolvedValue(null)
    const fakeCognitoUser = {} as never
    mockedCognito.signIn.mockResolvedValue({
      type: 'newPasswordRequired',
      cognitoUser: fakeCognitoUser,
      requiredAttributes: {},
    })

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0))
    })

    await act(async () => {
      screen.getByText('Sign In').click()
    })

    expect(screen.getByTestId('challenge').textContent).toBe('NEW_PASSWORD_REQUIRED')
    expect(screen.getByTestId('user-email').textContent).toBe('none')
  })

  it('should complete new password challenge, sign in user, and fetch roles', async () => {
    mockedCognito.getCurrentSession.mockResolvedValue(null)
    const fakeCognitoUser = {} as never
    mockedCognito.signIn.mockResolvedValue({
      type: 'newPasswordRequired',
      cognitoUser: fakeCognitoUser,
      requiredAttributes: {},
    })

    mockedCognito.completeNewPassword.mockResolvedValue(FAKE_TOKENS)
    mockedGetAuthMe.mockResolvedValue({
      id: 'user-1',
      email: 'bob@example.com',
      fullName: 'Bob',
      roles: ['artist'],
    })

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0))
    })

    // Trigger new password challenge
    await act(async () => {
      screen.getByText('Sign In').click()
    })

    expect(screen.getByTestId('challenge').textContent).toBe('NEW_PASSWORD_REQUIRED')

    // Complete the challenge
    await act(async () => {
      screen.getByText('Complete New Password').click()
    })

    expect(screen.getByTestId('challenge').textContent).toBe('none')
    expect(screen.getByTestId('user-email').textContent).toBe('bob@example.com')
    expect(screen.getByTestId('roles').textContent).toBe('artist')
    expect(mockedCognito.completeNewPassword).toHaveBeenCalledWith(fakeCognitoUser, 'NewPassword1')
  })

  it('should set pendingChallenge when sign-in returns MFA_REQUIRED', async () => {
    mockedCognito.getCurrentSession.mockResolvedValue(null)
    const fakeCognitoUser = {} as never
    mockedCognito.signIn.mockResolvedValue({
      type: 'mfaRequired',
      cognitoUser: fakeCognitoUser,
      mfaType: 'SMS_MFA',
    })

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0))
    })

    await act(async () => {
      screen.getByText('Sign In').click()
    })

    expect(screen.getByTestId('challenge').textContent).toBe('MFA_REQUIRED')
  })

  it('should complete MFA challenge, sign in user, and fetch roles', async () => {
    mockedCognito.getCurrentSession.mockResolvedValue(null)
    const fakeCognitoUser = {} as never
    mockedCognito.signIn.mockResolvedValue({
      type: 'mfaRequired',
      cognitoUser: fakeCognitoUser,
      mfaType: 'SMS_MFA',
    })

    const tokens = {
      idToken: fakeIdToken({ email: 'carol@example.com', name: 'Carol' }),
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    }
    mockedCognito.completeMfaChallenge.mockResolvedValue(tokens)
    mockedGetAuthMe.mockResolvedValue({
      id: 'user-3',
      email: 'carol@example.com',
      fullName: 'Carol',
      roles: ['buyer'],
    })

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0))
    })

    await act(async () => {
      screen.getByText('Sign In').click()
    })

    expect(screen.getByTestId('challenge').textContent).toBe('MFA_REQUIRED')

    await act(async () => {
      screen.getByText('Complete MFA').click()
    })

    expect(screen.getByTestId('challenge').textContent).toBe('none')
    expect(screen.getByTestId('user-email').textContent).toBe('carol@example.com')
    expect(screen.getByTestId('roles').textContent).toBe('buyer')
  })

  it('should clear user and roles on sign-out', async () => {
    const tokens = {
      idToken: fakeIdToken({ email: 'alice@example.com', name: 'Alice' }),
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    }
    mockedCognito.getCurrentSession.mockResolvedValue(tokens)
    mockedGetAuthMe.mockResolvedValue({
      id: 'user-1',
      email: 'alice@example.com',
      fullName: 'Alice',
      roles: ['admin'],
    })

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0))
    })

    expect(screen.getByTestId('user-email').textContent).toBe('alice@example.com')
    expect(screen.getByTestId('roles').textContent).toBe('admin')
    expect(screen.getByTestId('is-admin').textContent).toBe('true')

    // Click sign out
    await act(async () => {
      screen.getByText('Sign Out').click()
    })

    expect(screen.getByTestId('user-email').textContent).toBe('none')
    expect(screen.getByTestId('roles').textContent).toBe('none')
    expect(screen.getByTestId('is-admin').textContent).toBe('false')
    expect(mockedCognito.signOut).toHaveBeenCalled()
  })

  it('should expose hasRole helper', async () => {
    mockedCognito.getCurrentSession.mockResolvedValue(null)
    mockedCognito.signIn.mockResolvedValue({ type: 'success', tokens: FAKE_TOKENS })
    mockedGetAuthMe.mockResolvedValue({
      id: 'user-1',
      email: 'bob@example.com',
      fullName: 'Bob',
      roles: ['admin', 'buyer'],
    })

    let hasAdminRole = false
    let hasArtistRole = false

    function HasRoleConsumer() {
      const auth = useAuth()
      return (
        <div>
          <button
            onClick={async () => {
              await auth.signIn('test@example.com', 'Password1')
              hasAdminRole = auth.hasRole('admin')
              hasArtistRole = auth.hasRole('artist')
            }}
          >
            Sign In
          </button>
          <span data-testid="has-admin">{String(auth.hasRole('admin'))}</span>
          <span data-testid="has-artist">{String(auth.hasRole('artist'))}</span>
        </div>
      )
    }

    render(
      <AuthProvider>
        <HasRoleConsumer />
      </AuthProvider>
    )

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0))
    })

    await act(async () => {
      screen.getByText('Sign In').click()
    })

    expect(screen.getByTestId('has-admin').textContent).toBe('true')
    expect(screen.getByTestId('has-artist').textContent).toBe('false')
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
