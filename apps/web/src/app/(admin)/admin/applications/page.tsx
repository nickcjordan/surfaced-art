'use client'

import { AdminApplicationList } from './application-list'

export default function AdminApplicationsPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground mb-6">Applications</h1>
      <AdminApplicationList />
    </div>
  )
}
