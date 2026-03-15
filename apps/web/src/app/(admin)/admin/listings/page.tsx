'use client'

import { AdminListingList } from './listing-list'

export default function AdminListingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground mb-6">Listings</h1>
      <AdminListingList />
    </div>
  )
}
