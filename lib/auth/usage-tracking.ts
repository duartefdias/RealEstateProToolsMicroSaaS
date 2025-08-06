import { getProfile, getAnonymousUsage } from '../database'

export interface UsageCheck {
  allowed: boolean
  remaining: number
  used: number
  limit: number
  resetTime: Date
  requiresUpgrade: boolean
  userType: 'anonymous' | 'free' | 'registered' | 'pro'
}

export const checkUsageLimit = async (
  userId?: string,
  ipAddress?: string,
  sessionId?: string
): Promise<UsageCheck> => {
  if (userId) {
    // Check for registered users
    const profile = await getProfile(userId)
    
    if (!profile) {
      return {
        allowed: false,
        remaining: 0,
        used: 0,
        limit: 0,
        resetTime: new Date(),
        requiresUpgrade: true,
        userType: 'free',
      }
    }

    // Determine user type and limits
    let limit: number
    let userType: 'free' | 'registered' | 'pro'
    
    switch (profile.subscription_tier) {
      case 'pro':
        limit = Infinity
        userType = 'pro'
        break
      case 'registered':
        limit = 10
        userType = 'registered'
        break
      default:
        limit = 5
        userType = 'free'
        break
    }

    // Check if we need to reset daily usage
    const today = new Date().toISOString().split('T')[0]
    const lastReset = profile.last_calculation_reset.toISOString().split('T')[0]
    
    let currentUsage = profile.daily_calculations_used
    if (today !== lastReset) {
      currentUsage = 0 // Usage should be reset
    }

    const remaining = limit === Infinity ? Infinity : Math.max(0, limit - currentUsage)
    const allowed = remaining > 0

    return {
      allowed,
      remaining,
      used: currentUsage,
      limit,
      resetTime: getNextResetTime(),
      requiresUpgrade: !allowed && profile.subscription_tier !== 'pro',
      userType,
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

    const usage = await getAnonymousUsage(ipAddress, sessionId)
    const limit = 5
    const remaining = Math.max(0, limit - usage)
    
    return {
      allowed: remaining > 0,
      remaining,
      used: usage,
      limit,
      resetTime: getNextResetTime(),
      requiresUpgrade: !remaining,
      userType: 'anonymous',
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