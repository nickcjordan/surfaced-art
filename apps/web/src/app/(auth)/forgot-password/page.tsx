'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuth()
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      await forgotPassword(email)
      router.push(`/reset-password?email=${encodeURIComponent(email)}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card className="border border-border shadow-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Forgot Password</CardTitle>
        <CardDescription>
          Enter your email and we&apos;ll send you a code to reset your password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form data-testid="forgot-password-form" onSubmit={handleSubmit} className="space-y-4">
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
              data-testid="forgot-password-email"
            />
          </div>

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'Sending code...' : 'Send reset code'}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center">
        <Link href="/sign-in" className="text-sm text-accent-primary hover:underline">
          Back to sign in
        </Link>
      </CardFooter>
    </Card>
  )
}
