import { stripe } from './stripe-server'
import { subscriptionTiers } from './stripe'
import { createServerSupabaseClient } from '@/lib/database/supabase'
import { StripeSubscription, StripeCustomer, SubscriptionManagement, CheckoutSessionData, UsageLimitCheck } from '@/types/payment'
import Stripe from 'stripe'

export class SubscriptionManager {
  private supabase = createServerSupabaseClient()

  /**
   * Get complete subscription management data for a user
   */
  async getSubscriptionManagement(userId: string): Promise<SubscriptionManagement | null> {
    try {
      // Get user profile with subscription info
      const { data: profile } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (!profile) return null

      let stripeSubscription = null
      let stripeCustomer = null

      // Get Stripe data if customer exists
      if (profile.stripe_customer_id) {
        try {
          stripeCustomer = await stripe.customers.retrieve(profile.stripe_customer_id) as Stripe.Customer
          
          if (profile.subscription_id) {
            stripeSubscription = await stripe.subscriptions.retrieve(profile.subscription_id) as Stripe.Subscription
          }
        } catch (error) {
          console.error('Error fetching Stripe data:', error)
        }
      }

      // Get payment history
      const { data: paymentHistory = [] } = await this.supabase
        .from('payment_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10)

      const currentTier = subscriptionTiers[profile.subscription_tier] ?? subscriptionTiers.free
      const isActiveSubscription = stripeSubscription?.status === 'active'

      return {
        subscription: stripeSubscription ? this.mapStripeSubscription(stripeSubscription) : null,
        customer: stripeCustomer ? this.mapStripeCustomer(stripeCustomer) : null,
        paymentHistory: paymentHistory || [],
        canUpgrade: profile.subscription_tier !== 'pro',
        canDowngrade: profile.subscription_tier === 'pro' && isActiveSubscription,
        canCancel: isActiveSubscription && !(stripeSubscription as any)?.cancel_at_period_end,
        canReactivate: (stripeSubscription as any)?.cancel_at_period_end === true,
        nextBillingDate: (stripeSubscription as any)?.current_period_end 
          ? new Date((stripeSubscription as any).current_period_end * 1000) 
          : null,
        currentUsage: {
          calculationsUsed: profile.daily_calculations_used,
          calculationsLimit: currentTier?.limits.dailyCalculations || 5,
          resetDate: this.getNextResetDate()
        }
      }
    } catch (error) {
      console.error('Error getting subscription management:', error)
      return null
    }
  }

  /**
   * Create a checkout session for subscription upgrade
   */
  async createCheckoutSession(
    userId: string, 
    priceId: string, 
    successUrl?: string, 
    cancelUrl?: string
  ): Promise<CheckoutSessionData | null> {
    try {
      // Get or create customer
      const customerId = await this.getOrCreateStripeCustomer(userId)
      if (!customerId) throw new Error('Failed to create customer')

      const checkoutSession = await stripe.checkout.sessions.create({
        customer: customerId,
        client_reference_id: userId,
        line_items: [{ price: priceId, quantity: 1 }],
        mode: 'subscription',
        success_url: successUrl || `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?payment=success`,
        cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_SITE_URL}/pricing?payment=canceled`,
        currency: 'eur',
        locale: 'pt',
        tax_id_collection: { enabled: true },
        billing_address_collection: 'required',
        payment_method_types: ['card', 'sepa_debit'],
        allow_promotion_codes: true,
        subscription_data: {
          metadata: { userId, source: 'subscription_manager' }
        },
        customer_update: {
          address: 'auto',
          name: 'auto'
        },
        consent_collection: {
          terms_of_service: 'required'
        }
      })

      return {
        sessionId: checkoutSession.id,
        url: checkoutSession.url!,
        customerId,
        priceId,
        successUrl: checkoutSession.success_url!,
        cancelUrl: checkoutSession.cancel_url!
      }
    } catch (error) {
      console.error('Error creating checkout session:', error)
      return null
    }
  }

  /**
   * Cancel subscription (at period end)
   */
  async cancelSubscription(userId: string, reason?: string): Promise<boolean> {
    try {
      const { data: profile } = await this.supabase
        .from('profiles')
        .select('subscription_id')
        .eq('id', userId)
        .single()

      if (!profile?.subscription_id) return false

      await stripe.subscriptions.update(profile.subscription_id, {
        cancel_at_period_end: true,
        metadata: {
          canceled_by: 'user',
          cancellation_reason: reason || 'user_requested'
        }
      })

      // Record cancellation event
      await this.supabase
        .from('subscription_events')
        .insert({
          user_id: userId,
          stripe_subscription_id: profile.subscription_id,
          event_type: 'subscription_updated',
          old_status: 'active',
          new_status: 'active',
          cancellation_reason: reason,
          cancel_at_period_end: true,
          initiated_by: 'user'
        })

      return true
    } catch (error) {
      console.error('Error canceling subscription:', error)
      return false
    }
  }

  /**
   * Reactivate subscription (remove cancel at period end)
   */
  async reactivateSubscription(userId: string): Promise<boolean> {
    try {
      const { data: profile } = await this.supabase
        .from('profiles')
        .select('subscription_id')
        .eq('id', userId)
        .single()

      if (!profile?.subscription_id) return false

      await stripe.subscriptions.update(profile.subscription_id, {
        cancel_at_period_end: false,
        metadata: { reactivated_by: 'user' }
      })

      return true
    } catch (error) {
      console.error('Error reactivating subscription:', error)
      return false
    }
  }

  /**
   * Check usage limits and return upgrade information
   */
  async checkUsageLimit(userId: string): Promise<UsageLimitCheck> {
    try {
      const { data: profile } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (!profile) {
        throw new Error('Profile not found')
      }

      const currentTier = subscriptionTiers[profile.subscription_tier] ?? subscriptionTiers.free
      const isProUser = profile.subscription_tier === 'pro'
      
      // Pro users have unlimited access
      if (isProUser) {
        return {
          allowed: true,
          remaining: Infinity,
          resetTime: this.getNextResetDate(),
          requiresUpgrade: false,
          currentTier: currentTier || subscriptionTiers.free!
        }
      }

      // Check if we need to reset daily usage
      const today = new Date().toISOString().split('T')[0]
      const lastReset = profile.last_calculation_reset
      const lastResetStr = new Date(lastReset).toISOString().split('T')[0]

      let currentUsage = profile.daily_calculations_used
      if (today !== lastResetStr) {
        // Reset usage for new day
        await this.supabase
          .from('profiles')
          .update({
            daily_calculations_used: 0,
            last_calculation_reset: today
          })
          .eq('id', userId)
        currentUsage = 0
      }

      const limit = currentTier?.limits.dailyCalculations || 5
      const remaining = Math.max(0, limit - currentUsage)
      const requiresUpgrade = remaining === 0

      let checkoutUrl: string | undefined

      // Generate checkout URL if upgrade required
      if (requiresUpgrade) {
        const proTier = subscriptionTiers['pro']
        if (proTier?.stripePriceId) {
          const checkoutData = await this.createCheckoutSession(
            userId,
            proTier!.stripePriceId,
            `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?upgrade=success`,
            `${process.env.NEXT_PUBLIC_SITE_URL}/pricing?upgrade=canceled`
          )
          checkoutUrl = checkoutData?.url
        }
      }

      return {
        allowed: remaining > 0,
        remaining,
        resetTime: this.getNextResetDate(),
        requiresUpgrade,
        ...(checkoutUrl && { checkoutUrl }),
        currentTier: currentTier || subscriptionTiers.free!
      }
    } catch (error) {
      console.error('Error checking usage limit:', error)
      throw error
    }
  }

  /**
   * Increment usage counter for a user
   */
  async incrementUsage(userId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase.rpc('increment_daily_calculations', {
        user_id: userId
      })

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error incrementing usage:', error)
      return false
    }
  }

  /**
   * Get customer portal URL
   */
  async getCustomerPortalUrl(userId: string, returnUrl?: string): Promise<string | null> {
    try {
      const { data: profile } = await this.supabase
        .from('profiles')
        .select('stripe_customer_id')
        .eq('id', userId)
        .single()

      if (!profile?.stripe_customer_id) return null

      const portalSession = await stripe.billingPortal.sessions.create({
        customer: profile.stripe_customer_id,
        return_url: returnUrl || `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/billing`
      })

      return portalSession.url
    } catch (error) {
      console.error('Error creating customer portal URL:', error)
      return null
    }
  }

  /**
   * Private helper methods
   */
  private async getOrCreateStripeCustomer(userId: string): Promise<string | null> {
    try {
      const { data: profile } = await this.supabase
        .from('profiles')
        .select('stripe_customer_id, email, full_name')
        .eq('id', userId)
        .single()

      if (!profile) return null

      if (profile.stripe_customer_id) {
        return profile.stripe_customer_id
      }

      // Create new customer
      const customer = await stripe.customers.create({
        email: profile.email,
        name: profile.full_name || undefined,
        metadata: { userId, source: 'subscription_manager' }
      })

      // Update profile with customer ID
      await this.supabase
        .from('profiles')
        .update({ stripe_customer_id: customer.id })
        .eq('id', userId)

      return customer.id
    } catch (error) {
      console.error('Error getting/creating customer:', error)
      return null
    }
  }

  private mapStripeSubscription(subscription: Stripe.Subscription): StripeSubscription {
    return {
      id: subscription.id,
      customerId: subscription.customer as string,
      status: subscription.status as any,
      priceId: subscription.items.data[0]?.price.id || '',
      currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
      currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
      cancelAtPeriodEnd: (subscription as any).cancel_at_period_end,
      canceledAt: (subscription as any).canceled_at ? new Date((subscription as any).canceled_at * 1000) : null,
      trialStart: (subscription as any).trial_start ? new Date((subscription as any).trial_start * 1000) : null,
      trialEnd: (subscription as any).trial_end ? new Date((subscription as any).trial_end * 1000) : null,
      metadata: subscription.metadata as Record<string, string>
    }
  }

  private mapStripeCustomer(customer: Stripe.Customer): StripeCustomer {
    return {
      id: customer.id,
      email: customer.email || '',
      name: customer.name || null,
      created: new Date(customer.created * 1000),
      metadata: customer.metadata as Record<string, string>
    }
  }

  private getNextResetDate(): Date {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)
    return tomorrow
  }
}

// Singleton instance
export const subscriptionManager = new SubscriptionManager()

// Helper functions for API routes
export async function enforceUsageLimit(userId: string): Promise<{
  allowed: boolean
  remaining: number
  requiresUpgrade: boolean
  checkoutUrl?: string
}> {
  const usageCheck = await subscriptionManager.checkUsageLimit(userId)
  
  if (usageCheck.allowed && usageCheck.remaining !== Infinity) {
    // Increment usage counter
    await subscriptionManager.incrementUsage(userId)
  }
  
  return {
    allowed: usageCheck.allowed,
    remaining: usageCheck.remaining === Infinity ? -1 : usageCheck.remaining,
    requiresUpgrade: usageCheck.requiresUpgrade,
    ...(usageCheck.checkoutUrl && { checkoutUrl: usageCheck.checkoutUrl })
  }
}

export async function checkSubscriptionAccess(
  userId: string, 
  requiredFeature: string
): Promise<boolean> {
  try {
    const { data: profile } = await createServerSupabaseClient()
      .from('profiles')
      .select('subscription_tier')
      .eq('id', userId)
      .single()

    if (!profile) return false

    const tier = subscriptionTiers[profile.subscription_tier] ?? subscriptionTiers.free
    return Boolean(tier?.limits[requiredFeature as keyof typeof tier.limits])
  } catch (error) {
    console.error('Error checking subscription access:', error)
    return false
  }
}