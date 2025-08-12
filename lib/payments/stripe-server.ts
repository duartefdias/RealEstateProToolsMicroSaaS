import Stripe from 'stripe'
import { SubscriptionTier } from '@/types/payment'

// Server-side Stripe client (never expose secret key to client)
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  typescript: true,
})

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
  
  // Supported payment methods for Portuguese market (subscription-compatible)
  payment_method_types: [
    'card',
    'sepa_debit',
    // Note: multibanco not supported for subscriptions, only one-time payments
  ],
  
  // Billing configuration
  billing_address_collection: 'required' as const,
  allow_promotion_codes: true,
}

// Server-side helper functions
export async function createCheckoutSession(params: {
  priceId: string
  userId?: string
  userEmail?: string
  successUrl?: string
  cancelUrl?: string
}) {
  const { priceId, userId, userEmail, successUrl, cancelUrl } = params

  const session = await stripe.checkout.sessions.create({
    ...(userEmail && { customer_email: userEmail }),
    ...(userId && { client_reference_id: userId }),
    line_items: [{
      price: priceId,
      quantity: 1,
    }],
    mode: 'subscription',
    success_url: successUrl || `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?payment=success`,
    cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_SITE_URL}/pricing?payment=canceled`,
    ...(userId && {
      subscription_data: {
        metadata: {
          user_id: userId,
        },
      }
    }),
    allow_promotion_codes: STRIPE_CONFIG.allow_promotion_codes,
    billing_address_collection: STRIPE_CONFIG.billing_address_collection,
    tax_id_collection: STRIPE_CONFIG.tax_id_collection,
    payment_method_types: STRIPE_CONFIG.payment_method_types as any,
  })

  return session
}

export async function createCustomerPortalSession(customerId: string) {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXT_PUBLIC_SITE_URL}${STRIPE_CONFIG.customer_portal_return_url}`,
  })

  return session
}

// Get customer by email or Stripe customer ID
export async function getStripeCustomer(identifier: string) {
  try {
    // If it looks like a Stripe customer ID, get by ID
    if (identifier.startsWith('cus_')) {
      return await stripe.customers.retrieve(identifier) as Stripe.Customer
    }
    
    // Otherwise search by email
    const customers = await stripe.customers.list({
      email: identifier,
      limit: 1,
    })
    
    return customers.data[0] || null
  } catch (error) {
    console.error('Error retrieving Stripe customer:', error)
    return null
  }
}

// Get active subscription for a customer
export async function getActiveSubscription(customerId: string) {
  try {
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1,
    })
    
    return subscriptions.data[0] || null
  } catch (error) {
    console.error('Error retrieving active subscription:', error)
    return null
  }
}