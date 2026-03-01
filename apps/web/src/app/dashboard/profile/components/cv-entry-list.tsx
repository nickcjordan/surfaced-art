'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth'
import { getCvEntries, createCvEntry, updateCvEntry, deleteCvEntry, reorderCvEntries } from '@/lib/api'
import type { CvEntryResponse, CvEntryBody } from '@surfaced-art/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

const CV_ENTRY_TYPES = [
  { value: 'exhibition', label: 'Exhibition' },
  { value: 'award', label: 'Award' },
  { value: 'education', label: 'Education' },
  { value: 'press', label: 'Press' },
  { value: 'residency', label: 'Residency' },
  { value: 'other', label: 'Other' },
] as const

type FormMode = 'closed' | 'add' | 'edit'

interface EntryFormData {
  type: CvEntryBody['type']
  title: string
  institution: string
  year: number
  description: string
}

const emptyForm: EntryFormData = {
  type: 'exhibition',
  title: '',
  institution: '',
  year: new Date().getFullYear(),
  description: '',
}

export function CvEntryList() {
  const { getIdToken } = useAuth()
  const [entries, setEntries] = useState<CvEntryResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [formMode, setFormMode] = useState<FormMode>('closed')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<EntryFormData>(emptyForm)
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const fetchEntries = useCallback(async () => {
    try {
      const token = await getIdToken()
      if (!token) return

      const result = await getCvEntries(token)
      setEntries(result.cvEntries)
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'Failed to load CV entries')
    } finally {
      setLoading(false)
    }
  }, [getIdToken])

  useEffect(() => {
    fetchEntries()
  }, [fetchEntries])

  function openAddForm() {
    setFormMode('add')
    setEditingId(null)
    setFormData(emptyForm)
  }

  function openEditForm(entry: CvEntryResponse) {
    setFormMode('edit')
    setEditingId(entry.id)
    setFormData({
      type: entry.type,
      title: entry.title,
      institution: entry.institution ?? '',
      year: entry.year,
      description: entry.description ?? '',
    })
  }

  function closeForm() {
    setFormMode('closed')
    setEditingId(null)
    setFormData(emptyForm)
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormSubmitting(true)

    try {
      const token = await getIdToken()
      if (!token) return

      const body: CvEntryBody = {
        type: formData.type,
        title: formData.title,
        year: formData.year,
        institution: formData.institution || undefined,
        description: formData.description || undefined,
      }

      if (formMode === 'add') {
        const created = await createCvEntry(token, body)
        setEntries((prev) => [...prev, created])
      } else if (formMode === 'edit' && editingId) {
        const updated = await updateCvEntry(token, editingId, body)
        setEntries((prev) => prev.map((e) => (e.id === editingId ? updated : e)))
      }

      closeForm()
    } catch {
      // Error handling could be expanded
    } finally {
      setFormSubmitting(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      const token = await getIdToken()
      if (!token) return

      await deleteCvEntry(token, id)
      setEntries((prev) => prev.filter((e) => e.id !== id))
      setDeleteConfirmId(null)
    } catch {
      // Error handling could be expanded
    }
  }

  async function handleMove(id: string, direction: 'up' | 'down') {
    const index = entries.findIndex((e) => e.id === id)
    if (index === -1) return
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === entries.length - 1) return

    const newEntries = [...entries]
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    ;[newEntries[index], newEntries[swapIndex]] = [newEntries[swapIndex], newEntries[index]]

    const orderedIds = newEntries.map((e) => e.id)
    setEntries(newEntries)

    try {
      const token = await getIdToken()
      if (!token) return

      const result = await reorderCvEntries(token, orderedIds)
      setEntries(result.cvEntries)
    } catch {
      // Revert on error
      setEntries(entries)
    }
  }

  if (loading) {
    return (
      <div data-testid="cv-list-skeleton" className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  if (fetchError) {
    return (
      <div data-testid="cv-fetch-error" role="alert" className="text-center py-8">
        <p className="text-destructive mb-4">{fetchError}</p>
        <Button
          variant="outline"
          onClick={() => {
            setFetchError(null)
            setLoading(true)
            fetchEntries()
          }}
        >
          Try again
        </Button>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>CV</CardTitle>
        <Button
          data-testid="cv-add-button"
          size="sm"
          onClick={openAddForm}
          disabled={formMode !== 'closed'}
        >
          Add CV Entry
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {formMode !== 'closed' && (
          <form
            data-testid="cv-entry-form"
            onSubmit={handleFormSubmit}
            className="space-y-4 rounded-md border p-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cv-type">Type</Label>
                <select
                  id="cv-type"
                  data-testid="cv-type-select"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.type}
                  onChange={(e) => setFormData((prev) => ({ ...prev, type: e.target.value as EntryFormData['type'] }))}
                >
                  {CV_ENTRY_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cv-year">Year</Label>
                <Input
                  id="cv-year"
                  data-testid="cv-year-input"
                  type="number"
                  min={1900}
                  max={2100}
                  value={formData.year}
                  onChange={(e) => setFormData((prev) => ({ ...prev, year: parseInt(e.target.value, 10) || 0 }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cv-title">Title</Label>
              <Input
                id="cv-title"
                data-testid="cv-title-input"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                maxLength={200}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cv-institution">Institution</Label>
              <Input
                id="cv-institution"
                data-testid="cv-institution-input"
                value={formData.institution}
                onChange={(e) => setFormData((prev) => ({ ...prev, institution: e.target.value }))}
                maxLength={200}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cv-description">Description</Label>
              <Textarea
                id="cv-description"
                data-testid="cv-description-input"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                maxLength={2000}
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="submit"
                data-testid="cv-form-submit"
                disabled={formSubmitting}
                size="sm"
              >
                {formSubmitting ? 'Saving...' : formMode === 'add' ? 'Add Entry' : 'Update Entry'}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={closeForm}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}

        {entries.length === 0 && formMode === 'closed' && (
          <div data-testid="cv-empty-state" className="text-center py-8 text-muted-foreground">
            <p>No CV entries yet. Add exhibitions, awards, education, and more.</p>
          </div>
        )}

        {entries.map((entry, index) => (
          <div
            key={entry.id}
            data-testid={`cv-entry-${entry.id}`}
            className="flex items-start justify-between rounded-md border p-4"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium capitalize">
                  {entry.type}
                </span>
                <span className="text-sm text-muted-foreground">{entry.year}</span>
              </div>
              <p className="font-medium mt-1">{entry.title}</p>
              {entry.institution && (
                <p className="text-sm text-muted-foreground">{entry.institution}</p>
              )}
              {entry.description && (
                <p className="text-sm text-muted-foreground mt-1">{entry.description}</p>
              )}
            </div>
            <div className="flex items-center gap-1 ml-4 shrink-0">
              <Button
                data-testid="cv-move-up"
                variant="ghost"
                size="sm"
                disabled={index === 0}
                onClick={() => handleMove(entry.id, 'up')}
                aria-label="Move up"
              >
                ↑
              </Button>
              <Button
                data-testid="cv-move-down"
                variant="ghost"
                size="sm"
                disabled={index === entries.length - 1}
                onClick={() => handleMove(entry.id, 'down')}
                aria-label="Move down"
              >
                ↓
              </Button>
              <Button
                data-testid="cv-edit-button"
                variant="ghost"
                size="sm"
                onClick={() => openEditForm(entry)}
                aria-label="Edit"
              >
                Edit
              </Button>
              {deleteConfirmId === entry.id ? (
                <div className="flex gap-1">
                  <Button
                    data-testid="cv-delete-confirm"
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(entry.id)}
                  >
                    Confirm
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteConfirmId(null)}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  data-testid="cv-delete-button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteConfirmId(entry.id)}
                  aria-label="Delete"
                >
                  Delete
                </Button>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
