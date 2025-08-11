'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Calendar, 
  CreditCard, 
  Download, 
  ExternalLink, 
  Settings, 
  CheckCircle,
  AlertCircle 
} from 'lucide-react'
import { formatPrice } from '@/lib/payments/stripe'
import { useAuth } from '@/lib/auth/context'

interface SubscriptionManagerProps {
  className?: string
}

export default function SubscriptionManager({ className }: SubscriptionManagerProps) {
  const { profile } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  const handleManageSubscription = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/payments/customer-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to access customer portal')
      }

      const { url } = await response.json()
      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error('Error accessing customer portal:', error)
      // TODO: Show error toast
    } finally {
      setIsLoading(false)
    }
  }

  const subscriptionStatus = profile?.subscription_status || 'inactive'
  const isActive = subscriptionStatus === 'active'
  
  // Format next billing date if available
  const nextBillingDate = profile?.current_period_end 
    ? new Date(profile.current_period_end).toLocaleDateString('pt-PT', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : null

  return (
    <div className={className}>
      {/* Current Subscription Status */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Subscription Status
              </CardTitle>
              <CardDescription>
                Manage your Real Estate Pro Tools subscription
              </CardDescription>
            </div>
            <Badge 
              variant={isActive ? 'default' : 'secondary'}
              className={isActive ? 'bg-green-100 text-green-800' : ''}
            >
              {isActive ? (
                <>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Active
                </>
              ) : (
                <>
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {subscriptionStatus}
                </>
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Current Plan</p>
              <p className="text-lg font-semibold">
                {profile?.subscription_tier === 'pro' ? 'Pro Plan' : 'Free Plan'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Monthly Price</p>
              <p className="text-lg font-semibold">
                {profile?.subscription_tier === 'pro' ? formatPrice(9.99) : formatPrice(0)}
              </p>
            </div>
            {nextBillingDate && (
              <div>
                <p className="text-sm font-medium text-gray-600">Next Billing Date</p>
                <p className="text-lg font-semibold flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {nextBillingDate}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-gray-600">Daily Calculations</p>
              <p className="text-lg font-semibold">
                {profile?.subscription_tier === 'pro' ? 'Unlimited' : '5 per day'}
              </p>
            </div>
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleManageSubscription}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              {isLoading ? 'Loading...' : 'Manage Subscription'}
              <ExternalLink className="h-3 w-3" />
            </Button>
            
            {profile?.subscription_tier === 'pro' && (
              <Button variant="outline" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Download Invoice
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pro Plan Features */}
      {profile?.subscription_tier === 'pro' && (
        <Card>
          <CardHeader>
            <CardTitle>Pro Plan Features</CardTitle>
            <CardDescription>
              You have access to all professional features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                'Unlimited calculations',
                'Client management system',
                'Task tracking & CRM',
                'Advanced reporting',
                'Export to PDF/Excel',
                'Priority email support',
                'Multi-language support'
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upgrade Prompt for Non-Pro Users */}
      {profile?.subscription_tier !== 'pro' && (
        <Card>
          <CardHeader>
            <CardTitle>Upgrade to Pro</CardTitle>
            <CardDescription>
              Unlock unlimited calculations and advanced features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Get unlimited access to all calculators, client management tools, 
              and advanced reporting features.
            </p>
            <Button asChild className="w-full">
              <a href="/pricing">
                View Pro Plans
              </a>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}