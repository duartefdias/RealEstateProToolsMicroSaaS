export interface SubscriptionTier {
  id: 'free' | 'registered' | 'pro'
  name: string
  price: number
  currency: string
  interval: 'month' | 'year' | null
  stripePriceId: string | null
  features: string[]
  limits: {
    dailyCalculations: number
    clientManagement: boolean
    advancedReporting: boolean
    prioritySupport: boolean
    exportFunctionality: boolean
  }
}

export interface StripeSubscription {
  id: string
  customerId: string
  status: 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'trialing' | 'unpaid'
  priceId: string
  currentPeriodStart: Date
  currentPeriodEnd: Date
  cancelAtPeriodEnd: boolean
  canceledAt: Date | null
  trialStart: Date | null
  trialEnd: Date | null
  metadata: Record<string, string>
}

export interface StripeCustomer {
  id: string
  email: string
  name: string | null
  created: Date
  metadata: Record<string, string>
}

export interface PaymentHistory {
  id: string
  userId: string
  stripePaymentIntentId: string
  amount: number
  currency: string
  status: 'succeeded' | 'failed' | 'canceled' | 'processing'
  description: string
  createdAt: Date
}

export interface SubscriptionEvent {
  id: string
  userId: string
  stripeSubscriptionId: string
  eventType: 'created' | 'updated' | 'canceled' | 'renewed' | 'payment_failed' | 'payment_succeeded'
  oldStatus: string | null
  newStatus: string
  metadata: Record<string, any>
  createdAt: Date
}

export interface UsageLimitCheck {
  allowed: boolean
  remaining: number
  resetTime: Date
  requiresUpgrade: boolean
  checkoutUrl?: string
  currentTier: SubscriptionTier
}

export interface CheckoutSessionData {
  sessionId: string
  url: string
  customerId: string
  priceId: string
  successUrl: string
  cancelUrl: string
}

export interface WebhookEvent {
  id: string
  type: string
  data: {
    object: any
  }
  created: number
}

export interface SubscriptionManagement {
  subscription: StripeSubscription | null
  customer: StripeCustomer | null
  paymentHistory: PaymentHistory[]
  canUpgrade: boolean
  canDowngrade: boolean
  canCancel: boolean
  canReactivate: boolean
  nextBillingDate: Date | null
  currentUsage: {
    calculationsUsed: number
    calculationsLimit: number
    resetDate: Date
  }
}

export interface PricingPlan {
  tier: SubscriptionTier
  highlighted: boolean
  ctaText: string
  comingSoon?: boolean
}