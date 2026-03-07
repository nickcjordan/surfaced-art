import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ProcessMediaResponse } from '@surfaced-art/types'

// Mock auth
const mockGetIdToken = vi.fn()
vi.mock('@/lib/auth', () => ({
  useAuth: () => ({
    getIdToken: mockGetIdToken,
  }),
}))

// Mock API
const mockGetProcessMedia = vi.fn()
const mockCreateProcessMediaPhoto = vi.fn()
const mockCreateProcessMediaVideo = vi.fn()
const mockDeleteProcessMedia = vi.fn()
const mockReorderProcessMedia = vi.fn()
vi.mock('@/lib/api', () => ({
  getProcessMedia: (...args: unknown[]) => mockGetProcessMedia(...args),
  createProcessMediaPhoto: (...args: unknown[]) => mockCreateProcessMediaPhoto(...args),
  createProcessMediaVideo: (...args: unknown[]) => mockCreateProcessMediaVideo(...args),
  deleteProcessMedia: (...args: unknown[]) => mockDeleteProcessMedia(...args),
  reorderProcessMedia: (...args: unknown[]) => mockReorderProcessMedia(...args),
}))

import { ProcessMediaGrid } from '../components/process-media-grid'

const mockMedia: ProcessMediaResponse[] = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    type: 'photo',
    url: 'https://cdn.cloudfront.net/photo1.jpg',
    videoPlaybackId: null,
    videoProvider: null,
    sortOrder: 0,
    createdAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    type: 'video',
    url: null,
    videoPlaybackId: 'abc123playback',
    videoProvider: 'mux',
    sortOrder: 1,
    createdAt: '2025-01-02T00:00:00.000Z',
  },
]

describe('ProcessMediaGrid', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetIdToken.mockResolvedValue('test-token')
    mockGetProcessMedia.mockResolvedValue({ processMedia: mockMedia })
    mockCreateProcessMediaPhoto.mockResolvedValue(mockMedia[0])
    mockCreateProcessMediaVideo.mockResolvedValue(mockMedia[1])
    mockDeleteProcessMedia.mockResolvedValue(undefined)
    mockReorderProcessMedia.mockResolvedValue({ processMedia: mockMedia })
  })

  it('should fetch and render process media on mount', async () => {
    render(<ProcessMediaGrid />)

    await waitFor(() => {
      expect(screen.getByTestId('media-item-11111111-1111-4111-8111-111111111111')).toBeInTheDocument()
    })

    expect(screen.getByTestId('media-item-22222222-2222-4222-8222-222222222222')).toBeInTheDocument()
    expect(mockGetProcessMedia).toHaveBeenCalledWith('test-token')
  })

  it('should show empty state when no media exists', async () => {
    mockGetProcessMedia.mockResolvedValue({ processMedia: [] })

    render(<ProcessMediaGrid />)

    await waitFor(() => {
      expect(screen.getByTestId('media-empty-state')).toBeInTheDocument()
    })
  })

  it('should show loading skeleton on mount', () => {
    render(<ProcessMediaGrid />)
    expect(screen.getByTestId('media-list-skeleton')).toBeInTheDocument()
  })

  it('should show error state when fetch fails', async () => {
    mockGetProcessMedia.mockRejectedValue(new Error('Network error'))

    render(<ProcessMediaGrid />)

    await waitFor(() => {
      expect(screen.getByTestId('media-fetch-error')).toBeInTheDocument()
    })
  })

  it('should add a photo via URL input', async () => {
    const user = userEvent.setup()
    const newPhoto: ProcessMediaResponse = {
      id: '33333333-3333-4333-8333-333333333333',
      type: 'photo',
      url: 'https://cdn.cloudfront.net/new-photo.jpg',
      videoPlaybackId: null,
      videoProvider: null,
      sortOrder: 2,
      createdAt: '2025-01-03T00:00:00.000Z',
    }
    mockCreateProcessMediaPhoto.mockResolvedValue(newPhoto)

    render(<ProcessMediaGrid />)

    await waitFor(() => {
      expect(screen.getByTestId('media-add-photo-button')).toBeInTheDocument()
    })

    await user.click(screen.getByTestId('media-add-photo-button'))

    const urlInput = screen.getByTestId('media-photo-url-input')
    await user.type(urlInput, 'https://cdn.cloudfront.net/new-photo.jpg')
    await user.click(screen.getByTestId('media-photo-submit'))

    await waitFor(() => {
      expect(mockCreateProcessMediaPhoto).toHaveBeenCalledWith(
        'test-token',
        'https://cdn.cloudfront.net/new-photo.jpg',
      )
    })
  })

  it('should add a video via playback ID input', async () => {
    const user = userEvent.setup()
    const newVideo: ProcessMediaResponse = {
      id: '44444444-4444-4444-8444-444444444444',
      type: 'video',
      url: null,
      videoPlaybackId: 'new-playback-id',
      videoProvider: 'mux',
      sortOrder: 2,
      createdAt: '2025-01-03T00:00:00.000Z',
    }
    mockCreateProcessMediaVideo.mockResolvedValue(newVideo)

    render(<ProcessMediaGrid />)

    await waitFor(() => {
      expect(screen.getByTestId('media-add-video-button')).toBeInTheDocument()
    })

    await user.click(screen.getByTestId('media-add-video-button'))

    const playbackInput = screen.getByTestId('media-video-playback-input')
    await user.type(playbackInput, 'new-playback-id')
    await user.click(screen.getByTestId('media-video-submit'))

    await waitFor(() => {
      expect(mockCreateProcessMediaVideo).toHaveBeenCalledWith(
        'test-token',
        'new-playback-id',
      )
    })
  })

  it('should delete media after confirmation', async () => {
    const user = userEvent.setup()

    render(<ProcessMediaGrid />)

    await waitFor(() => {
      expect(screen.getByTestId('media-item-11111111-1111-4111-8111-111111111111')).toBeInTheDocument()
    })

    const mediaItem = screen.getByTestId('media-item-11111111-1111-4111-8111-111111111111')
    const deleteButton = within(mediaItem).getByTestId('media-delete-button')
    await user.click(deleteButton)

    // Confirm deletion
    await user.click(screen.getByTestId('media-delete-confirm'))

    await waitFor(() => {
      expect(mockDeleteProcessMedia).toHaveBeenCalledWith('test-token', '11111111-1111-4111-8111-111111111111')
    })
  })

  it('should move media down when down button is clicked', async () => {
    const user = userEvent.setup()

    render(<ProcessMediaGrid />)

    await waitFor(() => {
      expect(screen.getByTestId('media-item-11111111-1111-4111-8111-111111111111')).toBeInTheDocument()
    })

    const firstItem = screen.getByTestId('media-item-11111111-1111-4111-8111-111111111111')
    const moveDownButton = within(firstItem).getByTestId('media-move-down')
    await user.click(moveDownButton)

    await waitFor(() => {
      expect(mockReorderProcessMedia).toHaveBeenCalledWith('test-token', [
        '22222222-2222-4222-8222-222222222222',
        '11111111-1111-4111-8111-111111111111',
      ])
    })
  })

  it('should disable move-up for first item and move-down for last item', async () => {
    render(<ProcessMediaGrid />)

    await waitFor(() => {
      expect(screen.getByTestId('media-item-11111111-1111-4111-8111-111111111111')).toBeInTheDocument()
    })

    const firstItem = screen.getByTestId('media-item-11111111-1111-4111-8111-111111111111')
    const lastItem = screen.getByTestId('media-item-22222222-2222-4222-8222-222222222222')

    expect(within(firstItem).getByTestId('media-move-up')).toBeDisabled()
    expect(within(lastItem).getByTestId('media-move-down')).toBeDisabled()
  })

  it('should display photo type with image thumbnail', async () => {
    render(<ProcessMediaGrid />)

    await waitFor(() => {
      expect(screen.getByTestId('media-item-11111111-1111-4111-8111-111111111111')).toBeInTheDocument()
    })

    const photoItem = screen.getByTestId('media-item-11111111-1111-4111-8111-111111111111')
    expect(within(photoItem).getByText('photo')).toBeInTheDocument()
  })

  it('should display video type with playback ID', async () => {
    render(<ProcessMediaGrid />)

    await waitFor(() => {
      expect(screen.getByTestId('media-item-22222222-2222-4222-8222-222222222222')).toBeInTheDocument()
    })

    const videoItem = screen.getByTestId('media-item-22222222-2222-4222-8222-222222222222')
    expect(within(videoItem).getByText('video')).toBeInTheDocument()
    expect(within(videoItem).getByText('abc123playback')).toBeInTheDocument()
  })
})
