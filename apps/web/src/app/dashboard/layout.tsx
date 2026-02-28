import type { Metadata } from 'next'
import { DashboardSidebar } from './components/dashboard-sidebar'

export const metadata: Metadata = {
  title: 'Dashboard — Surfaced Art',
  robots: { index: false, follow: false },
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div data-testid="dashboard-layout" className="flex flex-col md:flex-row gap-6 md:gap-8">
      <DashboardSidebar />
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  )
}
