import posthog from 'posthog-js'

// PostHog configuration
export const posthogConfig = {
  api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
  loaded: (posthog: any) => {
    if (process.env.NODE_ENV === 'development') {
      posthog.debug()
    }
  },
  capture_pageview: false, // We'll capture manually for better control
  capture_pageleave: true,
  enable_recording_console_log: true,
  session_recording: {
    maskAllInputs: false,
    maskInputOptions: {
      password: true,
      email: true,
    },
  },
}

// Initialize PostHog (to be called on the client side)
export const initPostHog = () => {
  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
  const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST

  if (typeof window !== 'undefined' && posthogKey) {
    posthog.init(posthogKey, {
      ...posthogConfig,
      api_host: posthogHost || posthogConfig.api_host,
    })
  }

  return posthog
}

// Get PostHog instance (safe for SSR)
export const getPostHog = () => {
  if (typeof window === 'undefined') {
    return null
  }
  return posthog
}

// User identification and properties
export const identifyUser = (email: string, properties: Record<string, any>) => {
  const ph = getPostHog()
  if (ph && email) {
    ph.identify(email, {
      email: email,
      user_id: properties.user_id, // Keep user_id as a property for reference
      subscription_tier: properties.subscription_tier,
      signup_date: properties.created_at,
      country: 'Portugal', // Default, can be detected
      preferred_language: properties.language || 'pt',
      ...properties,
    })
  }
}

// Page view tracking with calculator context
export const trackPageView = (page: string, properties: Record<string, any> = {}) => {
  const ph = getPostHog()
  if (ph) {
    ph.capture('$pageview', {
      $current_url: typeof window !== 'undefined' ? window.location.href : '',
      page_type: page.includes('/calculators/') ? 'calculator' : 'marketing',
      calculator_type: page.includes('/calculators/') ? page.split('/')[2] : null,
      ...properties,
    })
  }
}

// Conversion tracking with cohort analysis
export const trackConversion = (
  eventName: string,
  value?: number,
  properties: Record<string, any> = {}
) => {
  const ph = getPostHog()
  if (ph) {
    ph.capture(eventName, {
      conversion_value: value,
      timestamp: new Date().toISOString(),
      user_segment: properties.subscription_tier || 'anonymous',
      ...properties,
    })
  }
}

// Feature flag helper
export const useFeatureFlag = (flagKey: string): string | boolean | undefined => {
  const ph = getPostHog()
  return ph?.getFeatureFlag(flagKey)
}

// Conversion funnel tracking
export const trackConversionFunnel = (step: string, properties: Record<string, any>) => {
  const ph = getPostHog()
  if (ph) {
    ph.capture('conversion_funnel', {
      step,
      timestamp: new Date().toISOString(),
      ...properties,
    })
  }
}

// Calculator usage tracking
export const trackCalculatorUsage = (
  calculatorType: string,
  properties: Record<string, any> = {}
) => {
  const ph = getPostHog()
  if (ph) {
    ph.capture('calculator_used', {
      calculator_type: calculatorType,
      user_type: properties.user_type || 'anonymous',
      input_value_range: properties.input_value_range,
      location: properties.location,
      session_id: properties.session_id,
      ...properties,
    })
  }
}

// Usage limit tracking
export const trackUsageLimitReached = (properties: Record<string, any>) => {
  const ph = getPostHog()
  if (ph) {
    ph.capture('usage_limit_reached', {
      user_type: properties.user_type,
      calculator_type: properties.calculator_type,
      daily_usage: properties.daily_usage,
      time_of_day: new Date().getHours(),
      ...properties,
    })
  }
}

// Subscription tracking
export const trackSubscriptionEvent = (
  eventType: 'upgrade' | 'downgrade' | 'cancel' | 'renew',
  properties: Record<string, any>
) => {
  const ph = getPostHog()
  if (ph) {
    ph.capture(`subscription_${eventType}`, {
      from_tier: properties.from_tier,
      to_tier: properties.to_tier,
      trigger: properties.trigger,
      days_since_signup: properties.days_since_signup,
      ...properties,
    })
  }
}

// Payment tracking
export const trackPaymentEvent = (
  eventType: 'initiated' | 'completed' | 'failed',
  properties: Record<string, any>
) => {
  const ph = getPostHog()
  if (ph) {
    ph.capture(`payment_${eventType}`, {
      plan: properties.plan,
      amount: properties.amount,
      currency: properties.currency,
      payment_method: properties.payment_method,
      ...properties,
    })
  }
}

// User journey milestones
export const trackMilestone = (
  milestone: 'first_calculation' | 'email_signup' | 'second_visit' | 'payment_completed',
  properties: Record<string, any> = {}
) => {
  const ph = getPostHog()
  if (ph) {
    ph.capture('user_journey_milestone', {
      milestone,
      days_since_first_visit: properties.days_since_first_visit,
      total_calculations: properties.total_calculations,
      ...properties,
    })
  }
}

// Error tracking
export const trackError = (error: Error, context: Record<string, any> = {}) => {
  const ph = getPostHog()
  if (ph) {
    ph.capture('error_occurred', {
      error_message: error.message,
      error_stack: error.stack,
      error_name: error.name,
      context: JSON.stringify(context),
      timestamp: new Date().toISOString(),
    })
  }
}