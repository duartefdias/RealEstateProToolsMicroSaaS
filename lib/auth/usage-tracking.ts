import { createServerSupabaseClient } from '../database/supabase'
import { subscriptionManager } from '../payments/subscription-manager'

export interface UsageCheck {
  allowed: boolean
  remaining: number
  used: number
  limit: number
  resetTime: Date
  requiresUpgrade: boolean
  userType: 'anonymous' | 'free' | 'registered' | 'pro'
  checkoutUrl?: string
}

export const checkUsageLimit = async (
  userId?: string,
  ipAddress?: string,
  sessionId?: string
): Promise<UsageCheck> => {
  const supabase = createServerSupabaseClient()

  if (userId) {
    // For registered users, use the subscription manager
    try {
      const usageCheck = await subscriptionManager.checkUsageLimit(userId)
      
      let userType: 'free' | 'registered' | 'pro'
      switch (usageCheck.currentTier.id) {
        case 'pro':
          userType = 'pro'
          break
        case 'registered':
          userType = 'registered'
          break
        default:
          userType = 'free'
          break
      }

      return {
        allowed: usageCheck.allowed,
        remaining: usageCheck.remaining === Infinity ? Infinity : usageCheck.remaining,
        used: 0, // This would need to be fetched from the profile
        limit: usageCheck.currentTier.limits.dailyCalculations,
        resetTime: usageCheck.resetTime,
        requiresUpgrade: usageCheck.requiresUpgrade,
        userType,
        checkoutUrl: usageCheck.checkoutUrl
      }
    } catch (error) {
      console.error('Error checking user usage limit:', error)
      return {
        allowed: false,
        remaining: 0,
        used: 0,
        limit: 0,
        resetTime: getNextResetTime(),
        requiresUpgrade: true,
        userType: 'free',
      }
    }
  } else {
    // Check for anonymous users
    if (!ipAddress || !sessionId) {
      return {
        allowed: false,
        remaining: 0,
        used: 0,
        limit: 5,
        resetTime: getNextResetTime(),
        requiresUpgrade: true,
        userType: 'anonymous',
      }
    }

    try {
      const { data: usage } = await supabase.rpc('get_anonymous_usage', {
        ip_addr: ipAddress,
        session_id: sessionId
      })

      const limit = 5
      const currentUsage = usage || 0
      const remaining = Math.max(0, limit - currentUsage)
      
      return {
        allowed: remaining > 0,
        remaining,
        used: currentUsage,
        limit,
        resetTime: getNextResetTime(),
        requiresUpgrade: remaining === 0,
        userType: 'anonymous',
      }
    } catch (error) {
      console.error('Error checking anonymous usage:', error)
      // Return safe defaults
      return {
        allowed: false,
        remaining: 0,
        used: 5,
        limit: 5,
        resetTime: getNextResetTime(),
        requiresUpgrade: true,
        userType: 'anonymous',
      }
    }
  }
}

export const getNextResetTime = (): Date => {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)
  return tomorrow
}

export const getUsageLimitMessage = (usageCheck: UsageCheck): string => {
  if (usageCheck.allowed) {
    if (usageCheck.limit === Infinity) {
      return 'Unlimited calculations remaining'
    }
    return `${usageCheck.remaining} calculations remaining today`
  }

  switch (usageCheck.userType) {
    case 'anonymous':
      return 'Daily limit reached. Sign up to get more calculations!'
    case 'free':
      return 'Daily limit reached. Upgrade to get more calculations!'
    case 'registered':
      return 'Daily limit reached. Upgrade to Pro for unlimited calculations!'
    default:
      return 'Daily limit reached. Please try again tomorrow.'
  }
}

export const canPerformCalculation = async (
  userId?: string,
  ipAddress?: string,
  sessionId?: string
): Promise<{ can: boolean; message: string; usageCheck: UsageCheck }> => {
  const usageCheck = await checkUsageLimit(userId, ipAddress, sessionId)
  
  return {
    can: usageCheck.allowed,
    message: getUsageLimitMessage(usageCheck),
    usageCheck,
  }
}