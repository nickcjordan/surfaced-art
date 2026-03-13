'use client'

import { RoleGuard } from '../../components/role-guard'
import { ListingForm } from '../components/listing-form'

export default function NewListingPage() {
  return (
    <RoleGuard requiredRole="artist">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">New Listing</h1>
          <p className="text-muted-foreground mt-1">
            Create a new artwork listing
          </p>
        </div>
        <ListingForm mode="create" />
      </div>
    </RoleGuard>
  )
}
