import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

// We need to control what usePathname returns per test
let mockPathname = '/dashboard'

vi.mock('next/navigation', async () => {
  const actual = await vi.importActual<typeof import('next/navigation')>('next/navigation')
  return {
    ...actual,
    usePathname: () => mockPathname,
  }
})

import { DashboardSidebar } from '../components/dashboard-sidebar'

beforeEach(() => {
  mockPathname = '/dashboard'
})

describe('DashboardSidebar', () => {
  it('should render with data-testid', () => {
    render(<DashboardSidebar />)
    expect(screen.getByTestId('dashboard-sidebar')).toBeInTheDocument()
  })

  it('should render all 4 navigation items', () => {
    render(<DashboardSidebar />)

    expect(screen.getByTestId('sidebar-dashboard')).toBeInTheDocument()
    expect(screen.getByTestId('sidebar-profile')).toBeInTheDocument()
    expect(screen.getByTestId('sidebar-listings')).toBeInTheDocument()
    expect(screen.getByTestId('sidebar-settings')).toBeInTheDocument()
  })

  it('should have correct hrefs', () => {
    render(<DashboardSidebar />)

    expect(screen.getByTestId('sidebar-dashboard')).toHaveAttribute('href', '/dashboard')
    expect(screen.getByTestId('sidebar-profile')).toHaveAttribute('href', '/dashboard/profile')
    expect(screen.getByTestId('sidebar-listings')).toHaveAttribute('href', '/dashboard/listings')
    expect(screen.getByTestId('sidebar-settings')).toHaveAttribute('href', '/dashboard/settings')
  })

  it('should highlight active item for /dashboard', () => {
    mockPathname = '/dashboard'
    render(<DashboardSidebar />)

    const dashboardLink = screen.getByTestId('sidebar-dashboard')
    expect(dashboardLink.className).toContain('bg-accent-primary')
  })

  it('should highlight active item for /dashboard/profile', () => {
    mockPathname = '/dashboard/profile'
    render(<DashboardSidebar />)

    const profileLink = screen.getByTestId('sidebar-profile')
    expect(profileLink.className).toContain('bg-accent-primary')

    const dashboardLink = screen.getByTestId('sidebar-dashboard')
    expect(dashboardLink.className).not.toContain('bg-accent-primary')
  })

  it('should highlight parent section for nested route /dashboard/profile/edit', () => {
    mockPathname = '/dashboard/profile/edit'
    render(<DashboardSidebar />)

    const profileLink = screen.getByTestId('sidebar-profile')
    expect(profileLink.className).toContain('bg-accent-primary')

    const dashboardLink = screen.getByTestId('sidebar-dashboard')
    expect(dashboardLink.className).not.toContain('bg-accent-primary')
  })

  it('should not highlight Dashboard for nested routes under other sections', () => {
    mockPathname = '/dashboard/listings/new'
    render(<DashboardSidebar />)

    const listingsLink = screen.getByTestId('sidebar-listings')
    expect(listingsLink.className).toContain('bg-accent-primary')

    const dashboardLink = screen.getByTestId('sidebar-dashboard')
    expect(dashboardLink.className).not.toContain('bg-accent-primary')
  })
})
