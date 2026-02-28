'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth'
import { getDashboard, updateProfile } from '@/lib/api'
import type { DashboardResponse } from '@surfaced-art/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ImageUpload } from './image-upload'

interface FormData {
  bio: string
  location: string
  websiteUrl: string
  instagramUrl: string
  profileImageUrl: string | null
  coverImageUrl: string | null
}

type FormState = 'idle' | 'submitting' | 'success' | 'error'

export function ProfileForm() {
  const { getIdToken } = useAuth()
  const [loading, setLoading] = useState(true)
  const [formState, setFormState] = useState<FormState>('idle')
  const [serverError, setServerError] = useState<string | null>(null)
  const [formData, setFormData] = useState<FormData>({
    bio: '',
    location: '',
    websiteUrl: '',
    instagramUrl: '',
    profileImageUrl: null,
    coverImageUrl: null,
  })
  const [initialData, setInitialData] = useState<FormData | null>(null)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const fetchProfile = useCallback(async () => {
    try {
      const token = await getIdToken()
      if (!token) {
        setFetchError('Not authenticated')
        setLoading(false)
        return
      }

      const dashboard: DashboardResponse = await getDashboard(token)
      const profile = dashboard.profile

      const data: FormData = {
        bio: profile.bio,
        location: profile.location,
        websiteUrl: (profile as unknown as Record<string, string | null>).websiteUrl ?? '',
        instagramUrl: (profile as unknown as Record<string, string | null>).instagramUrl ?? '',
        profileImageUrl: profile.profileImageUrl,
        coverImageUrl: profile.coverImageUrl,
      }

      setFormData(data)
      setInitialData(data)
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }, [getIdToken])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  function updateField<K extends keyof FormData>(field: K, value: FormData[K]) {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear success/error on edit
    if (formState === 'success' || formState === 'error') {
      setFormState('idle')
      setServerError(null)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!initialData) return

    // Build diff — only include changed fields
    const changes: Record<string, unknown> = {}

    if (formData.bio !== initialData.bio) changes.bio = formData.bio
    if (formData.location !== initialData.location) changes.location = formData.location
    if (formData.websiteUrl !== initialData.websiteUrl) changes.websiteUrl = formData.websiteUrl
    if (formData.instagramUrl !== initialData.instagramUrl) changes.instagramUrl = formData.instagramUrl
    if (formData.profileImageUrl !== initialData.profileImageUrl) changes.profileImageUrl = formData.profileImageUrl
    if (formData.coverImageUrl !== initialData.coverImageUrl) changes.coverImageUrl = formData.coverImageUrl

    if (Object.keys(changes).length === 0) {
      setFormState('success')
      return
    }

    setFormState('submitting')
    setServerError(null)

    try {
      const token = await getIdToken()
      if (!token) {
        setServerError('Not authenticated')
        setFormState('error')
        return
      }

      const updated = await updateProfile(token, changes)

      // Update form data and initial data from response
      const newData: FormData = {
        bio: updated.bio,
        location: updated.location,
        websiteUrl: updated.websiteUrl ?? '',
        instagramUrl: updated.instagramUrl ?? '',
        profileImageUrl: updated.profileImageUrl,
        coverImageUrl: updated.coverImageUrl,
      }

      setFormData(newData)
      setInitialData(newData)
      setFormState('success')
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Failed to save profile')
      setFormState('error')
    }
  }

  if (loading) {
    return (
      <div data-testid="profile-form-skeleton" className="space-y-6">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  if (fetchError) {
    return (
      <div data-testid="profile-error" role="alert" className="text-center py-8">
        <p className="text-destructive mb-4">{fetchError}</p>
        <Button
          variant="outline"
          onClick={() => {
            setFetchError(null)
            setLoading(true)
            fetchProfile()
          }}
        >
          Try again
        </Button>
      </div>
    )
  }

  return (
    <form data-testid="profile-form" onSubmit={handleSubmit} className="space-y-6">
      {/* Images */}
      <Card>
        <CardHeader>
          <CardTitle>Images</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <ImageUpload
            label="Cover Image"
            currentUrl={formData.coverImageUrl}
            context="cover"
            onUploadComplete={(url) => updateField('coverImageUrl', url)}
            onRemove={() => updateField('coverImageUrl', null)}
            testId="cover-image-upload"
            aspectHint="Recommended: wide landscape (3:1 ratio)"
          />
          <ImageUpload
            label="Profile Photo"
            currentUrl={formData.profileImageUrl}
            context="profile"
            onUploadComplete={(url) => updateField('profileImageUrl', url)}
            onRemove={() => updateField('profileImageUrl', null)}
            testId="profile-image-upload"
            aspectHint="Recommended: square (1:1 ratio)"
          />
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardHeader>
          <CardTitle>About</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              data-testid="profile-bio"
              value={formData.bio}
              onChange={(e) => updateField('bio', e.target.value)}
              rows={6}
              maxLength={5000}
              placeholder="Tell visitors about yourself and your work..."
            />
            <p className="text-xs text-muted-foreground text-right">
              {formData.bio.length}/5000
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              data-testid="profile-location"
              value={formData.location}
              onChange={(e) => updateField('location', e.target.value)}
              maxLength={200}
              placeholder="City, State"
            />
          </div>
        </CardContent>
      </Card>

      {/* Links */}
      <Card>
        <CardHeader>
          <CardTitle>Links</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="websiteUrl">Website</Label>
            <Input
              id="websiteUrl"
              data-testid="profile-website"
              type="url"
              value={formData.websiteUrl}
              onChange={(e) => updateField('websiteUrl', e.target.value)}
              placeholder="https://yourwebsite.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="instagramUrl">Instagram</Label>
            <Input
              id="instagramUrl"
              data-testid="profile-instagram"
              type="url"
              value={formData.instagramUrl}
              onChange={(e) => updateField('instagramUrl', e.target.value)}
              placeholder="https://instagram.com/yourusername"
            />
          </div>
        </CardContent>
      </Card>

      {/* Feedback */}
      {formState === 'success' && (
        <div data-testid="profile-success" role="alert" className="rounded-md bg-success/10 border border-success/30 p-4 text-sm text-success">
          Profile saved successfully.
        </div>
      )}

      {formState === 'error' && serverError && (
        <div data-testid="profile-error" role="alert" className="rounded-md bg-destructive/10 border border-destructive/30 p-4 text-sm text-destructive">
          {serverError}
        </div>
      )}

      {/* Save */}
      <Button
        type="submit"
        data-testid="profile-save"
        disabled={formState === 'submitting'}
      >
        {formState === 'submitting' ? 'Saving...' : 'Save Profile'}
      </Button>
    </form>
  )
}
