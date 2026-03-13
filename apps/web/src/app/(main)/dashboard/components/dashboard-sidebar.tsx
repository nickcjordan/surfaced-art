'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import type { UserRoleType } from '@surfaced-art/types'
import { cn } from '@/lib/utils'

interface SidebarItem {
  href: string
  label: string
  testId: string
}

interface SidebarSection {
  label: string
  requiredRole?: UserRoleType
  items: SidebarItem[]
}

const sections: SidebarSection[] = [
  {
    label: 'General',
    items: [
      { href: '/dashboard', label: 'Dashboard', testId: 'sidebar-dashboard' },
      { href: '/dashboard/settings', label: 'Settings', testId: 'sidebar-settings' },
    ],
  },
  {
    label: 'Artist',
    requiredRole: 'artist',
    items: [
      { href: '/dashboard/profile', label: 'Profile', testId: 'sidebar-profile' },
      { href: '/dashboard/listings', label: 'Listings', testId: 'sidebar-listings' },
    ],
  },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const { hasRole } = useAuth()

  const visibleSections = sections.filter(
    (section) => !section.requiredRole || hasRole(section.requiredRole)
  )

  return (
    <nav data-testid="dashboard-sidebar" className="md:w-56 shrink-0">
      <div className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible">
        {visibleSections.map((section, sectionIndex) => (
          <div key={section.label} className={cn(sectionIndex > 0 && 'mt-4 md:mt-6')}>
            <p className="hidden md:block px-3 mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {section.label}
            </p>
            {section.items.map((item) => {
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
        ))}
      </div>
    </nav>
  )
}
