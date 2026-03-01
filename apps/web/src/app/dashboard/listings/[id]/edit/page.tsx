'use client'

import { useParams } from 'next/navigation'
import { ListingForm } from '../../components/listing-form'

export default function EditListingPage() {
  const params = useParams<{ id: string }>()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Edit Listing</h1>
        <p className="text-muted-foreground mt-1">
          Update your artwork listing
        </p>
      </div>
      <ListingForm mode="edit" listingId={params.id} />
    </div>
  )
}
