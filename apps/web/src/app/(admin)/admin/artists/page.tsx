'use client'

import { AdminArtistList } from './artist-list'

export default function AdminArtistsPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground mb-6">Artists</h1>
      <AdminArtistList />
    </div>
  )
}
