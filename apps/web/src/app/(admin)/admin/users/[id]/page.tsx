'use client'

import { use } from 'react'
import { AdminUserDetail } from './user-detail'

export default function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)

  return <AdminUserDetail userId={id} />
}
