'use client'

import { ListingsTable } from './components/listings-table'

export default function ListingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Listings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your artwork listings
        </p>
      </div>
      <ListingsTable />
    </div>
  )
}
