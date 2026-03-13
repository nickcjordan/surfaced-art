'use client'

import { use } from 'react'
import { AdminApplicationDetail } from './application-detail'

export default function AdminApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)

  return <AdminApplicationDetail applicationId={id} />
}
