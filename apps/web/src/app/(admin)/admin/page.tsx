'use client'

/**
 * Admin dashboard landing page.
 * Shows a simple overview — will be extended with stats and quick actions
 * as individual admin feature pages are built.
 */
export default function AdminDashboardPage() {
  return (
    <div data-testid="admin-dashboard">
      <h1 className="text-2xl font-semibold text-foreground mb-4">Admin Dashboard</h1>
      <p className="text-muted-foreground">
        Welcome to the Surfaced Art admin panel. Use the sidebar to manage the platform.
      </p>
    </div>
  )
}
