'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function SettingsPage() {
  const { user } = useAuth()

  return (
    <div data-testid="settings-page" className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account settings.
        </p>
      </div>

      <Card data-testid="settings-account">
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Your account details and preferences.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Name</p>
            <p data-testid="settings-name" className="text-sm">{user?.name}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Email</p>
            <p data-testid="settings-email" className="text-sm">{user?.email}</p>
          </div>
        </CardContent>
      </Card>

      <Card data-testid="settings-security">
        <CardHeader>
          <CardTitle>Security</CardTitle>
          <CardDescription>Manage your password and security settings.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" asChild>
            <Link href="/forgot-password">Change Password</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
