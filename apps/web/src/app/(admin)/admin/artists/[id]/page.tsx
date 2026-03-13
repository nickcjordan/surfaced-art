'use client'

import { use } from 'react'
import { AdminArtistDetail } from './artist-detail'

export default function AdminArtistDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)

  return <AdminArtistDetail artistId={id} />
}
