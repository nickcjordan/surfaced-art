'use client'

import { ProfileForm } from './components/profile-form'
import { CvEntryList } from './components/cv-entry-list'

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
      <CvEntryList />
    </div>
  )
}
