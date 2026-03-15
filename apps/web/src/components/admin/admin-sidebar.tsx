'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/admin', label: 'Dashboard', testId: 'admin-sidebar-dashboard' },
  { href: '/admin/applications', label: 'Applications', testId: 'admin-sidebar-applications' },
  { href: '/admin/artists', label: 'Artists', testId: 'admin-sidebar-artists' },
  { href: '/admin/listings', label: 'Listings', testId: 'admin-sidebar-listings' },
  { href: '/admin/users', label: 'Users', testId: 'admin-sidebar-users' },
  { href: '/admin/waitlist', label: 'Waitlist', testId: 'admin-sidebar-waitlist' },
  { href: '/admin/audit-log', label: 'Audit Log', testId: 'admin-sidebar-audit-log' },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <nav data-testid="admin-sidebar" className="md:w-56 shrink-0">
      <div className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible">
        {navItems.map((item) => {
          const isActive =
            item.href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              data-testid={item.testId}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap',
                isActive
                  ? 'bg-accent-primary/10 text-accent-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
              )}
            >
              {item.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
