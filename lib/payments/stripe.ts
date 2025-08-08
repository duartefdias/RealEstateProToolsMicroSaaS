import Stripe from 'stripe'
import { SubscriptionTier } from '@/types/payment'

// Server-side Stripe client (never expose secret key to client)
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
  typescript: true,
})

// Client-side publishable key
export const getStripePublishableKey = () => {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  if (!key) {
    throw new Error('Missing Stripe publishable key')
  }
  return key
}

// Subscription tier definitions with Stripe integration
export const subscriptionTiers: Record<string, SubscriptionTier> = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    currency: 'EUR',
    interval: null,
    stripePriceId: null,
    features: [
      '5 calculations per day',
      'Basic calculators',
      'Portuguese localization',
      'Email support'
    ],
    limits: {
      dailyCalculations: 5,
      clientManagement: false,
      advancedReporting: false,
      prioritySupport: false,
      exportFunctionality: false
    }
  },
  registered: {
    id: 'registered',
    name: 'Registered',
    price: 0,
    currency: 'EUR',
    interval: null,
    stripePriceId: null,
    features: [
      '10 calculations per day',
      'All basic calculators',
      'Portuguese + English',
      'Email support',
      'Calculation history'
    ],
    limits: {
      dailyCalculations: 10,
      clientManagement: false,
      advancedReporting: false,
      prioritySupport: false,
      exportFunctionality: false
    }
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 9.99,
    currency: 'EUR',
    interval: 'month',
    stripePriceId: process.env.STRIPE_PRO_MONTHLY_PRICE_ID!,
    features: [
      'Unlimited calculations',
      'All calculators + advanced features',
      'Client management system',
      'Task tracking & CRM',
      'Advanced reporting & analytics',
      'Export to PDF/Excel',
      'Priority email support',
      'Portuguese + English + more languages'
    ],
    limits: {
      dailyCalculations: Infinity,
      clientManagement: true,
      advancedReporting: true,
      prioritySupport: true,
      exportFunctionality: true
    }
  }
}

// Helper function to get tier by ID with fallback
export function getSubscriptionTier(tierId: string): SubscriptionTier {
  return subscriptionTiers[tierId] ?? subscriptionTiers['free'] as SubscriptionTier
}

// Helper function to determine if user can access a feature
export function canAccessFeature(
  userTier: string,
  feature: keyof SubscriptionTier['limits']
): boolean {
  const tier = getSubscriptionTier(userTier)
  return Boolean(tier.limits[feature])
}

// Helper function to get usage limits for a tier
export function getUsageLimits(tierId: string) {
  const tier = getSubscriptionTier(tierId)
  return {
    dailyCalculations: tier.limits.dailyCalculations,
    resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Next day
  }
}

// Currency formatting for Portuguese market
export function formatPrice(amount: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: currency,
  }).format(amount)
}

// Stripe webhook event types we handle
export const STRIPE_WEBHOOK_EVENTS = [
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'customer.subscription.paused',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
  'invoice.payment_action_required',
  'customer.created',
  'customer.updated',
  'customer.deleted',
] as const

export type StripeWebhookEvent = (typeof STRIPE_WEBHOOK_EVENTS)[number]

// Constants for Stripe configuration
export const STRIPE_CONFIG = {
  currency: 'eur',
  country: 'PT',
  locale: 'pt',
  success_url: '/dashboard?payment=success',
  cancel_url: '/pricing?payment=canceled',
  customer_portal_return_url: '/dashboard/billing',
  
  // Tax configuration for Portugal
  tax_id_collection: {
    enabled: true,
    required: 'if_supported' as const,
  },
  
  // Supported payment methods for Portuguese market
  payment_method_types: [
    'card',
    'sepa_debit',
    'multibanco', // Popular in Portugal
  ],
  
  // Billing configuration
  billing_address_collection: 'required' as const,
  allow_promotion_codes: true,
} as const