'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { joinWaitlist } from '@/lib/api'

type WaitlistState = 'idle' | 'submitting' | 'success' | 'error'

export function WaitlistForm() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<WaitlistState>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const trimmed = email.trim()
    if (!trimmed) {
      setState('error')
      setErrorMessage('Please enter your email address.')
      return
    }

    setState('submitting')
    setErrorMessage('')

    try {
      await joinWaitlist(trimmed)
      setState('success')
      setEmail('')
    } catch {
      setState('error')
      setErrorMessage('Something went wrong. Please try again.')
    }
  }

  if (state === 'success') {
    return (
      <div data-testid="waitlist-success" className="text-center">
        <p className="font-serif text-lg text-foreground">You&rsquo;re on the list.</p>
        <p className="mt-2 text-sm text-muted-text">
          We&rsquo;ll let you know when the gallery opens to buyers.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col items-center gap-3 sm:flex-row sm:gap-2">
      <Input
        data-testid="waitlist-email-input"
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={state === 'submitting'}
        aria-invalid={state === 'error' || undefined}
        className="max-w-sm"
      />
      <Button
        data-testid="waitlist-submit"
        type="submit"
        disabled={state === 'submitting'}
        className="w-full sm:w-auto"
      >
        {state === 'submitting' ? 'Joining…' : 'Join the Waitlist'}
      </Button>
      {state === 'error' && (
        <p data-testid="waitlist-error" className="text-sm text-error" role="alert">
          {errorMessage}
        </p>
      )}
    </form>
  )
}
