'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { UserRoleType } from '@surfaced-art/types'
import * as cognito from './cognito'
import type { AuthTokens } from './cognito'
import type { CognitoUser } from 'amazon-cognito-identity-js'
import { AUTH_COOKIE_NAME } from './constants'
import { getAuthMe } from '@/lib/api'

export interface AuthUser {
  email: string
  name: string
}

export type PendingChallenge = 'NEW_PASSWORD_REQUIRED' | 'MFA_REQUIRED' | null

export interface AuthContextValue {
  /** Current authenticated user, or null if not signed in */
  user: AuthUser | null
  /** True while the initial session check is in progress */
  loading: boolean
  /** Active auth challenge requiring user input, or null */
  pendingChallenge: PendingChallenge
  /** User's roles from the API */
  roles: UserRoleType[]
  /** True if the user has the admin role */
  isAdmin: boolean
  /** True if the user has the artist role */
  isArtist: boolean
  /** Check if the user has a specific role */
  hasRole: (role: UserRoleType) => boolean
  /** Sign in with email and password. Returns auth result with roles. */
  signIn: (email: string, password: string) => Promise<{ authenticated: boolean; roles: UserRoleType[] }>
  /** Sign up with email, password, and full name */
  signUp: (email: string, password: string, fullName: string) => Promise<{ userConfirmed: boolean }>
  /** Confirm email verification code after sign-up */
  confirmSignUp: (email: string, code: string) => Promise<void>
  /** Resend the email verification code */
  resendCode: (email: string) => Promise<void>
  /** Sign out and clear session */
  signOut: () => void
  /** Initiate forgot password flow */
  forgotPassword: (email: string) => Promise<void>
  /** Confirm new password with verification code */
  confirmPassword: (email: string, code: string, newPassword: string) => Promise<void>
  /** Complete the NEW_PASSWORD_REQUIRED challenge. Returns roles. */
  completeNewPassword: (newPassword: string) => Promise<{ roles: UserRoleType[] }>
  /** Complete an MFA challenge with a verification code. Returns roles. */
  completeMfa: (code: string) => Promise<{ roles: UserRoleType[] }>
  /** Get current ID token for API calls, or null if not signed in */
  getIdToken: () => Promise<string | null>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function extractUserFromTokens(tokens: AuthTokens): AuthUser {
  try {
    const payload = JSON.parse(atob(tokens.idToken.split('.')[1]))
    return {
      email: payload.email ?? '',
      name: payload.name ?? payload.email?.split('@')[0] ?? '',
    }
  } catch {
    return { email: '', name: '' }
  }
}

/**
 * Fetch user roles from the API. Returns empty array on failure (graceful degradation).
 */
async function fetchRoles(idToken: string): Promise<UserRoleType[]> {
  try {
    const me = await getAuthMe(idToken)
    return me.roles
  } catch {
    return []
  }
}

/**
 * Set a non-sensitive marker cookie for the Next.js middleware to check.
 * The value is just "1" — the actual JWT is never stored in a cookie.
 * This is a client-side routing guard only; real auth happens via the
 * Authorization header validated by the API.
 */
function setAuthCookie() {
  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${AUTH_COOKIE_NAME}=1; path=/; SameSite=Lax; max-age=3600${secure}`
}

/** Clear the middleware guard cookie on sign-out. */
function clearAuthCookie() {
  document.cookie = `${AUTH_COOKIE_NAME}=; path=/; max-age=0`
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [pendingChallenge, setPendingChallenge] = useState<PendingChallenge>(null)
  const [challengeUser, setChallengeUser] = useState<CognitoUser | null>(null)
  const [roles, setRoles] = useState<UserRoleType[]>([])

  // Check for existing session on mount
  useEffect(() => {
    let cancelled = false

    async function checkSession() {
      try {
        const tokens = await cognito.getCurrentSession()
        if (!cancelled && tokens) {
          setUser(extractUserFromTokens(tokens))
          setAuthCookie()
          const userRoles = await fetchRoles(tokens.idToken)
          if (!cancelled) {
            setRoles(userRoles)
          }
        }
      } catch {
        // No valid session — remain signed out
        clearAuthCookie()
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    checkSession()
    return () => { cancelled = true }
  }, [])

  const handleSignIn = useCallback(async (email: string, password: string): Promise<{ authenticated: boolean; roles: UserRoleType[] }> => {
    const result = await cognito.signIn(email, password)

    switch (result.type) {
      case 'success': {
        setUser(extractUserFromTokens(result.tokens))
        setAuthCookie()
        setPendingChallenge(null)
        setChallengeUser(null)
        const userRoles = await fetchRoles(result.tokens.idToken)
        setRoles(userRoles)
        return { authenticated: true, roles: userRoles }
      }
      case 'newPasswordRequired':
        setChallengeUser(result.cognitoUser)
        setPendingChallenge('NEW_PASSWORD_REQUIRED')
        return { authenticated: false, roles: [] }
      case 'mfaRequired':
        setChallengeUser(result.cognitoUser)
        setPendingChallenge('MFA_REQUIRED')
        return { authenticated: false, roles: [] }
    }
  }, [])

  const handleSignUp = useCallback(async (email: string, password: string, fullName: string) => {
    const result = await cognito.signUp(email, password, fullName)
    return { userConfirmed: result.userConfirmed }
  }, [])

  const handleConfirmSignUp = useCallback(async (email: string, code: string) => {
    await cognito.confirmSignUp(email, code)
  }, [])

  const handleResendCode = useCallback(async (email: string) => {
    await cognito.resendConfirmationCode(email)
  }, [])

  const handleSignOut = useCallback(() => {
    cognito.signOut()
    clearAuthCookie()
    setUser(null)
    setRoles([])
  }, [])

  const handleForgotPassword = useCallback(async (email: string) => {
    await cognito.forgotPassword(email)
  }, [])

  const handleConfirmPassword = useCallback(async (email: string, code: string, newPassword: string) => {
    await cognito.confirmPassword(email, code, newPassword)
  }, [])

  const handleCompleteNewPassword = useCallback(async (newPassword: string): Promise<{ roles: UserRoleType[] }> => {
    if (!challengeUser) {
      throw new Error('No pending new password challenge')
    }
    const tokens = await cognito.completeNewPassword(challengeUser, newPassword)
    setUser(extractUserFromTokens(tokens))
    setAuthCookie()
    setPendingChallenge(null)
    setChallengeUser(null)
    const userRoles = await fetchRoles(tokens.idToken)
    setRoles(userRoles)
    return { roles: userRoles }
  }, [challengeUser])

  const handleCompleteMfa = useCallback(async (code: string): Promise<{ roles: UserRoleType[] }> => {
    if (!challengeUser) {
      throw new Error('No pending MFA challenge')
    }
    const tokens = await cognito.completeMfaChallenge(challengeUser, code)
    setUser(extractUserFromTokens(tokens))
    setAuthCookie()
    setPendingChallenge(null)
    setChallengeUser(null)
    const userRoles = await fetchRoles(tokens.idToken)
    setRoles(userRoles)
    return { roles: userRoles }
  }, [challengeUser])

  const getIdToken = useCallback(async (): Promise<string | null> => {
    const tokens = await cognito.getCurrentSession()
    return tokens?.idToken ?? null
  }, [])

  const hasRole = useCallback((role: UserRoleType) => roles.includes(role), [roles])

  const isAdmin = useMemo(() => roles.includes('admin'), [roles])
  const isArtist = useMemo(() => roles.includes('artist'), [roles])

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    pendingChallenge,
    roles,
    isAdmin,
    isArtist,
    hasRole,
    signIn: handleSignIn,
    signUp: handleSignUp,
    confirmSignUp: handleConfirmSignUp,
    resendCode: handleResendCode,
    signOut: handleSignOut,
    forgotPassword: handleForgotPassword,
    confirmPassword: handleConfirmPassword,
    completeNewPassword: handleCompleteNewPassword,
    completeMfa: handleCompleteMfa,
    getIdToken,
  }), [user, loading, pendingChallenge, roles, isAdmin, isArtist, hasRole, handleSignIn, handleSignUp, handleConfirmSignUp, handleResendCode, handleSignOut, handleForgotPassword, handleConfirmPassword, handleCompleteNewPassword, handleCompleteMfa, getIdToken])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * Hook to access auth state and methods.
 * Must be used inside an AuthProvider.
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
