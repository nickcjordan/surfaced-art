import { describe, it, expect, vi, beforeEach } from 'vitest'

// Set required env vars before cognito module reads them at import time.
// vi.hoisted runs before all imports, ensuring the env is set before cognito.ts
// reads process.env at module scope.
vi.hoisted(() => {
  process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID = 'us-east-1_testpool'
  process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID = 'testclientid'
})

// Mock amazon-cognito-identity-js
const mockAuthenticateUser = vi.fn()
const mockCompleteNewPasswordChallenge = vi.fn()
const mockSendMFACode = vi.fn()

vi.mock('amazon-cognito-identity-js', () => {
  class MockCognitoUserPool {}
  class MockCognitoUser {
    authenticateUser = mockAuthenticateUser
    completeNewPasswordChallenge = mockCompleteNewPasswordChallenge
    sendMFACode = mockSendMFACode
  }
  class MockAuthenticationDetails {
    constructor(public details: { Username: string; Password: string }) {}
  }
  class MockCognitoUserAttribute {}

  return {
    CognitoUserPool: MockCognitoUserPool,
    CognitoUser: MockCognitoUser,
    AuthenticationDetails: MockAuthenticationDetails,
    CognitoUserAttribute: MockCognitoUserAttribute,
    CognitoUserSession: vi.fn(),
  }
})

import { signIn, completeNewPassword } from '../cognito'

beforeEach(() => {
  vi.clearAllMocks()
})

function fakeSession() {
  return {
    getIdToken: () => ({ getJwtToken: () => 'id-token' }),
    getAccessToken: () => ({ getJwtToken: () => 'access-token' }),
    getRefreshToken: () => ({ getToken: () => 'refresh-token' }),
  }
}

describe('signIn', () => {
  it('should return tokens on successful authentication', async () => {
    mockAuthenticateUser.mockImplementation((_details: unknown, callbacks: { onSuccess: (session: ReturnType<typeof fakeSession>) => void }) => {
      callbacks.onSuccess(fakeSession())
    })

    const result = await signIn('test@example.com', 'Password1')

    expect(result).toEqual({
      type: 'success',
      tokens: {
        idToken: 'id-token',
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      },
    })
  })

  it('should return a NEW_PASSWORD_REQUIRED challenge when Cognito requires a new password', async () => {
    mockAuthenticateUser.mockImplementation((_details: unknown, callbacks: { newPasswordRequired: (userAttributes: Record<string, string>) => void }) => {
      callbacks.newPasswordRequired({ email: 'test@example.com' })
    })

    const result = await signIn('test@example.com', 'TempPass1')

    expect(result.type).toBe('newPasswordRequired')
    if (result.type === 'newPasswordRequired') {
      expect(result.requiredAttributes).toEqual({ email: 'test@example.com' })
    }
  })

  it('should return an MFA_REQUIRED challenge when Cognito requires MFA', async () => {
    mockAuthenticateUser.mockImplementation((_details: unknown, callbacks: { mfaRequired: (challengeName: string) => void }) => {
      callbacks.mfaRequired('SMS_MFA')
    })

    const result = await signIn('test@example.com', 'Password1')

    expect(result.type).toBe('mfaRequired')
    if (result.type === 'mfaRequired') {
      expect(result.mfaType).toBe('SMS_MFA')
    }
  })

  it('should return a TOTP challenge when Cognito requires software token MFA', async () => {
    mockAuthenticateUser.mockImplementation((_details: unknown, callbacks: { totpRequired: (challengeName: string) => void }) => {
      callbacks.totpRequired('SOFTWARE_TOKEN_MFA')
    })

    const result = await signIn('test@example.com', 'Password1')

    expect(result.type).toBe('mfaRequired')
    if (result.type === 'mfaRequired') {
      expect(result.mfaType).toBe('SOFTWARE_TOKEN_MFA')
    }
  })

  it('should reject on authentication failure', async () => {
    mockAuthenticateUser.mockImplementation((_details: unknown, callbacks: { onFailure: (err: Error) => void }) => {
      callbacks.onFailure(new Error('Incorrect username or password.'))
    })

    await expect(signIn('test@example.com', 'WrongPass')).rejects.toThrow('Incorrect username or password.')
  })
})

describe('completeNewPassword', () => {
  it('should resolve with tokens after setting new password', async () => {
    // First sign in to get a challenge result with cognitoUser reference
    mockAuthenticateUser.mockImplementation((_details: unknown, callbacks: { newPasswordRequired: (userAttributes: Record<string, string>) => void }) => {
      callbacks.newPasswordRequired({ email: 'test@example.com' })
    })

    const signInResult = await signIn('test@example.com', 'TempPass1')
    expect(signInResult.type).toBe('newPasswordRequired')

    if (signInResult.type !== 'newPasswordRequired') return

    // Now complete the challenge
    mockCompleteNewPasswordChallenge.mockImplementation(
      (_newPassword: string, _attrs: Record<string, string>, callbacks: { onSuccess: (session: ReturnType<typeof fakeSession>) => void }) => {
        callbacks.onSuccess(fakeSession())
      }
    )

    const tokens = await completeNewPassword(signInResult.cognitoUser, 'NewPassword1')

    expect(tokens).toEqual({
      idToken: 'id-token',
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    })
    expect(mockCompleteNewPasswordChallenge).toHaveBeenCalledWith(
      'NewPassword1',
      {},
      expect.objectContaining({ onSuccess: expect.any(Function), onFailure: expect.any(Function) })
    )
  })

  it('should reject when completeNewPasswordChallenge fails', async () => {
    mockAuthenticateUser.mockImplementation((_details: unknown, callbacks: { newPasswordRequired: (userAttributes: Record<string, string>) => void }) => {
      callbacks.newPasswordRequired({})
    })

    const signInResult = await signIn('test@example.com', 'TempPass1')
    if (signInResult.type !== 'newPasswordRequired') return

    mockCompleteNewPasswordChallenge.mockImplementation(
      (_newPassword: string, _attrs: Record<string, string>, callbacks: { onFailure: (err: Error) => void }) => {
        callbacks.onFailure(new Error('Password does not meet requirements'))
      }
    )

    await expect(completeNewPassword(signInResult.cognitoUser, 'weak')).rejects.toThrow(
      'Password does not meet requirements'
    )
  })
})

describe('completeMfaChallenge', () => {
  it('should resolve with tokens after submitting MFA code', async () => {
    // Get an MFA challenge
    mockAuthenticateUser.mockImplementation((_details: unknown, callbacks: { mfaRequired: (challengeName: string) => void }) => {
      callbacks.mfaRequired('SMS_MFA')
    })

    const signInResult = await signIn('test@example.com', 'Password1')
    expect(signInResult.type).toBe('mfaRequired')
    if (signInResult.type !== 'mfaRequired') return

    // Import the function we need
    const { completeMfaChallenge } = await import('../cognito')

    mockSendMFACode.mockImplementation(
      (_code: string, callbacks: { onSuccess: (session: ReturnType<typeof fakeSession>) => void })  => {
        callbacks.onSuccess(fakeSession())
      }
    )

    const tokens = await completeMfaChallenge(signInResult.cognitoUser, '123456')

    expect(tokens).toEqual({
      idToken: 'id-token',
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    })
  })
})
