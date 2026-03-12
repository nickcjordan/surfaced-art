'use client'

import { AdminUserList } from './user-list'

export default function AdminUsersPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground mb-6">Users</h1>
      <AdminUserList />
    </div>
  )
}
