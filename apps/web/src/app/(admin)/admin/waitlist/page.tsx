'use client'

import { AdminWaitlistList } from './waitlist-list'

export default function AdminWaitlistPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground mb-6">Waitlist</h1>
      <AdminWaitlistList />
    </div>
  )
}
