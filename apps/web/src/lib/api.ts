import { cache } from 'react'
import type {
  ArtistProfileResponse,
  ArtistApplicationBody,
  ApplicationStatusType,
  ApplicationSubmitResponse,
  CategoryType,
  CategoryWithCount,
  FeaturedArtistItem,
  ListingDetailResponse,
  ListingListItem,
  PaginatedResponse,
} from '@surfaced-art/types'

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.API_URL ||
  'https://api.surfaced.art'

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${path}`
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10_000)

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers,
      },
    })

    if (!response.ok) {
      throw new ApiError(response.status, `API request failed: ${response.statusText}`)
    }

    return response.json() as Promise<T>
  } finally {
    clearTimeout(timeout)
  }
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// Wrapped with React.cache() to deduplicate calls within a single request.
// Both generateMetadata and the page component call getArtistProfile with the
// same slug — cache() ensures only one API call is made per render.
export const getArtistProfile = cache(async (slug: string): Promise<ArtistProfileResponse> => {
  return apiFetch<ArtistProfileResponse>(`/artists/${encodeURIComponent(slug)}`)
})

export async function getFeaturedArtists(params?: {
  limit?: number
  category?: CategoryType
}): Promise<FeaturedArtistItem[]> {
  const searchParams = new URLSearchParams()
  if (params?.limit) searchParams.set('limit', params.limit.toString())
  if (params?.category) searchParams.set('category', params.category)
  const query = searchParams.toString()
  return apiFetch<FeaturedArtistItem[]>(`/artists${query ? `?${query}` : ''}`)
}

export async function getCategories(): Promise<CategoryWithCount[]> {
  return apiFetch<CategoryWithCount[]>('/categories')
}

export async function getListings(params?: {
  category?: string
  status?: string
  page?: number
  limit?: number
}): Promise<PaginatedResponse<ListingListItem>> {
  const searchParams = new URLSearchParams()
  if (params?.category) searchParams.set('category', params.category)
  if (params?.status) searchParams.set('status', params.status)
  if (params?.page) searchParams.set('page', params.page.toString())
  if (params?.limit) searchParams.set('limit', params.limit.toString())

  const query = searchParams.toString()
  return apiFetch<PaginatedResponse<ListingListItem>>(`/listings${query ? `?${query}` : ''}`)
}

// Wrapped with React.cache() to deduplicate calls within a single request.
// Both generateMetadata and the page component call getListingDetail with the
// same id — cache() ensures only one API call is made per render.
export const getListingDetail = cache(async (id: string): Promise<ListingDetailResponse> => {
  return apiFetch<ListingDetailResponse>(`/listings/${encodeURIComponent(id)}`)
})

export async function joinWaitlist(email: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>('/waitlist', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export async function submitApplication(
  data: ArtistApplicationBody
): Promise<ApplicationSubmitResponse> {
  return apiFetch<ApplicationSubmitResponse>('/artists/apply', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function checkApplicationEmail(
  email: string
): Promise<{ exists: boolean; status?: ApplicationStatusType }> {
  return apiFetch<{ exists: boolean; status?: ApplicationStatusType }>(
    `/artists/apply/check-email?email=${encodeURIComponent(email)}`
  )
}
