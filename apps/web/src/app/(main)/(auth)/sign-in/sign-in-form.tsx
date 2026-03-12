'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export function SignInForm() {
  const { signIn, pendingChallenge, completeNewPassword, completeMfa } = useAuth()
  const searchParams = useSearchParams()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // New password challenge state
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')

  // MFA challenge state
  const [mfaCode, setMfaCode] = useState('')

  const verified = searchParams.get('verified') === 'true'
  const reset = searchParams.get('reset') === 'true'
  const explicitRedirect = searchParams.get('redirect')
  const defaultRedirect = '/dashboard'

  /** Pick redirect target based on roles — admin goes to /admin unless an explicit redirect was given. */
  function getRedirectForRoles(roles: string[]): string {
    if (explicitRedirect) return explicitRedirect
    if (roles.includes('admin')) return '/admin'
    return defaultRedirect
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      const result = await signIn(email, password)
      if (result.authenticated) {
        // Full navigation (not router.push) ensures clean state after auth
        window.location.href = getRedirectForRoles(result.roles)
        return
      }
      // Challenge was set — form will re-render to show challenge UI
    } catch (err) {
      if (err instanceof Error && err.name === 'UserNotConfirmedException') {
        window.location.href = `/verify-email?email=${encodeURIComponent(email)}`
        return
      }
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleNewPassword(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match')
      return
    }

    setSubmitting(true)

    try {
      const result = await completeNewPassword(newPassword)
      window.location.href = getRedirectForRoles(result.roles)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleMfa(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      const result = await completeMfa(mfaCode)
      window.location.href = getRedirectForRoles(result.roles)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  // NEW_PASSWORD_REQUIRED challenge UI
  if (pendingChallenge === 'NEW_PASSWORD_REQUIRED') {
    return (
      <Card className="border border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Set a New Password</CardTitle>
          <CardDescription>
            Your account requires a new password. Please choose a secure password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form data-testid="new-password-form" onSubmit={handleNewPassword} className="space-y-4">
            {error && (
              <div className="rounded-md bg-error/10 p-3 text-sm text-error" role="alert">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="newPassword">New password</Label>
              <Input
                id="newPassword"
                type="password"
                required
                autoComplete="new-password"
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                data-testid="new-password-input"
              />
              <p className="text-xs text-muted-foreground">
                At least 8 characters, with uppercase, lowercase, and a number
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmNewPassword">Confirm new password</Label>
              <Input
                id="confirmNewPassword"
                type="password"
                required
                autoComplete="new-password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                data-testid="confirm-new-password-input"
              />
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Setting password...' : 'Set password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    )
  }

  // MFA_REQUIRED challenge UI
  if (pendingChallenge === 'MFA_REQUIRED') {
    return (
      <Card className="border border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Verification Code</CardTitle>
          <CardDescription>
            Enter the verification code sent to your device.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form data-testid="mfa-form" onSubmit={handleMfa} className="space-y-4">
            {error && (
              <div className="rounded-md bg-error/10 p-3 text-sm text-error" role="alert">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="mfaCode">Code</Label>
              <Input
                id="mfaCode"
                type="text"
                required
                autoComplete="one-time-code"
                inputMode="numeric"
                maxLength={6}
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value)}
                data-testid="mfa-code-input"
              />
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Verifying...' : 'Verify'}
            </Button>
          </form>
        </CardContent>
      </Card>
    )
  }

  // Default sign-in form
  return (
    <Card className="border border-border shadow-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Sign In</CardTitle>
        <CardDescription>Sign in to your Surfaced Art account</CardDescription>
      </CardHeader>
      <CardContent>
        {verified && (
          <div className="mb-4 rounded-md bg-success/10 p-3 text-sm text-success" role="status">
            Email verified successfully. You can now sign in.
          </div>
        )}
        {reset && (
          <div className="mb-4 rounded-md bg-success/10 p-3 text-sm text-success" role="status">
            Password reset successfully. Sign in with your new password.
          </div>
        )}
        <form data-testid="sign-in-form" onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-error/10 p-3 text-sm text-error" role="alert">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              data-testid="sign-in-email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              data-testid="sign-in-password"
            />
          </div>

          <div className="flex justify-end">
            <Link href="/forgot-password" className="text-sm text-accent-primary hover:underline">
              Forgot password?
            </Link>
          </div>

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link href="/sign-up" className="text-accent-primary hover:underline">
            Sign up
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
