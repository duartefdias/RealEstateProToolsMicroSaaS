import { Metadata } from 'next'
import { ProfileForm } from '@/components/profile/ProfileForm'

export const metadata: Metadata = {
  title: 'Profile - Real Estate Pro Tools',
  description: 'Manage your profile and account settings',
}

export default function ProfilePage() {
  return (
    <div className="container mx-auto py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
          <p className="text-muted-foreground">
            Manage your account settings and personal information
          </p>
        </div>
        
        <ProfileForm />
      </div>
    </div>
  )
}