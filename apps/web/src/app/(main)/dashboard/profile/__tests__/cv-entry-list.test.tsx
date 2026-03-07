import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { CvEntryResponse } from '@surfaced-art/types'

// Mock auth
const mockGetIdToken = vi.fn()
vi.mock('@/lib/auth', () => ({
  useAuth: () => ({
    getIdToken: mockGetIdToken,
  }),
}))

// Mock API
const mockGetCvEntries = vi.fn()
const mockCreateCvEntry = vi.fn()
const mockUpdateCvEntry = vi.fn()
const mockDeleteCvEntry = vi.fn()
const mockReorderCvEntries = vi.fn()
vi.mock('@/lib/api', () => ({
  getCvEntries: (...args: unknown[]) => mockGetCvEntries(...args),
  createCvEntry: (...args: unknown[]) => mockCreateCvEntry(...args),
  updateCvEntry: (...args: unknown[]) => mockUpdateCvEntry(...args),
  deleteCvEntry: (...args: unknown[]) => mockDeleteCvEntry(...args),
  reorderCvEntries: (...args: unknown[]) => mockReorderCvEntries(...args),
}))

import { CvEntryList } from '../components/cv-entry-list'

const mockEntries: CvEntryResponse[] = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    type: 'exhibition',
    title: 'Solo Show',
    institution: 'Portland Art Museum',
    year: 2025,
    description: 'My first solo show.',
    sortOrder: 0,
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    type: 'award',
    title: 'Best in Show',
    institution: null,
    year: 2024,
    description: null,
    sortOrder: 1,
  },
]

describe('CvEntryList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetIdToken.mockResolvedValue('test-token')
    mockGetCvEntries.mockResolvedValue({ cvEntries: mockEntries })
    mockCreateCvEntry.mockResolvedValue(mockEntries[0])
    mockUpdateCvEntry.mockResolvedValue(mockEntries[0])
    mockDeleteCvEntry.mockResolvedValue(undefined)
    mockReorderCvEntries.mockResolvedValue({ cvEntries: mockEntries })
  })

  it('should fetch and render CV entries on mount', async () => {
    render(<CvEntryList />)

    await waitFor(() => {
      expect(screen.getByText('Solo Show')).toBeInTheDocument()
    })

    expect(screen.getByText('Best in Show')).toBeInTheDocument()
    expect(mockGetCvEntries).toHaveBeenCalledWith('test-token')
  })

  it('should show empty state when no entries exist', async () => {
    mockGetCvEntries.mockResolvedValue({ cvEntries: [] })

    render(<CvEntryList />)

    await waitFor(() => {
      expect(screen.getByTestId('cv-empty-state')).toBeInTheDocument()
    })
  })

  it('should display entry type, title, year, and institution', async () => {
    render(<CvEntryList />)

    await waitFor(() => {
      expect(screen.getByText('Solo Show')).toBeInTheDocument()
    })

    expect(screen.getByText('2025')).toBeInTheDocument()
    expect(screen.getByText('Portland Art Museum')).toBeInTheDocument()
  })

  it('should open add form when Add CV Entry button is clicked', async () => {
    const user = userEvent.setup()

    render(<CvEntryList />)

    await waitFor(() => {
      expect(screen.getByTestId('cv-add-button')).toBeInTheDocument()
    })

    await user.click(screen.getByTestId('cv-add-button'))

    expect(screen.getByTestId('cv-entry-form')).toBeInTheDocument()
  })

  it('should create a new entry via the form', async () => {
    const user = userEvent.setup()
    const newEntry: CvEntryResponse = {
      id: '33333333-3333-4333-8333-333333333333',
      type: 'education',
      title: 'MFA Fine Arts',
      institution: 'RISD',
      year: 2020,
      description: null,
      sortOrder: 2,
    }
    mockCreateCvEntry.mockResolvedValue(newEntry)

    render(<CvEntryList />)

    await waitFor(() => {
      expect(screen.getByTestId('cv-add-button')).toBeInTheDocument()
    })

    await user.click(screen.getByTestId('cv-add-button'))

    // Fill in the form
    await user.selectOptions(screen.getByTestId('cv-type-select'), 'education')
    await user.clear(screen.getByTestId('cv-title-input'))
    await user.type(screen.getByTestId('cv-title-input'), 'MFA Fine Arts')
    await user.clear(screen.getByTestId('cv-year-input'))
    await user.type(screen.getByTestId('cv-year-input'), '2020')
    await user.clear(screen.getByTestId('cv-institution-input'))
    await user.type(screen.getByTestId('cv-institution-input'), 'RISD')

    await user.click(screen.getByTestId('cv-form-submit'))

    await waitFor(() => {
      expect(mockCreateCvEntry).toHaveBeenCalledWith('test-token', expect.objectContaining({
        type: 'education',
        title: 'MFA Fine Arts',
        year: 2020,
        institution: 'RISD',
      }))
    })
  })

  it('should delete an entry after confirmation', async () => {
    const user = userEvent.setup()

    render(<CvEntryList />)

    await waitFor(() => {
      expect(screen.getByText('Solo Show')).toBeInTheDocument()
    })

    const entryRow = screen.getByTestId('cv-entry-11111111-1111-4111-8111-111111111111')
    const deleteButton = within(entryRow).getByTestId('cv-delete-button')
    await user.click(deleteButton)

    // Confirm deletion
    await user.click(screen.getByTestId('cv-delete-confirm'))

    await waitFor(() => {
      expect(mockDeleteCvEntry).toHaveBeenCalledWith('test-token', '11111111-1111-4111-8111-111111111111')
    })
  })

  it('should move entry down when down button is clicked', async () => {
    const user = userEvent.setup()

    render(<CvEntryList />)

    await waitFor(() => {
      expect(screen.getByText('Solo Show')).toBeInTheDocument()
    })

    const firstEntry = screen.getByTestId('cv-entry-11111111-1111-4111-8111-111111111111')
    const moveDownButton = within(firstEntry).getByTestId('cv-move-down')
    await user.click(moveDownButton)

    await waitFor(() => {
      expect(mockReorderCvEntries).toHaveBeenCalledWith('test-token', [
        '22222222-2222-4222-8222-222222222222',
        '11111111-1111-4111-8111-111111111111',
      ])
    })
  })

  it('should open edit form when edit button is clicked', async () => {
    const user = userEvent.setup()

    render(<CvEntryList />)

    await waitFor(() => {
      expect(screen.getByText('Solo Show')).toBeInTheDocument()
    })

    const entryRow = screen.getByTestId('cv-entry-11111111-1111-4111-8111-111111111111')
    const editButton = within(entryRow).getByTestId('cv-edit-button')
    await user.click(editButton)

    const form = screen.getByTestId('cv-entry-form')
    expect(form).toBeInTheDocument()

    // Form should be pre-filled with entry data
    expect(screen.getByTestId('cv-title-input')).toHaveValue('Solo Show')
    expect(screen.getByTestId('cv-year-input')).toHaveValue(2025)
  })

  it('should update an entry via the edit form', async () => {
    const user = userEvent.setup()
    const updated = { ...mockEntries[0], title: 'Updated Show' }
    mockUpdateCvEntry.mockResolvedValue(updated)

    render(<CvEntryList />)

    await waitFor(() => {
      expect(screen.getByText('Solo Show')).toBeInTheDocument()
    })

    const entryRow = screen.getByTestId('cv-entry-11111111-1111-4111-8111-111111111111')
    await user.click(within(entryRow).getByTestId('cv-edit-button'))

    const titleInput = screen.getByTestId('cv-title-input')
    await user.clear(titleInput)
    await user.type(titleInput, 'Updated Show')

    await user.click(screen.getByTestId('cv-form-submit'))

    await waitFor(() => {
      expect(mockUpdateCvEntry).toHaveBeenCalledWith(
        'test-token',
        '11111111-1111-4111-8111-111111111111',
        expect.objectContaining({ title: 'Updated Show' }),
      )
    })
  })

  it('should show loading skeleton on mount', () => {
    render(<CvEntryList />)

    expect(screen.getByTestId('cv-list-skeleton')).toBeInTheDocument()
  })

  it('should show error state when fetch fails', async () => {
    mockGetCvEntries.mockRejectedValue(new Error('Network error'))

    render(<CvEntryList />)

    await waitFor(() => {
      expect(screen.getByTestId('cv-fetch-error')).toBeInTheDocument()
    })
  })

  it('should disable move-up for first entry and move-down for last entry', async () => {
    render(<CvEntryList />)

    await waitFor(() => {
      expect(screen.getByText('Solo Show')).toBeInTheDocument()
    })

    const firstEntry = screen.getByTestId('cv-entry-11111111-1111-4111-8111-111111111111')
    const lastEntry = screen.getByTestId('cv-entry-22222222-2222-4222-8222-222222222222')

    expect(within(firstEntry).getByTestId('cv-move-up')).toBeDisabled()
    expect(within(lastEntry).getByTestId('cv-move-down')).toBeDisabled()
  })
})
