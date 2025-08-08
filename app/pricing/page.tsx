'use client'

import { useState } from 'react'
import { Check, Zap, Users, Calculator, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { subscriptionTiers, formatPrice } from '@/lib/payments/stripe'
import { useAuth } from '@/lib/auth/context'
import { PricingPlan } from '@/types/payment'

export default function PricingPage() {
  const { user, profile } = useAuth()
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly')

  // Define pricing plans with UI configuration
  const pricingPlans: PricingPlan[] = [
    {
      tier: subscriptionTiers.free!,
      highlighted: false,
      ctaText: user ? 'Current Plan' : 'Get Started',
    },
    {
      tier: subscriptionTiers.registered!,
      highlighted: false,
      ctaText: user ? (profile?.subscription_tier === 'registered' ? 'Current Plan' : 'Downgrade') : 'Sign Up Free',
    },
    {
      tier: subscriptionTiers.pro!,
      highlighted: true,
      ctaText: profile?.subscription_tier === 'pro' ? 'Current Plan' : 'Upgrade to Pro',
    },
  ]

  const handleSubscribe = async (priceId: string | null, tierName: string) => {
    if (!priceId || !user) {
      // Redirect to signup for free/registered tiers
      window.location.href = '/auth/signup'
      return
    }

    setIsLoading(tierName)
    
    try {
      const response = await fetch('/api/payments/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          successUrl: `${window.location.origin}/dashboard?payment=success`,
          cancelUrl: `${window.location.origin}/pricing?payment=canceled`,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create checkout session')
      }

      const { url } = await response.json()
      
      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error('Error creating checkout session:', error)
      // TODO: Show error toast
    } finally {
      setIsLoading(null)
    }
  }

  const getButtonState = (plan: PricingPlan) => {
    const isCurrentPlan = profile?.subscription_tier === plan.tier.id
    const isLoading: boolean = !!plan.tier.name
    
    return {
      disabled: isCurrentPlan || isLoading,
      loading: isLoading,
      text: isCurrentPlan ? 'Current Plan' : plan.ctaText
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
            Choose Your Plan
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-600">
            Get professional real estate calculations and tools for the Portuguese market. 
            Start free and upgrade when you need more.
          </p>
        </div>

        {/* Billing Toggle - Future feature for yearly plans */}
        {/* <div className="mt-12 flex justify-center">
          <div className="relative bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setBillingInterval('monthly')}
              className={`relative px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                billingInterval === 'monthly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingInterval('yearly')}
              className={`relative px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                billingInterval === 'yearly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Yearly <Badge variant="secondary" className="ml-2">Save 20%</Badge>
            </button>
          </div>
        </div> */}

        {/* Pricing Cards */}
        <div className="mt-16 grid gap-8 lg:grid-cols-3 lg:gap-8">
          {pricingPlans.map((plan, index) => {
            const buttonState = getButtonState(plan)
            
            return (
              <Card
                key={plan.tier.id}
                className={`relative ${
                  plan.highlighted
                    ? 'border-2 border-primary shadow-2xl scale-105 z-10'
                    : 'border border-gray-200 shadow-lg'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-4 py-1">
                      Most Popular
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-6">
                  <CardTitle className="text-2xl font-bold">
                    {plan.tier.name}
                  </CardTitle>
                  <CardDescription className="mt-2">
                    {plan.tier.id === 'free' && 'Perfect for trying out our calculators'}
                    {plan.tier.id === 'registered' && 'For occasional real estate calculations'}
                    {plan.tier.id === 'pro' && 'For real estate professionals and investors'}
                  </CardDescription>
                  <div className="mt-6">
                    {plan.tier.price === 0 ? (
                      <div className="text-4xl font-bold text-gray-900">
                        Free
                      </div>
                    ) : (
                      <div className="text-4xl font-bold text-gray-900">
                        {formatPrice(plan.tier.price)}
                        <span className="text-xl font-normal text-gray-600">
                          /{plan.tier.interval}
                        </span>
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="pb-6">
                  <ul className="space-y-3">
                    {plan.tier.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start">
                        <Check className="h-5 w-5 text-primary mt-0.5 mr-3 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Usage Limits Display */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center text-gray-600">
                        <Calculator className="h-4 w-4 mr-2" />
                        Daily calculations
                      </span>
                      <span className="font-semibold">
                        {plan.tier.limits.dailyCalculations === Infinity
                          ? 'Unlimited'
                          : `${plan.tier.limits.dailyCalculations} per day`}
                      </span>
                    </div>
                    
                    {plan.tier.limits.clientManagement && (
                      <div className="flex items-center justify-between text-sm mt-2">
                        <span className="flex items-center text-gray-600">
                          <Users className="h-4 w-4 mr-2" />
                          Client management
                        </span>
                        <Check className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    
                    {plan.tier.limits.advancedReporting && (
                      <div className="flex items-center justify-between text-sm mt-2">
                        <span className="flex items-center text-gray-600">
                          <BarChart3 className="h-4 w-4 mr-2" />
                          Advanced reporting
                        </span>
                        <Check className="h-4 w-4 text-primary" />
                      </div>
                    )}
                  </div>
                </CardContent>

                <CardFooter>
                  <Button
                    onClick={() => handleSubscribe(plan.tier.stripePriceId, plan.tier.name)}
                    disabled={buttonState.disabled}
                    className={`w-full ${
                      plan.highlighted
                        ? 'bg-primary hover:bg-primary/90'
                        : 'bg-gray-900 hover:bg-gray-800'
                    }`}
                  >
                    {buttonState.loading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Processing...
                      </div>
                    ) : (
                      <>
                        {plan.tier.stripePriceId && <Zap className="h-4 w-4 mr-2" />}
                        {buttonState.text}
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>

        {/* FAQ Section */}
        <div className="mt-20">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">
              Frequently Asked Questions
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Common questions about our pricing and features
            </p>
          </div>

          <div className="mt-12 grid gap-8 lg:grid-cols-2">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Can I change plans anytime?
              </h3>
              <p className="mt-2 text-gray-600">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately,
                and we'll prorate any billing differences.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                What payment methods do you accept?
              </h3>
              <p className="mt-2 text-gray-600">
                We accept all major credit cards, SEPA direct debit, and Multibanco for Portuguese customers.
                All payments are securely processed by Stripe.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Is there a free trial for Pro?
              </h3>
              <p className="mt-2 text-gray-600">
                You can start with our Free or Registered tiers to test our calculators. 
                When you're ready for unlimited access, upgrade to Pro anytime.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Do you offer refunds?
              </h3>
              <p className="mt-2 text-gray-600">
                We offer a 30-day money-back guarantee for all paid plans. 
                If you're not satisfied, contact us for a full refund.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}