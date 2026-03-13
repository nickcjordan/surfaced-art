import { cache } from 'react'
import type {
  AdminActionResponse,
  AdminRoleGrantResponse,
  AdminUserDetailResponse,
  AdminUserListItem,
  AdminWaitlistEntry,
  ArtistProfileResponse,
  ArtistApplicationBody,
  ApplicationStatusType,
  ApplicationSubmitResponse,
  AuthMeResponse,
  CategoriesUpdateResponse,
  CategoryType,
  CvEntryBody,
  CvEntryListResponse,
  CvEntryResponse,
  CategoryWithCount,
  DashboardResponse,
  FeaturedArtistItem,
  ListingAvailabilityBody,
  ListingCreateBody,
  ListingDetailResponse,
  ListingImageBody,
  ListingListItem,
  ListingUpdateBody,
  MyListingImageResponse,
  MyListingListItem,
  MyListingResponse,
  PaginatedResponse,
  PresignedPostResponse,
  ProcessMediaListResponse,
  ProcessMediaResponse,
  ProfileUpdateResponse,
  SearchResponse,
  StripeOnboardingResponse,
  StripeStatusResponse,
  Tag,
  TagsUpdateResponse,
  UserRoleType,
} from '@surfaced-art/types'

import { API_URL as API_BASE_URL } from '@/lib/env'

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
      // Parse error body to get a meaningful message.
      // API Gateway returns { message: "Unauthorized" }
      // Lambda returns { error: { code: "...", message: "..." } }
      let message = response.statusText || `HTTP ${response.status}`
      try {
        const body = await response.json()
        if (body?.error?.message) {
          message = body.error.message
        } else if (body?.message) {
          message = body.message
        }
      } catch {
        // Body not parseable — use statusText fallback
      }
      throw new ApiError(response.status, message)
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

export async function searchArt(params: {
  q: string
  page?: number
  limit?: number
}): Promise<SearchResponse> {
  const searchParams = new URLSearchParams()
  searchParams.set('q', params.q)
  if (params.page) searchParams.set('page', params.page.toString())
  if (params.limit) searchParams.set('limit', params.limit.toString())
  return apiFetch<SearchResponse>(`/search?${searchParams.toString()}`)
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

export async function joinWaitlist(
  email: string,
  context?: { source?: string; artistId?: string; listingId?: string },
): Promise<{ message: string }> {
  return apiFetch<{ message: string }>('/waitlist', {
    method: 'POST',
    body: JSON.stringify({ email, ...context }),
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

export async function getAuthMe(token: string): Promise<AuthMeResponse> {
  return apiFetch<AuthMeResponse>('/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export async function getDashboard(token: string): Promise<DashboardResponse> {
  return apiFetch<DashboardResponse>('/me/dashboard', {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export async function updateProfile(
  token: string,
  data: Record<string, unknown>,
): Promise<ProfileUpdateResponse> {
  return apiFetch<ProfileUpdateResponse>('/me/profile', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  })
}

export async function getPresignedUrl(
  token: string,
  context: string,
  contentType: string,
): Promise<PresignedPostResponse> {
  return apiFetch<PresignedPostResponse>('/uploads/presigned-url', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ context, contentType }),
  })
}

export async function updateCategories(
  token: string,
  categories: CategoryType[],
): Promise<CategoriesUpdateResponse> {
  return apiFetch<CategoriesUpdateResponse>('/me/categories', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ categories }),
  })
}

export async function getCvEntries(
  token: string,
): Promise<CvEntryListResponse> {
  return apiFetch<CvEntryListResponse>('/me/cv-entries', {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export async function createCvEntry(
  token: string,
  data: CvEntryBody,
): Promise<CvEntryResponse> {
  return apiFetch<CvEntryResponse>('/me/cv-entries', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  })
}

export async function updateCvEntry(
  token: string,
  id: string,
  data: CvEntryBody,
): Promise<CvEntryResponse> {
  return apiFetch<CvEntryResponse>(`/me/cv-entries/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  })
}

export async function deleteCvEntry(
  token: string,
  id: string,
): Promise<void> {
  await apiFetch<void>(`/me/cv-entries/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
}

export async function reorderCvEntries(
  token: string,
  orderedIds: string[],
): Promise<CvEntryListResponse> {
  return apiFetch<CvEntryListResponse>('/me/cv-entries/reorder', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ orderedIds }),
  })
}

export async function getProcessMedia(
  token: string,
): Promise<ProcessMediaListResponse> {
  return apiFetch<ProcessMediaListResponse>('/me/process-media', {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export async function createProcessMediaPhoto(
  token: string,
  url: string,
): Promise<ProcessMediaResponse> {
  return apiFetch<ProcessMediaResponse>('/me/process-media/photo', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ url }),
  })
}

export async function createProcessMediaVideo(
  token: string,
  videoPlaybackId: string,
): Promise<ProcessMediaResponse> {
  return apiFetch<ProcessMediaResponse>('/me/process-media/video', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ videoPlaybackId, videoProvider: 'mux' }),
  })
}

export async function deleteProcessMedia(
  token: string,
  id: string,
): Promise<void> {
  await apiFetch<void>(`/me/process-media/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
}

export async function reorderProcessMedia(
  token: string,
  orderedIds: string[],
): Promise<ProcessMediaListResponse> {
  return apiFetch<ProcessMediaListResponse>('/me/process-media/reorder', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ orderedIds }),
  })
}

export async function checkApplicationEmail(
  email: string
): Promise<{ exists: boolean; status?: ApplicationStatusType }> {
  return apiFetch<{ exists: boolean; status?: ApplicationStatusType }>(
    `/artists/apply/check-email?email=${encodeURIComponent(email)}`
  )
}

// ─── Listing Management (Dashboard) ──────────────────────────────────

export async function getMyListings(
  token: string,
  params?: { status?: string; category?: string; page?: number; limit?: number },
): Promise<PaginatedResponse<MyListingListItem>> {
  const qs = new URLSearchParams()
  if (params?.status) qs.set('status', params.status)
  if (params?.category) qs.set('category', params.category)
  if (params?.page) qs.set('page', String(params.page))
  if (params?.limit) qs.set('limit', String(params.limit))
  const query = qs.toString()
  return apiFetch<PaginatedResponse<MyListingListItem>>(
    `/me/listings${query ? `?${query}` : ''}`,
    { headers: { Authorization: `Bearer ${token}` } },
  )
}

export async function getMyListing(
  token: string,
  id: string,
): Promise<MyListingResponse> {
  return apiFetch<MyListingResponse>(
    `/me/listings/${encodeURIComponent(id)}`,
    { headers: { Authorization: `Bearer ${token}` } },
  )
}

export async function deleteMyListing(
  token: string,
  id: string,
): Promise<void> {
  await apiFetch<void>(`/me/listings/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
}

export async function createMyListing(
  token: string,
  data: ListingCreateBody,
): Promise<MyListingResponse> {
  return apiFetch<MyListingResponse>('/me/listings', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  })
}

export async function updateMyListing(
  token: string,
  id: string,
  data: ListingUpdateBody,
): Promise<MyListingResponse> {
  return apiFetch<MyListingResponse>(`/me/listings/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  })
}

export async function addListingImage(
  token: string,
  listingId: string,
  data: ListingImageBody,
): Promise<MyListingImageResponse> {
  return apiFetch<MyListingImageResponse>(
    `/me/listings/${encodeURIComponent(listingId)}/images`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    },
  )
}

export async function deleteListingImage(
  token: string,
  listingId: string,
  imageId: string,
): Promise<void> {
  await apiFetch<void>(
    `/me/listings/${encodeURIComponent(listingId)}/images/${encodeURIComponent(imageId)}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    },
  )
}

export async function reorderListingImages(
  token: string,
  listingId: string,
  orderedIds: string[],
): Promise<{ images: MyListingImageResponse[] }> {
  return apiFetch<{ images: MyListingImageResponse[] }>(
    `/me/listings/${encodeURIComponent(listingId)}/images/reorder`,
    {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ orderedIds }),
    },
  )
}

export async function updateListingAvailability(
  token: string,
  id: string,
  data: ListingAvailabilityBody,
): Promise<MyListingResponse> {
  return apiFetch<MyListingResponse>(
    `/me/listings/${encodeURIComponent(id)}/availability`,
    {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    },
  )
}

// ─── Stripe Connect ───────────────────────────────────────────────────

export async function initiateStripeOnboarding(
  token: string,
): Promise<StripeOnboardingResponse> {
  return apiFetch<StripeOnboardingResponse>('/me/stripe/onboarding', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })
}

export async function getStripeStatus(
  token: string,
): Promise<StripeStatusResponse> {
  return apiFetch<StripeStatusResponse>('/me/stripe/status', {
    headers: { Authorization: `Bearer ${token}` },
  })
}

// ─── Tags ─────────────────────────────────────────────────────────────

export async function getTagVocabulary(category?: string): Promise<Tag[]> {
  const query = category ? `?category=${encodeURIComponent(category)}` : ''
  return apiFetch<Tag[]>(`/tags${query}`)
}

export async function getMyTags(token: string): Promise<TagsUpdateResponse> {
  return apiFetch<TagsUpdateResponse>('/me/tags', {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export async function updateMyTags(
  token: string,
  tagIds: string[],
): Promise<TagsUpdateResponse> {
  return apiFetch<TagsUpdateResponse>('/me/tags', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ tagIds }),
  })
}

export async function updateListingTags(
  token: string,
  listingId: string,
  tagIds: string[],
): Promise<TagsUpdateResponse> {
  return apiFetch<TagsUpdateResponse>(
    `/me/listings/${encodeURIComponent(listingId)}/tags`,
    {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ tagIds }),
    },
  )
}

// ─── Admin: User Management ─────────────────────────────────────────

export async function getAdminUsers(
  token: string,
  params?: { search?: string; role?: string; page?: number; limit?: number },
): Promise<PaginatedResponse<AdminUserListItem>> {
  const qs = new URLSearchParams()
  if (params?.search) qs.set('search', params.search)
  if (params?.role) qs.set('role', params.role)
  if (params?.page) qs.set('page', String(params.page))
  if (params?.limit) qs.set('limit', String(params.limit))
  const query = qs.toString()
  return apiFetch<PaginatedResponse<AdminUserListItem>>(
    `/admin/users${query ? `?${query}` : ''}`,
    { headers: { Authorization: `Bearer ${token}` } },
  )
}

export async function getAdminUser(
  token: string,
  id: string,
): Promise<AdminUserDetailResponse> {
  return apiFetch<AdminUserDetailResponse>(
    `/admin/users/${encodeURIComponent(id)}`,
    { headers: { Authorization: `Bearer ${token}` } },
  )
}

export async function grantRole(
  token: string,
  userId: string,
  role: UserRoleType,
): Promise<AdminRoleGrantResponse> {
  return apiFetch<AdminRoleGrantResponse>(
    `/admin/users/${encodeURIComponent(userId)}/roles`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ role }),
    },
  )
}

export async function revokeRole(
  token: string,
  userId: string,
  role: UserRoleType,
): Promise<AdminActionResponse> {
  return apiFetch<AdminActionResponse>(
    `/admin/users/${encodeURIComponent(userId)}/roles/${encodeURIComponent(role)}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    },
  )
}

// ─── Admin: Waitlist Management ─────────────────────────────────────

export async function getAdminWaitlist(
  token: string,
  params?: { search?: string; page?: number; limit?: number },
): Promise<PaginatedResponse<AdminWaitlistEntry>> {
  const qs = new URLSearchParams()
  if (params?.search) qs.set('search', params.search)
  if (params?.page) qs.set('page', String(params.page))
  if (params?.limit) qs.set('limit', String(params.limit))
  const query = qs.toString()
  return apiFetch<PaginatedResponse<AdminWaitlistEntry>>(
    `/admin/waitlist${query ? `?${query}` : ''}`,
    { headers: { Authorization: `Bearer ${token}` } },
  )
}

export async function deleteWaitlistEntry(
  token: string,
  id: string,
): Promise<AdminActionResponse> {
  return apiFetch<AdminActionResponse>(
    `/admin/waitlist/${encodeURIComponent(id)}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    },
  )
}
