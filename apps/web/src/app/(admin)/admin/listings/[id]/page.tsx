'use client'

import { use } from 'react'
import { AdminListingDetail } from './listing-detail'

export default function AdminListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)

  return <AdminListingDetail listingId={id} />
}
