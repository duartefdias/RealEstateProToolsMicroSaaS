'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Icons } from '@/components/ui/icons'
import { useAuth } from '@/lib/auth/context'
import { formatDistanceToNow } from 'date-fns'

const profileSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(50, 'Full name must be less than 50 characters'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  phone: z
    .string()
    .optional()
    .refine((val) => !val || val.length >= 10, 'Phone number must be at least 10 characters'),
  website: z
    .string()
    .optional()
    .refine((val) => !val || val.startsWith('http'), 'Website must be a valid URL starting with http or https'),
})

type ProfileFormData = z.infer<typeof profileSchema>

export function ProfileForm() {
  const { user, profile, updateProfile, profileLoading, usageLimit } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: profile?.full_name || '',
      email: profile?.email || user?.email || '',
      phone: profile?.phone || '',
      website: profile?.website || '',
    },
  })

  // Reset form when profile loads
  useState(() => {
    if (profile) {
      form.reset({
        fullName: profile.full_name || '',
        email: profile.email || user?.email || '',
        phone: profile.phone || '',
        website: profile.website || '',
      })
    }
  })

  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const { error } = await updateProfile({
        full_name: data.fullName,
        phone: data.phone || null,
        website: data.website || null,
      })

      if (error) {
        setError(error)
        return
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000) // Hide success message after 3 seconds
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const getSubscriptionBadgeVariant = (tier: string) => {
    switch (tier) {
      case 'pro':
        return 'default'
      case 'registered':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const getSubscriptionLabel = (tier: string) => {
    switch (tier) {
      case 'pro':
        return 'Pro'
      case 'registered':
        return 'Registered'
      default:
        return 'Free'
    }
  }

  if (profileLoading) {
    return (
      <Card className="w-full max-w-2xl">
        <CardContent className="flex items-center justify-center py-8">
          <Icons.spinner className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading profile...</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Profile Overview Card */}
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="text-lg">
                {profile?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 
                 user?.email?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-semibold">
                  {profile?.full_name || 'User'}
                </h2>
                <Badge variant={getSubscriptionBadgeVariant(profile?.subscription_tier || 'free')}>
                  {getSubscriptionLabel(profile?.subscription_tier || 'free')}
                </Badge>
              </div>
              <p className="text-muted-foreground">
                Member since {profile?.created_at ? 
                  formatDistanceToNow(new Date(profile.created_at), { addSuffix: true }) : 
                  'recently'
                }
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Usage Statistics */}
      {usageLimit && (
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-lg">Usage Statistics</CardTitle>
            <CardDescription>
              Your daily calculation usage and limits
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Daily Calculations</span>
                <span className="text-sm">
                  {usageLimit.current_usage} / {
                    usageLimit.daily_limit === Infinity ? '∞' : usageLimit.daily_limit
                  }
                </span>
              </div>
              
              {usageLimit.daily_limit !== Infinity && (
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min((usageLimit.current_usage / usageLimit.daily_limit) * 100, 100)}%`
                    }}
                  />
                </div>
              )}
              
              <p className="text-xs text-muted-foreground">
                {usageLimit.daily_limit === Infinity ? 
                  'You have unlimited calculations with your Pro subscription' :
                  `Resets ${formatDistanceToNow(usageLimit.reset_time, { addSuffix: true })}`
                }
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Profile Edit Form */}
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Update your personal information and contact details
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Success Message */}
          {success && (
            <Alert>
              <Icons.check className="h-4 w-4" />
              <AlertDescription>
                Profile updated successfully!
              </AlertDescription>
            </Alert>
          )}

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  disabled={isLoading}
                  {...form.register('fullName')}
                />
                {form.formState.errors.fullName && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.fullName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  disabled={true} // Email changes require verification
                  {...form.register('email')}
                />
                <p className="text-xs text-muted-foreground">
                  Contact support to change your email address
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+351 XXX XXX XXX"
                  disabled={isLoading}
                  {...form.register('phone')}
                />
                {form.formState.errors.phone && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.phone.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  placeholder="https://example.com"
                  disabled={isLoading}
                  {...form.register('website')}
                />
                {form.formState.errors.website && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.website.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => form.reset()}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !form.formState.isDirty}
              >
                {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}