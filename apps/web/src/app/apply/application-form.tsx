'use client'

import { useState } from 'react'
import Link from 'next/link'
import { artistApplicationBody } from '@surfaced-art/types'
import type { CategoryType } from '@surfaced-art/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { CATEGORIES } from '@/lib/categories'
import { submitApplication, checkApplicationEmail, ApiError } from '@/lib/api'
import { cn } from '@/lib/utils'

type FormState = 'idle' | 'submitting' | 'success' | 'error' | 'duplicate'

interface FormData {
  fullName: string
  email: string
  instagramUrl: string
  websiteUrl: string
  statement: string
  exhibitionHistory: string
  categories: CategoryType[]
}

const initialFormData: FormData = {
  fullName: '',
  email: '',
  instagramUrl: '',
  websiteUrl: '',
  statement: '',
  exhibitionHistory: '',
  categories: [],
}

export function ApplicationForm() {
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [formState, setFormState] = useState<FormState>('idle')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [emailChecked, setEmailChecked] = useState(false)

  function updateField<K extends keyof FormData>(field: K, value: FormData[K]) {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear field error when user edits
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  function toggleCategory(category: CategoryType) {
    setFormData((prev) => {
      const categories = prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category]
      return { ...prev, categories }
    })
    if (fieldErrors.categories) {
      setFieldErrors((prev) => {
        const next = { ...prev }
        delete next.categories
        return next
      })
    }
  }

  async function handleEmailBlur() {
    const email = formData.email.trim().toLowerCase()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return

    try {
      const result = await checkApplicationEmail(email)
      if (result.exists) {
        setFieldErrors((prev) => ({
          ...prev,
          email: 'An application with this email already exists',
        }))
        setEmailChecked(true)
      } else {
        setEmailChecked(false)
      }
    } catch {
      // Don't block the form for email check failures
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setServerError(null)

    // Client-side validation with shared Zod schema
    const parsed = artistApplicationBody.safeParse(formData)
    if (!parsed.success) {
      const errors: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        const field = issue.path[0]?.toString()
        if (field && !errors[field]) {
          errors[field] = issue.message
        }
      }
      setFieldErrors(errors)
      return
    }

    // Block if email duplicate check found a conflict
    if (emailChecked && fieldErrors.email) return

    setFormState('submitting')
    setFieldErrors({})

    try {
      await submitApplication(parsed.data)
      setFormState('success')
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setServerError(
          'An application with this email already exists. We\'ll be in touch!'
        )
        setFormState('error')
      } else {
        setServerError('Something went wrong. Please try again later.')
        setFormState('error')
      }
    }
  }

  if (formState === 'success') {
    return (
      <Card data-testid="apply-success">
        <CardContent className="py-12 text-center">
          <h2 className="mb-4">Application Submitted</h2>
          <p className="text-muted-foreground">
            We&apos;ll review your application and get back to you at{' '}
            <strong>{formData.email}</strong> within 5-7 business days.
          </p>
          <Link href="/" className="mt-6 inline-block text-primary underline">
            Back to homepage
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <form onSubmit={handleSubmit} data-testid="apply-form" noValidate>
      {serverError && (
        <div
          role="alert"
          data-testid="apply-error"
          className="mb-6 rounded-md border border-error bg-error/10 p-4 text-sm text-error"
        >
          {serverError}
        </div>
      )}

      {/* Personal Info */}
      <fieldset className="mb-8 space-y-4">
        <legend className="mb-2 text-lg font-semibold">Personal Info</legend>

        <div>
          <Label htmlFor="fullName">Full Name *</Label>
          <Input
            id="fullName"
            data-testid="apply-full-name"
            value={formData.fullName}
            onChange={(e) => updateField('fullName', e.target.value)}
            aria-invalid={!!fieldErrors.fullName}
            autoComplete="name"
          />
          {fieldErrors.fullName && (
            <p data-testid="apply-error-fullName" className="mt-1 text-sm text-error">
              {fieldErrors.fullName}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            data-testid="apply-email"
            value={formData.email}
            onChange={(e) => updateField('email', e.target.value)}
            onBlur={handleEmailBlur}
            aria-invalid={!!fieldErrors.email}
            autoComplete="email"
          />
          {fieldErrors.email && (
            <p data-testid="apply-error-email" className="mt-1 text-sm text-error">
              {fieldErrors.email}
            </p>
          )}
        </div>
      </fieldset>

      {/* Online Presence */}
      <fieldset className="mb-8 space-y-4">
        <legend className="mb-2 text-lg font-semibold">Online Presence</legend>

        <div>
          <Label htmlFor="instagramUrl">Instagram URL</Label>
          <Input
            id="instagramUrl"
            type="url"
            data-testid="apply-instagram"
            placeholder="https://instagram.com/yourhandle"
            value={formData.instagramUrl}
            onChange={(e) => updateField('instagramUrl', e.target.value)}
            aria-invalid={!!fieldErrors.instagramUrl}
          />
          {fieldErrors.instagramUrl && (
            <p data-testid="apply-error-instagramUrl" className="mt-1 text-sm text-error">
              {fieldErrors.instagramUrl}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="websiteUrl">Website URL</Label>
          <Input
            id="websiteUrl"
            type="url"
            data-testid="apply-website"
            placeholder="https://yoursite.com"
            value={formData.websiteUrl}
            onChange={(e) => updateField('websiteUrl', e.target.value)}
            aria-invalid={!!fieldErrors.websiteUrl}
          />
          {fieldErrors.websiteUrl && (
            <p data-testid="apply-error-websiteUrl" className="mt-1 text-sm text-error">
              {fieldErrors.websiteUrl}
            </p>
          )}
        </div>
      </fieldset>

      {/* About Your Work */}
      <fieldset className="mb-8 space-y-4">
        <legend className="mb-2 text-lg font-semibold">About Your Work</legend>

        <div>
          <Label htmlFor="statement">Artist Statement *</Label>
          <p className="mb-1 text-sm text-muted-foreground">
            Tell us about your practice, inspiration, and what makes your work unique (min 50 characters).
          </p>
          <Textarea
            id="statement"
            data-testid="apply-statement"
            rows={6}
            value={formData.statement}
            onChange={(e) => updateField('statement', e.target.value)}
            aria-invalid={!!fieldErrors.statement}
          />
          {fieldErrors.statement && (
            <p data-testid="apply-error-statement" className="mt-1 text-sm text-error">
              {fieldErrors.statement}
            </p>
          )}
        </div>

        <div>
          <Label>Categories *</Label>
          <p className="mb-2 text-sm text-muted-foreground">
            Select the categories that best describe your work.
          </p>
          <div
            data-testid="apply-categories"
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="Art categories"
          >
            {CATEGORIES.map((cat) => {
              const isSelected = formData.categories.includes(cat.slug)
              return (
                <button
                  key={cat.slug}
                  type="button"
                  data-testid={`apply-category-${cat.slug}`}
                  aria-pressed={isSelected}
                  onClick={() => toggleCategory(cat.slug)}
                  className={cn(
                    'rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
                    isSelected
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-surface text-muted-foreground hover:border-primary/50'
                  )}
                >
                  {cat.label}
                </button>
              )
            })}
          </div>
          {fieldErrors.categories && (
            <p data-testid="apply-error-categories" className="mt-1 text-sm text-error">
              {fieldErrors.categories}
            </p>
          )}
        </div>
      </fieldset>

      {/* Experience */}
      <fieldset className="mb-8 space-y-4">
        <legend className="mb-2 text-lg font-semibold">Experience</legend>

        <div>
          <Label htmlFor="exhibitionHistory">Exhibition History</Label>
          <p className="mb-1 text-sm text-muted-foreground">
            List any exhibitions, shows, markets, or other relevant experience (optional).
          </p>
          <Textarea
            id="exhibitionHistory"
            data-testid="apply-exhibition-history"
            rows={4}
            value={formData.exhibitionHistory}
            onChange={(e) => updateField('exhibitionHistory', e.target.value)}
            aria-invalid={!!fieldErrors.exhibitionHistory}
          />
          {fieldErrors.exhibitionHistory && (
            <p data-testid="apply-error-exhibitionHistory" className="mt-1 text-sm text-error">
              {fieldErrors.exhibitionHistory}
            </p>
          )}
        </div>
      </fieldset>

      <Button
        type="submit"
        data-testid="apply-submit"
        disabled={formState === 'submitting'}
        className="w-full"
        size="lg"
      >
        {formState === 'submitting' ? 'Submitting...' : 'Submit Application'}
      </Button>
    </form>
  )
}
