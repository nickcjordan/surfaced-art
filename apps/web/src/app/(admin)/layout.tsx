import type { Metadata } from 'next'
import { AdminHeader } from '@/components/admin/admin-header'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { AdminGuard } from '@/components/admin/admin-guard'

export const metadata: Metadata = {
  title: 'Admin — Surfaced Art',
  robots: { index: false, follow: false },
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div data-testid="admin-layout" className="min-h-screen flex flex-col">
      <AdminHeader />
      <AdminGuard>
        <div className="flex flex-col md:flex-row flex-1">
          <div className="border-b md:border-b-0 md:border-r border-border px-4 py-3 md:px-6 md:py-6">
            <AdminSidebar />
          </div>
          <main className="flex-1 p-4 md:p-6 min-w-0">
            {children}
          </main>
        </div>
      </AdminGuard>
    </div>
  )
}
