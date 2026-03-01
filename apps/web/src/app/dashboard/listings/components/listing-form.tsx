'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { createMyListing, updateMyListing, getMyListing } from '@/lib/api'
import { dollarsToCents } from '@surfaced-art/utils'
import type { CategoryType, ListingTypeType } from '@surfaced-art/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { CATEGORIES } from '@/lib/categories'

interface FormData {
  title: string
  description: string
  medium: string
  category: CategoryType | ''
  type: ListingTypeType | ''
  price: string
  quantityTotal: string
  artworkLength: string
  artworkWidth: string
  artworkHeight: string
  packedLength: string
  packedWidth: string
  packedHeight: string
  packedWeight: string
  editionNumber: string
  editionTotal: string
}

const INITIAL_FORM: FormData = {
  title: '',
  description: '',
  medium: '',
  category: '',
  type: '',
  price: '',
  quantityTotal: '1',
  artworkLength: '',
  artworkWidth: '',
  artworkHeight: '',
  packedLength: '',
  packedWidth: '',
  packedHeight: '',
  packedWeight: '',
  editionNumber: '',
  editionTotal: '',
}

type FormState = 'idle' | 'submitting' | 'success' | 'error'

interface ListingFormProps {
  mode: 'create' | 'edit'
  listingId?: string
}

export function ListingForm({ mode, listingId }: ListingFormProps) {
  const { getIdToken } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(mode === 'edit')
  const [formState, setFormState] = useState<FormState>('idle')
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM)
  const [serverError, setServerError] = useState<string | null>(null)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const fetchListing = useCallback(async () => {
    if (mode !== 'edit' || !listingId) return

    try {
      setLoading(true)
      setFetchError(null)
      const token = await getIdToken()
      if (!token) {
        setFetchError('Not authenticated')
        setLoading(false)
        return
      }

      const listing = await getMyListing(token, listingId)

      setFormData({
        title: listing.title,
        description: listing.description,
        medium: listing.medium,
        category: listing.category,
        type: listing.type,
        price: String(listing.price / 100),
        quantityTotal: String(listing.quantityTotal),
        artworkLength: listing.artworkLength != null ? String(listing.artworkLength) : '',
        artworkWidth: listing.artworkWidth != null ? String(listing.artworkWidth) : '',
        artworkHeight: listing.artworkHeight != null ? String(listing.artworkHeight) : '',
        packedLength: String(listing.packedLength),
        packedWidth: String(listing.packedWidth),
        packedHeight: String(listing.packedHeight),
        packedWeight: String(listing.packedWeight),
        editionNumber: listing.editionNumber != null ? String(listing.editionNumber) : '',
        editionTotal: listing.editionTotal != null ? String(listing.editionTotal) : '',
      })
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'Failed to load listing')
    } finally {
      setLoading(false)
    }
  }, [getIdToken, listingId, mode])

  useEffect(() => {
    if (mode === 'edit') {
      fetchListing()
    }
  }, [fetchListing, mode])

  function updateField<K extends keyof FormData>(field: K, value: FormData[K]) {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (formState === 'success' || formState === 'error') {
      setFormState('idle')
      setServerError(null)
    }
  }

  function validate(): string | null {
    if (!formData.title.trim()) return 'Title is required'
    if (!formData.description.trim()) return 'Description is required'
    if (!formData.medium.trim()) return 'Medium is required'
    if (!formData.category) return 'Category is required'
    if (!formData.type) return 'Type is required'

    const price = parseFloat(formData.price)
    if (!formData.price || isNaN(price) || price <= 0) return 'Price must be greater than zero'

    if (!formData.packedLength || parseFloat(formData.packedLength) <= 0) return 'Packed length is required'
    if (!formData.packedWidth || parseFloat(formData.packedWidth) <= 0) return 'Packed width is required'
    if (!formData.packedHeight || parseFloat(formData.packedHeight) <= 0) return 'Packed height is required'
    if (!formData.packedWeight || parseFloat(formData.packedWeight) <= 0) return 'Packed weight is required'

    return null
  }

  function buildPayload() {
    const price = dollarsToCents(parseFloat(formData.price))
    const quantityTotal = parseInt(formData.quantityTotal, 10) || 1

    const payload: Record<string, unknown> = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      medium: formData.medium.trim(),
      category: formData.category,
      type: formData.type,
      price,
      quantityTotal,
      packedLength: parseFloat(formData.packedLength),
      packedWidth: parseFloat(formData.packedWidth),
      packedHeight: parseFloat(formData.packedHeight),
      packedWeight: parseFloat(formData.packedWeight),
    }

    // Optional artwork dimensions
    if (formData.artworkLength) payload.artworkLength = parseFloat(formData.artworkLength)
    else payload.artworkLength = null

    if (formData.artworkWidth) payload.artworkWidth = parseFloat(formData.artworkWidth)
    else payload.artworkWidth = null

    if (formData.artworkHeight) payload.artworkHeight = parseFloat(formData.artworkHeight)
    else payload.artworkHeight = null

    // Optional edition info
    if (formData.editionNumber) payload.editionNumber = parseInt(formData.editionNumber, 10)
    else payload.editionNumber = null

    if (formData.editionTotal) payload.editionTotal = parseInt(formData.editionTotal, 10)
    else payload.editionTotal = null

    return payload
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const validationError = validate()
    if (validationError) {
      setServerError(validationError)
      setFormState('error')
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

      const payload = buildPayload()

      if (mode === 'create') {
        await createMyListing(token, payload as Parameters<typeof createMyListing>[1])
      } else {
        await updateMyListing(token, listingId!, payload as Parameters<typeof updateMyListing>[2])
      }

      router.push('/dashboard/listings')
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Failed to save listing')
      setFormState('error')
    }
  }

  if (loading) {
    return (
      <div data-testid="listing-form-skeleton" className="space-y-6">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  if (fetchError) {
    return (
      <div data-testid="listing-form-fetch-error" role="alert" className="text-center py-8">
        <p className="text-destructive mb-4">{fetchError}</p>
        <Button
          variant="outline"
          onClick={() => {
            setFetchError(null)
            setLoading(true)
            fetchListing()
          }}
        >
          Try again
        </Button>
      </div>
    )
  }

  return (
    <form data-testid="listing-form" onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => updateField('title', e.target.value)}
              maxLength={200}
              placeholder="Artwork title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
              rows={4}
              maxLength={5000}
              placeholder="Describe your artwork..."
            />
            <p className="text-xs text-muted-foreground text-right">
              {formData.description.length}/5000
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="medium">Medium</Label>
            <Input
              id="medium"
              value={formData.medium}
              onChange={(e) => updateField('medium', e.target.value)}
              maxLength={200}
              placeholder="e.g. Stoneware clay, Oil on canvas"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => updateField('category', e.target.value as CategoryType)}
                className="flex h-9 w-full rounded-md border border-border bg-background px-3 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Select category</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat.slug} value={cat.slug}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) => updateField('type', e.target.value as ListingTypeType)}
                className="flex h-9 w-full rounded-md border border-border bg-background px-3 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Select type</option>
                <option value="standard">Standard</option>
                <option value="commission">Commission</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing & Quantity */}
      <Card>
        <CardHeader>
          <CardTitle>Pricing &amp; Quantity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price ($)</Label>
              <Input
                id="price"
                type="number"
                min="0.01"
                step="0.01"
                value={formData.price}
                onChange={(e) => updateField('price', e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                step="1"
                value={formData.quantityTotal}
                onChange={(e) => updateField('quantityTotal', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="editionNumber">Edition Number</Label>
              <Input
                id="editionNumber"
                type="number"
                min="1"
                step="1"
                value={formData.editionNumber}
                onChange={(e) => updateField('editionNumber', e.target.value)}
                placeholder="Optional"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editionTotal">Edition Total</Label>
              <Input
                id="editionTotal"
                type="number"
                min="1"
                step="1"
                value={formData.editionTotal}
                onChange={(e) => updateField('editionTotal', e.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Artwork Dimensions (Optional) */}
      <Card>
        <CardHeader>
          <CardTitle>Artwork Dimensions</CardTitle>
          <p className="text-sm text-muted-foreground">Optional — the piece itself, in inches</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="artworkLength">Artwork Length</Label>
              <Input
                id="artworkLength"
                type="number"
                min="0"
                step="0.1"
                value={formData.artworkLength}
                onChange={(e) => updateField('artworkLength', e.target.value)}
                placeholder="in"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="artworkWidth">Artwork Width</Label>
              <Input
                id="artworkWidth"
                type="number"
                min="0"
                step="0.1"
                value={formData.artworkWidth}
                onChange={(e) => updateField('artworkWidth', e.target.value)}
                placeholder="in"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="artworkHeight">Artwork Height</Label>
              <Input
                id="artworkHeight"
                type="number"
                min="0"
                step="0.1"
                value={formData.artworkHeight}
                onChange={(e) => updateField('artworkHeight', e.target.value)}
                placeholder="in"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Packed Dimensions (Required) */}
      <Card>
        <CardHeader>
          <CardTitle>Packed Dimensions</CardTitle>
          <p className="text-sm text-muted-foreground">Required — shipping box, in inches/lbs</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="packedLength">Packed Length</Label>
              <Input
                id="packedLength"
                type="number"
                min="0"
                step="0.1"
                value={formData.packedLength}
                onChange={(e) => updateField('packedLength', e.target.value)}
                placeholder="in"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="packedWidth">Packed Width</Label>
              <Input
                id="packedWidth"
                type="number"
                min="0"
                step="0.1"
                value={formData.packedWidth}
                onChange={(e) => updateField('packedWidth', e.target.value)}
                placeholder="in"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="packedHeight">Packed Height</Label>
              <Input
                id="packedHeight"
                type="number"
                min="0"
                step="0.1"
                value={formData.packedHeight}
                onChange={(e) => updateField('packedHeight', e.target.value)}
                placeholder="in"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="packedWeight">Packed Weight</Label>
              <Input
                id="packedWeight"
                type="number"
                min="0"
                step="0.1"
                value={formData.packedWeight}
                onChange={(e) => updateField('packedWeight', e.target.value)}
                placeholder="lbs"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feedback */}
      {formState === 'error' && serverError && (
        <div data-testid="listing-form-error" role="alert" className="rounded-md bg-destructive/10 border border-destructive/30 p-4 text-sm text-destructive">
          {serverError}
        </div>
      )}

      {/* Submit */}
      <Button
        type="submit"
        data-testid="listing-form-submit"
        disabled={formState === 'submitting'}
      >
        {formState === 'submitting'
          ? 'Saving...'
          : mode === 'create'
            ? 'Create Listing'
            : 'Save Changes'}
      </Button>
    </form>
  )
}
