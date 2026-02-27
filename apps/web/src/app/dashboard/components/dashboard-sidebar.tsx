'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', testId: 'sidebar-dashboard' },
  { href: '/dashboard/profile', label: 'Profile', testId: 'sidebar-profile' },
  { href: '/dashboard/listings', label: 'Listings', testId: 'sidebar-listings' },
  { href: '/dashboard/settings', label: 'Settings', testId: 'sidebar-settings' },
]

export function DashboardSidebar() {
  const pathname = usePathname()

  return (
    <nav data-testid="dashboard-sidebar" className="md:w-56 shrink-0">
      <div className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible">
        {navItems.map((item) => {
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
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
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
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
