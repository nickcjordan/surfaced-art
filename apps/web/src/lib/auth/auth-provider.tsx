'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import * as cognito from './cognito'
import type { AuthTokens } from './cognito'
import { AUTH_COOKIE_NAME } from './constants'

export interface AuthUser {
  email: string
  name: string
}

export interface AuthContextValue {
  /** Current authenticated user, or null if not signed in */
  user: AuthUser | null
  /** True while the initial session check is in progress */
  loading: boolean
  /** Sign in with email and password */
  signIn: (email: string, password: string) => Promise<void>
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

  // Check for existing session on mount
  useEffect(() => {
    let cancelled = false

    async function checkSession() {
      try {
        const tokens = await cognito.getCurrentSession()
        if (!cancelled && tokens) {
          setUser(extractUserFromTokens(tokens))
          setAuthCookie()
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

  const handleSignIn = useCallback(async (email: string, password: string) => {
    const tokens = await cognito.signIn(email, password)
    setUser(extractUserFromTokens(tokens))
    setAuthCookie()
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
  }, [])

  const handleForgotPassword = useCallback(async (email: string) => {
    await cognito.forgotPassword(email)
  }, [])

  const handleConfirmPassword = useCallback(async (email: string, code: string, newPassword: string) => {
    await cognito.confirmPassword(email, code, newPassword)
  }, [])

  const getIdToken = useCallback(async (): Promise<string | null> => {
    const tokens = await cognito.getCurrentSession()
    return tokens?.idToken ?? null
  }, [])

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    signIn: handleSignIn,
    signUp: handleSignUp,
    confirmSignUp: handleConfirmSignUp,
    resendCode: handleResendCode,
    signOut: handleSignOut,
    forgotPassword: handleForgotPassword,
    confirmPassword: handleConfirmPassword,
    getIdToken,
  }), [user, loading, handleSignIn, handleSignUp, handleConfirmSignUp, handleResendCode, handleSignOut, handleForgotPassword, handleConfirmPassword, getIdToken])

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
