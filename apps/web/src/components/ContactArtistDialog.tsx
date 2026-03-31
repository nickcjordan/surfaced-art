'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Mail } from 'lucide-react'
import { contactArtist } from '@/lib/api'

type FormState = 'idle' | 'submitting' | 'success' | 'error'

interface ContactArtistDialogProps {
  artistSlug: string
  artistName: string
}

export function ContactArtistDialog({
  artistSlug,
  artistName,
}: ContactArtistDialogProps) {
  const [open, setOpen] = useState(false)
  const [formState, setFormState] = useState<FormState>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  function handleOpenChange(isOpen: boolean) {
    setOpen(isOpen)
    if (!isOpen) {
      // Reset on close
      setFormState('idle')
      setErrorMessage('')
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFormState('submitting')
    setErrorMessage('')

    const formData = new FormData(e.currentTarget)
    const firstName = (formData.get('firstName') as string).trim()
    const lastName = (formData.get('lastName') as string).trim()
    const email = (formData.get('email') as string).trim()
    const subject = (formData.get('subject') as string).trim()
    const message = (formData.get('message') as string).trim()
    const website = (formData.get('website') as string) || ''

    try {
      await contactArtist(artistSlug, {
        firstName,
        lastName,
        email,
        subject,
        message,
        website,
      })
      setFormState('success')
    } catch (err) {
      setFormState('error')
      if (err instanceof Error) {
        setErrorMessage(err.message)
      } else {
        setErrorMessage('Something went wrong. Please try again.')
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button
          data-testid="contact-artist-button"
          className="flex items-center gap-3 text-foreground transition-colors hover:text-accent-primary"
        >
          <Mail className="size-4 shrink-0 text-muted-text" />
          <span className="text-sm">Contact</span>
        </button>
      </DialogTrigger>
      <DialogContent
        data-testid="contact-artist-dialog"
        className="sm:max-w-md"
      >
        <DialogHeader>
          <DialogTitle>Contact {artistName}</DialogTitle>
        </DialogHeader>

        {formState === 'success' ? (
          <div data-testid="contact-success" className="py-6 text-center">
            <p className="text-body-default text-foreground">
              Your message has been sent.
            </p>
            <p className="mt-2 text-sm text-muted-text">
              {artistName} can reply directly to your email.
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            data-testid="contact-artist-form"
            className="grid gap-4"
          >
            {formState === 'error' && (
              <div
                role="alert"
                data-testid="contact-error"
                className="rounded-md bg-error/10 px-3 py-2 text-sm text-error"
              >
                {errorMessage}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="contact-firstName">
                  First Name <span className="text-error">*</span>
                </Label>
                <Input
                  id="contact-firstName"
                  name="firstName"
                  required
                  maxLength={100}
                  data-testid="contact-firstName"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="contact-lastName">
                  Last Name <span className="text-error">*</span>
                </Label>
                <Input
                  id="contact-lastName"
                  name="lastName"
                  required
                  maxLength={100}
                  data-testid="contact-lastName"
                />
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="contact-email">
                Email <span className="text-error">*</span>
              </Label>
              <Input
                id="contact-email"
                name="email"
                type="email"
                required
                maxLength={320}
                data-testid="contact-email"
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="contact-subject">
                Subject <span className="text-error">*</span>
              </Label>
              <Input
                id="contact-subject"
                name="subject"
                required
                maxLength={200}
                data-testid="contact-subject"
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="contact-message">
                Message <span className="text-error">*</span>
              </Label>
              <Textarea
                id="contact-message"
                name="message"
                required
                minLength={10}
                maxLength={5000}
                rows={5}
                data-testid="contact-message"
              />
            </div>

            {/* Honeypot — hidden from humans */}
            <div className="sr-only" aria-hidden="true">
              <label htmlFor="contact-website">Website</label>
              <input
                id="contact-website"
                name="website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            <Button
              type="submit"
              disabled={formState === 'submitting'}
              data-testid="contact-submit"
              className="w-full"
            >
              {formState === 'submitting' ? 'Sending...' : 'Send Message'}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
