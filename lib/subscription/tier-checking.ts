import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { UserType } from '@/types/calculator'
import { ANONYMOUS_SESSION_CONFIG } from '../usage/session-tracking'

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
  appInfo: {
    name: 'Real Estate Pro Tools',
    version: '1.0.0',
    url: 'https://realestateprotools.com'
  }
})

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Subscription tier configuration
export const SUBSCRIPTION_TIERS = {
  free: {
    id: 'free',
    name: 'Gratuito',
    stripePriceId: null,
    dailyCalculations: 5,
    features: [
      'Calculadoras básicas',
      'Localização portuguesa',
      'Suporte por email'
    ],
    monthlyPrice: 0,
    yearlyPrice: 0,
    currency: 'EUR'
  },
  registered: {
    id: 'registered',
    name: 'Registado',
    stripePriceId: null,
    dailyCalculations: 10,
    features: [
      'Todas as funcionalidades gratuitas',
      'Dobro do limite diário',
      'Histórico de cálculos',
      'Suporte prioritário'
    ],
    monthlyPrice: 0,
    yearlyPrice: 0,
    currency: 'EUR'
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    stripePriceId: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || 'price_pro_monthly',
    stripeYearlyPriceId: process.env.STRIPE_PRO_YEARLY_PRICE_ID || 'price_pro_yearly',
    dailyCalculations: Infinity,
    features: [
      'Cálculos ilimitados',
      'Gestão completa de clientes',
      'Relatórios avançados',
      'Exportação para PDF',
      'API de integração',
      'Suporte telefónico',
      'Funcionalidades beta prioritárias'
    ],
    monthlyPrice: 9.99,
    yearlyPrice: 99.99,
    currency: 'EUR'
  }
} as const

export type SubscriptionTier = keyof typeof SUBSCRIPTION_TIERS

// Subscription status interface
export interface SubscriptionInfo {
  tier: UserType
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid' | 'incomplete'
  currentPeriodStart?: Date
  currentPeriodEnd?: Date
  cancelAtPeriodEnd?: boolean
  trialEnd?: Date
  lastPaymentFailed?: boolean
  planName: string
  planPrice: number
  dailyCalculations: number
  features: string[]
  canUpgrade: boolean
  canDowngrade: boolean
  nextBillingDate?: Date
  pastDueAmount?: number
}

// Get user's current subscription information
export const getUserSubscription = async (userId: string): Promise<SubscriptionInfo> => {
  try {
    // Get user profile from Supabase
    const { data: profile, error: profileError } = await supabase
      .from(ANONYMOUS_SESSION_CONFIG.PROFILES_TABLE)
      .select('subscription_tier, stripe_customer_id, subscription_id, subscription_status, current_period_end')
      .eq('id', userId)
      .single()

    if (profileError) {
      throw new Error(`Failed to fetch user profile: ${profileError.message}`)
    }

    const userTier = (profile.subscription_tier as UserType) || 'free'
    const tierConfig = SUBSCRIPTION_TIERS[userTier]

    // Base subscription info
    let subscriptionInfo: SubscriptionInfo = {
      tier: userTier,
      stripeCustomerId: profile.stripe_customer_id,
      stripeSubscriptionId: profile.subscription_id,
      status: (profile.subscription_status as any) || 'active',
      planName: tierConfig.name,
      planPrice: tierConfig.monthlyPrice,
      dailyCalculations: tierConfig.dailyCalculations,
      features: tierConfig.features,
      canUpgrade: userTier !== 'pro',
      canDowngrade: userTier === 'pro',
      currentPeriodEnd: profile.current_period_end ? new Date(profile.current_period_end) : undefined
    }

    // If user has Stripe subscription, get detailed info
    if (profile.stripe_subscription_id) {
      try {
        const stripeSubscription = await stripe.subscriptions.retrieve(profile.stripe_subscription_id, {
          expand: ['latest_invoice', 'customer']
        })

        subscriptionInfo = {
          ...subscriptionInfo,
          status: stripeSubscription.status,
          currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
          currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
          cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
          trialEnd: stripeSubscription.trial_end ? new Date(stripeSubscription.trial_end * 1000) : undefined,
          nextBillingDate: new Date(stripeSubscription.current_period_end * 1000),
          lastPaymentFailed: stripeSubscription.status === 'past_due'
        }

        // Get past due amount if applicable
        if (stripeSubscription.status === 'past_due' && stripeSubscription.latest_invoice) {
          const invoice = stripeSubscription.latest_invoice as Stripe.Invoice
          subscriptionInfo.pastDueAmount = invoice.amount_due / 100 // Convert from cents
        }
      } catch (stripeError) {
        console.error('Failed to fetch Stripe subscription:', stripeError)
        // Continue with basic info if Stripe call fails
      }
    }

    return subscriptionInfo
  } catch (error) {
    console.error('getUserSubscription error:', error)
    
    // Return default free tier info on error
    return {
      tier: 'free',
      status: 'active',
      planName: SUBSCRIPTION_TIERS.free.name,
      planPrice: SUBSCRIPTION_TIERS.free.monthlyPrice,
      dailyCalculations: SUBSCRIPTION_TIERS.free.dailyCalculations,
      features: SUBSCRIPTION_TIERS.free.features,
      canUpgrade: true,
      canDowngrade: false
    }
  }
}

// Check if user has access to specific features based on tier
export const checkFeatureAccess = (
  userTier: UserType,
  requiredTier: UserType
): {
  hasAccess: boolean
  requiredTierName: string
  currentTierName: string
  upgradeRequired: boolean
  upgradeUrl: string
} => {
  const tierLevels = {
    anonymous: 0,
    free: 1,
    registered: 2,
    pro: 3
  }

  const currentLevel = tierLevels[userTier] || 0
  const requiredLevel = tierLevels[requiredTier] || 0
  const hasAccess = currentLevel >= requiredLevel

  const currentTierConfig = SUBSCRIPTION_TIERS[userTier === 'anonymous' ? 'free' : userTier]
  const requiredTierConfig = SUBSCRIPTION_TIERS[requiredTier === 'anonymous' ? 'free' : requiredTier]

  return {
    hasAccess,
    requiredTierName: requiredTierConfig.name,
    currentTierName: currentTierConfig.name,
    upgradeRequired: !hasAccess,
    upgradeUrl: userTier === 'anonymous' ? '/auth/signup' : '/pricing'
  }
}

// Create Stripe checkout session for subscription upgrade
export const createCheckoutSession = async (
  userId: string,
  priceId: string,
  successUrl?: string,
  cancelUrl?: string
): Promise<{
  sessionId: string
  checkoutUrl: string
}> => {
  try {
    // Get or create Stripe customer
    const { data: profile } = await supabase
      .from(ANONYMOUS_SESSION_CONFIG.PROFILES_TABLE)
      .select('email, full_name, stripe_customer_id')
      .eq('id', userId)
      .single()

    let customerId = profile?.stripe_customer_id

    if (!customerId) {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: profile?.email,
        name: profile?.full_name,
        metadata: {
          user_id: userId,
          source: 'real_estate_pro_tools'
        }
      })

      customerId = customer.id

      // Update profile with customer ID
      await supabase
        .from(ANONYMOUS_SESSION_CONFIG.PROFILES_TABLE)
        .update({ stripe_customer_id: customerId })
        .eq('id', userId)
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      client_reference_id: userId,
      mode: 'subscription',
      line_items: [{
        price: priceId,
        quantity: 1
      }],
      success_url: successUrl || `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_SITE_URL}/pricing?canceled=true`,
      billing_address_collection: 'required',
      tax_id_collection: {
        enabled: true // For Portuguese VAT collection
      },
      customer_update: {
        address: 'auto',
        name: 'auto'
      },
      invoice_creation: {
        enabled: true
      },
      subscription_data: {
        metadata: {
          user_id: userId,
          source: 'checkout',
          tier: 'pro'
        }
      },
      metadata: {
        user_id: userId,
        source: 'tier_upgrade'
      }
    })

    return {
      sessionId: session.id,
      checkoutUrl: session.url!
    }
  } catch (error) {
    console.error('createCheckoutSession error:', error)
    throw new Error(`Failed to create checkout session: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Cancel subscription
export const cancelSubscription = async (
  userId: string,
  cancelAtPeriodEnd: boolean = true
): Promise<{
  success: boolean
  canceledAt?: Date
  periodEnd?: Date
  error?: string
}> => {
  try {
    const { data: profile } = await supabase
      .from(ANONYMOUS_SESSION_CONFIG.PROFILES_TABLE)
      .select('subscription_id')
      .eq('id', userId)
      .single()

    if (!profile?.subscription_id) {
      return {
        success: false,
        error: 'No active subscription found'
      }
    }

    if (cancelAtPeriodEnd) {
      // Cancel at period end
      const subscription = await stripe.subscriptions.update(profile.subscription_id, {
        cancel_at_period_end: true
      })

      return {
        success: true,
        periodEnd: new Date(subscription.current_period_end * 1000)
      }
    } else {
      // Cancel immediately
      const subscription = await stripe.subscriptions.cancel(profile.subscription_id)

      // Update user profile to free tier
      await supabase
        .from(ANONYMOUS_SESSION_CONFIG.PROFILES_TABLE)
        .update({
          subscription_tier: 'free',
          subscription_status: 'canceled',
          subscription_id: null
        })
        .eq('id', userId)

      return {
        success: true,
        canceledAt: new Date(subscription.canceled_at! * 1000)
      }
    }
  } catch (error) {
    console.error('cancelSubscription error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Update subscription (change plan, etc.)
export const updateSubscription = async (
  userId: string,
  newPriceId: string
): Promise<{
  success: boolean
  newPlan?: string
  effectiveDate?: Date
  prorationAmount?: number
  error?: string
}> => {
  try {
    const { data: profile } = await supabase
      .from(ANONYMOUS_SESSION_CONFIG.PROFILES_TABLE)
      .select('subscription_id')
      .eq('id', userId)
      .single()

    if (!profile?.subscription_id) {
      return {
        success: false,
        error: 'No active subscription found'
      }
    }

    // Get current subscription
    const subscription = await stripe.subscriptions.retrieve(profile.subscription_id)
    const currentItem = subscription.items.data[0]

    // Update subscription item
    const updatedSubscription = await stripe.subscriptions.update(profile.subscription_id, {
      items: [{
        id: currentItem.id,
        price: newPriceId
      }],
      proration_behavior: 'always_invoice'
    })

    return {
      success: true,
      newPlan: newPriceId,
      effectiveDate: new Date(updatedSubscription.current_period_start * 1000),
      prorationAmount: 0 // Would need to calculate based on invoice
    }
  } catch (error) {
    console.error('updateSubscription error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Reactivate canceled subscription
export const reactivateSubscription = async (userId: string): Promise<{
  success: boolean
  reactivatedAt?: Date
  nextBillingDate?: Date
  error?: string
}> => {
  try {
    const { data: profile } = await supabase
      .from(ANONYMOUS_SESSION_CONFIG.PROFILES_TABLE)
      .select('subscription_id')
      .eq('id', userId)
      .single()

    if (!profile?.subscription_id) {
      return {
        success: false,
        error: 'No subscription found'
      }
    }

    // Remove cancel_at_period_end
    const subscription = await stripe.subscriptions.update(profile.subscription_id, {
      cancel_at_period_end: false
    })

    return {
      success: true,
      reactivatedAt: new Date(),
      nextBillingDate: new Date(subscription.current_period_end * 1000)
    }
  } catch (error) {
    console.error('reactivateSubscription error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Get billing portal URL for subscription management
export const createBillingPortalSession = async (
  userId: string,
  returnUrl?: string
): Promise<{
  success: boolean
  portalUrl?: string
  error?: string
}> => {
  try {
    const { data: profile } = await supabase
      .from(ANONYMOUS_SESSION_CONFIG.PROFILES_TABLE)
      .select('stripe_customer_id')
      .eq('id', userId)
      .single()

    if (!profile?.stripe_customer_id) {
      return {
        success: false,
        error: 'No Stripe customer found'
      }
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: returnUrl || `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/billing`
    })

    return {
      success: true,
      portalUrl: session.url
    }
  } catch (error) {
    console.error('createBillingPortalSession error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Sync subscription from Stripe webhook
export const syncSubscriptionFromWebhook = async (
  stripeSubscription: Stripe.Subscription
): Promise<void> => {
  try {
    const userId = stripeSubscription.metadata.user_id
    if (!userId) {
      console.error('No user_id in subscription metadata')
      return
    }

    let subscriptionTier: UserType = 'free'
    
    // Determine tier based on subscription status and items
    if (stripeSubscription.status === 'active' || stripeSubscription.status === 'trialing') {
      const priceId = stripeSubscription.items.data[0]?.price.id
      
      if (priceId === SUBSCRIPTION_TIERS.pro.stripePriceId || 
          priceId === SUBSCRIPTION_TIERS.pro.stripeYearlyPriceId) {
        subscriptionTier = 'pro'
      }
    }

    // Update user profile
    await supabase
      .from(ANONYMOUS_SESSION_CONFIG.PROFILES_TABLE)
      .update({
        subscription_tier: subscriptionTier,
        subscription_id: stripeSubscription.id,
        subscription_status: stripeSubscription.status,
        current_period_start: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
        stripe_customer_id: stripeSubscription.customer as string
      })
      .eq('id', userId)

    console.log(`Synced subscription for user ${userId}: ${subscriptionTier}`)
  } catch (error) {
    console.error('syncSubscriptionFromWebhook error:', error)
  }
}

// Check subscription health and fix issues
export const checkSubscriptionHealth = async (userId: string): Promise<{
  healthy: boolean
  issues: string[]
  fixes: string[]
}> => {
  const issues: string[] = []
  const fixes: string[] = []

  try {
    const subscriptionInfo = await getUserSubscription(userId)

    // Check for common issues
    if (subscriptionInfo.status === 'past_due') {
      issues.push('Pagamento em atraso')
      fixes.push('Atualize o método de pagamento ou quite o valor em atraso')
    }

    if (subscriptionInfo.status === 'incomplete') {
      issues.push('Subscrição incompleta')
      fixes.push('Complete o processo de pagamento')
    }

    if (subscriptionInfo.lastPaymentFailed) {
      issues.push('Último pagamento falhado')
      fixes.push('Verifique o método de pagamento e tente novamente')
    }

    if (subscriptionInfo.cancelAtPeriodEnd) {
      issues.push('Subscrição será cancelada no fim do período')
      fixes.push('Reative a subscrição se desejar continuar')
    }

    return {
      healthy: issues.length === 0,
      issues,
      fixes
    }
  } catch (error) {
    return {
      healthy: false,
      issues: ['Erro ao verificar estado da subscrição'],
      fixes: ['Contacte o suporte técnico']
    }
  }
}

// Get subscription analytics for dashboard
export const getSubscriptionAnalytics = async (userId: string): Promise<{
  totalSpent: number
  monthsActive: number
  calculationsThisMonth: number
  calculationsTotal: number
  avgCalculationsPerDay: number
  favoriteCalculator: string
  lastActivity: Date
}> => {
  try {
    // This would typically integrate with Stripe's analytics and your usage data
    // For now, return mock data structure
    
    const subscriptionInfo = await getUserSubscription(userId)
    const monthsActive = subscriptionInfo.currentPeriodStart 
      ? Math.round((new Date().getTime() - subscriptionInfo.currentPeriodStart.getTime()) / (30 * 24 * 60 * 60 * 1000))
      : 0

    return {
      totalSpent: monthsActive * subscriptionInfo.planPrice,
      monthsActive,
      calculationsThisMonth: 0, // Would come from usage tracking
      calculationsTotal: 0, // Would come from usage tracking
      avgCalculationsPerDay: 0, // Would come from usage tracking
      favoriteCalculator: 'sell-house', // Would come from usage analytics
      lastActivity: new Date()
    }
  } catch (error) {
    console.error('getSubscriptionAnalytics error:', error)
    return {
      totalSpent: 0,
      monthsActive: 0,
      calculationsThisMonth: 0,
      calculationsTotal: 0,
      avgCalculationsPerDay: 0,
      favoriteCalculator: '',
      lastActivity: new Date()
    }
  }
}

// Export constants and types
export type { SubscriptionInfo }
export { stripe }