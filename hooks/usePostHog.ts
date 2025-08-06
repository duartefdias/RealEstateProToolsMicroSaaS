'use client'

import { useEffect, useState } from 'react'
import { getPostHog } from '@/lib/analytics/posthog'
import type posthog from 'posthog-js'

// Hook to get PostHog instance
export const usePostHog = (): typeof posthog | null => {
  const [ph, setPh] = useState<typeof posthog | null>(null)

  useEffect(() => {
    setPh(getPostHog())
  }, [])

  return ph
}

// Hook for feature flags
export const useFeatureFlag = (flagKey: string): string | boolean | undefined => {
  const posthog = usePostHog()
  const [flagValue, setFlagValue] = useState<string | boolean | undefined>(undefined)

  useEffect(() => {
    if (posthog) {
      const value = posthog.getFeatureFlag(flagKey)
      setFlagValue(value)

      // Listen for feature flag changes
      const handleFlagChange = () => {
        const newValue = posthog.getFeatureFlag(flagKey)
        setFlagValue(newValue)
      }

      posthog.onFeatureFlags(handleFlagChange)

      return () => {
        // PostHog doesn't have an off method in the current API
        // The listener is automatically cleaned up
      }
    }
  }, [posthog, flagKey])

  return flagValue
}

// Hook for tracking events
export const useTracking = () => {
  const posthog = usePostHog()

  const track = (eventName: string, properties?: Record<string, any>) => {
    if (posthog) {
      posthog.capture(eventName, properties)
    }
  }

  const identify = (userId: string, properties?: Record<string, any>) => {
    if (posthog) {
      posthog.identify(userId, properties)
    }
  }

  const alias = (alias: string) => {
    if (posthog) {
      posthog.alias(alias)
    }
  }

  const reset = () => {
    if (posthog) {
      posthog.reset()
    }
  }

  const setPersonProperties = (properties: Record<string, any>) => {
    if (posthog) {
      posthog.setPersonProperties(properties)
    }
  }

  return {
    track,
    identify,
    alias,
    reset,
    setPersonProperties,
    isLoaded: !!posthog,
  }
}

// Hook for A/B testing
export const useABTest = (
  flagKey: string,
  variants: string[]
): { variant: string | null; isLoading: boolean } => {
  const flagValue = useFeatureFlag(flagKey)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (flagValue !== undefined) {
      setIsLoading(false)
    }
  }, [flagValue])

  const variant = 
    typeof flagValue === 'string' && variants.includes(flagValue) 
      ? flagValue 
      : variants.includes('control') 
        ? 'control' 
        : variants[0] || null

  return { variant, isLoading }
}

// Hook for user identification
export const useUserIdentification = (user?: { 
  id: string
  email?: string
  subscription_tier?: string
  [key: string]: any
}) => {
  const { identify, setPersonProperties } = useTracking()

  useEffect(() => {
    if (user?.id) {
      identify(user.id, {
        email: user.email,
        subscription_tier: user.subscription_tier,
        signup_date: user.created_at,
        ...user,
      })
    }
  }, [user, identify])

  const updateUserProperties = (properties: Record<string, any>) => {
    setPersonProperties(properties)
  }

  return { updateUserProperties }
}