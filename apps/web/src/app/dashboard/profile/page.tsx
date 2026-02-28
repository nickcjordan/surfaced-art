'use client'

import { ProfileForm } from './components/profile-form'

export default function ProfilePage() {
  return (
    <div data-testid="profile-editor" className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Edit Profile</h1>
        <p className="text-muted-foreground mt-1">
          Update your artist profile information and images.
        </p>
      </div>
      <ProfileForm />
    </div>
  )
}
