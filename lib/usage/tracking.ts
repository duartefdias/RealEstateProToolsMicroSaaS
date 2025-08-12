import { createClient } from '@supabase/supabase-js'
import { 
  CalculationType, 
  UserType, 
  UsageLimit, 
  UsageContext,
  BaseCalculationResult
} from '@/types/calculator'
import { 
  ANONYMOUS_SESSION_CONFIG,
  getRateLimitKey,
  createUsageContext
} from './session-tracking'

// Initialize Supabase client for usage tracking
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role for usage tracking
)

// Usage tracking interfaces
export interface UsageTrackingRecord {
  id?: string
  user_id?: string
  session_id?: string
  calculator_type: CalculationType
  input_data?: Record<string, any>
  result_data?: Record<string, any>
  ip_address?: string
  user_agent?: string
  referrer?: string
  calculation_time_ms?: number
  created_at?: string
  metadata?: {
    fingerprint?: string
    country?: string
    region?: string
    user_type: UserType
    tier_at_time: string
    calculation_success: boolean
  }
}

export interface DailyUsageStats {
  userId?: string
  sessionId?: string
  calculationType?: CalculationType
  dailyCount: number
  totalCount: number
  firstCalculationToday: Date
  lastCalculation: Date
  userType: UserType
  currentTier: string
}

// Daily usage cache for performance
const usageCache = new Map<string, {
  count: number
  resetTime: Date
  lastUpdated: Date
}>()

// Cache TTL in milliseconds (5 minutes)
const CACHE_TTL = 5 * 60 * 1000

// Get usage tracking record
export const recordCalculationUsage = async (
  calculatorType: CalculationType,
  userType: UserType,
  context: UsageContext,
  inputs?: Record<string, any>,
  result?: BaseCalculationResult,
  calculationTimeMs?: number,
  userId?: string
): Promise<UsageTrackingRecord> => {
  const timestamp = new Date()
  const country = await getCountryFromIP(context.ipAddress)
  
  const record: UsageTrackingRecord = {
    ...(userId && { user_id: userId }),
    ...(context.sessionId && { session_id: context.sessionId }),
    calculator_type: calculatorType,
    ...(inputs && { input_data: sanitizeInputData(inputs) }),
    ...(result && { result_data: sanitizeResultData(result) }),
    ...(context.ipAddress && { ip_address: context.ipAddress }),
    ...(context.userAgent && { user_agent: context.userAgent }),
    ...(context.referrer && { referrer: context.referrer }),
    ...(calculationTimeMs && { calculation_time_ms: calculationTimeMs }),
    created_at: timestamp.toISOString(),
    metadata: {
      user_type: userType,
      tier_at_time: userType,
      calculation_success: !!result,
      ...(country && { country }),
    }
  }

  try {
    // Insert usage record
    const { data, error } = await supabase
      .from(ANONYMOUS_SESSION_CONFIG.USAGE_TABLE)
      .insert([record])
      .select()
      .single()

    if (error) {
      console.error('Failed to record usage:', error)
      throw new Error(`Usage tracking failed: ${error.message}`)
    }

    // Update cache
    const cacheKey = getRateLimitKey(userId, context.sessionId, context.ipAddress)
    updateUsageCache(cacheKey)

    return data as UsageTrackingRecord
  } catch (error) {
    console.error('Usage recording error:', error)
    throw error
  }
}

// Get daily usage for user/session
export const getDailyUsage = async (
  userId?: string,
  sessionId?: string,
  ipAddress?: string
): Promise<DailyUsageStats> => {
  const cacheKey = getRateLimitKey(userId, sessionId, ipAddress)
  
  // Check cache first
  const cached = usageCache.get(cacheKey)
  if (cached && (Date.now() - cached.lastUpdated.getTime()) < CACHE_TTL) {
    return {
      ...(userId && { userId }),
      ...(sessionId && { sessionId }),
      dailyCount: cached.count,
      totalCount: cached.count, // Simplified for cache
      firstCalculationToday: cached.resetTime,
      lastCalculation: cached.lastUpdated,
      userType: userId ? 'registered' : 'anonymous', // Simplified
      currentTier: userId ? 'registered' : 'anonymous'
    }
  }

  const today = new Date()
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const endOfDay = new Date(startOfDay)
  endOfDay.setDate(endOfDay.getDate() + 1)

  try {
    let query = supabase
      .from(ANONYMOUS_SESSION_CONFIG.USAGE_TABLE)
      .select('*')
      .gte('created_at', startOfDay.toISOString())
      .lt('created_at', endOfDay.toISOString())

    // Filter by user ID, session ID, or IP address
    if (userId) {
      query = query.eq('user_id', userId)
    } else if (sessionId) {
      query = query.eq('session_id', sessionId)
    } else if (ipAddress) {
      query = query.eq('ip_address', ipAddress)
    }

    const { data, error } = await query.order('created_at', { ascending: true })

    if (error) {
      console.error('Failed to get daily usage:', error)
      throw new Error(`Usage lookup failed: ${error.message}`)
    }

    const records = data as UsageTrackingRecord[]
    
    // Get user type from latest record or determine from context
    let userType: UserType = 'anonymous'
    let currentTier = 'anonymous'
    
    if (userId) {
      const { data: profile } = await supabase
        .from(ANONYMOUS_SESSION_CONFIG.PROFILES_TABLE)
        .select('subscription_tier')
        .eq('id', userId)
        .single()
      
      userType = (profile?.subscription_tier as UserType) || 'free'
      currentTier = userType
    }

    const firstRecord = records[0]
    const lastRecord = records[records.length - 1]

    const stats: DailyUsageStats = {
      ...(userId && { userId }),
      ...(sessionId && { sessionId }),
      dailyCount: records.length,
      totalCount: records.length, // Could be enhanced to get all-time count
      firstCalculationToday: firstRecord?.created_at ? new Date(firstRecord.created_at) : new Date(),
      lastCalculation: lastRecord?.created_at ? new Date(lastRecord.created_at) : new Date(),
      userType,
      currentTier
    }

    // Update cache
    usageCache.set(cacheKey, {
      count: records.length,
      resetTime: startOfDay,
      lastUpdated: new Date()
    })

    return stats
  } catch (error) {
    console.error('Daily usage lookup error:', error)
    throw error
  }
}

// Check if user can perform calculation
export const checkUsageLimit = async (
  userType: UserType,
  userId?: string,
  sessionId?: string,
  ipAddress?: string
): Promise<UsageLimit> => {
  try {
    const dailyStats = await getDailyUsage(userId, sessionId, ipAddress)
    const dailyLimit = ANONYMOUS_SESSION_CONFIG.DAILY_LIMITS[userType]
    
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)

    const usageLimit: UsageLimit = {
      dailyLimit,
      currentUsage: dailyStats.dailyCount,
      canCalculate: dailyStats.dailyCount < dailyLimit,
      resetTime: tomorrow,
      userType,
      requiresUpgrade: dailyStats.dailyCount >= dailyLimit && userType !== 'pro',
      upgradeUrl: userType === 'anonymous' ? '/auth/signup' : '/pricing'
    }

    return usageLimit
  } catch (error) {
    console.error('Usage limit check error:', error)
    // Return safe defaults on error
    return {
      dailyLimit: 0,
      currentUsage: 999,
      canCalculate: false,
      resetTime: new Date(),
      userType,
      requiresUpgrade: true,
      upgradeUrl: '/pricing'
    }
  }
}

// Middleware for usage tracking and enforcement
export const withUsageTracking = async (
  calculatorType: CalculationType,
  userType: UserType,
  userId?: string,
  context?: UsageContext
) => {
  // Create usage context if not provided
  const usageContext = context || await createUsageContext()
  
  // Check usage limits before proceeding
  const usageLimit = await checkUsageLimit(
    userType,
    userId,
    usageContext.sessionId,
    usageContext.ipAddress
  )

  return {
    usageLimit,
    context: usageContext,
    // Function to record successful calculation
    recordUsage: async (
      inputs?: Record<string, any>,
      result?: BaseCalculationResult,
      calculationTimeMs?: number
    ) => {
      if (result) {
        return await recordCalculationUsage(
          calculatorType,
          userType,
          usageContext,
          inputs,
          result,
          calculationTimeMs,
          userId
        )
      }
    }
  }
}

// Get usage analytics for dashboard
export const getUsageAnalytics = async (
  userId: string,
  timeRange: 'day' | 'week' | 'month' = 'week'
): Promise<{
  totalCalculations: number
  calculationsByType: Record<CalculationType, number>
  dailyBreakdown: Array<{ date: string; count: number }>
  averageCalculationsPerDay: number
}> => {
  const now = new Date()
  let startDate: Date

  switch (timeRange) {
    case 'day':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      break
    case 'week':
      startDate = new Date(now)
      startDate.setDate(now.getDate() - 7)
      break
    case 'month':
      startDate = new Date(now)
      startDate.setDate(now.getDate() - 30)
      break
  }

  try {
    const { data, error } = await supabase
      .from(ANONYMOUS_SESSION_CONFIG.USAGE_TABLE)
      .select('calculator_type, created_at')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true })

    if (error) {
      throw new Error(`Analytics lookup failed: ${error.message}`)
    }

    const records = data as Array<{ calculator_type: CalculationType; created_at: string }>

    // Calculate by type
    const calculationsByType = records.reduce((acc, record) => {
      acc[record.calculator_type] = (acc[record.calculator_type] || 0) + 1
      return acc
    }, {} as Record<CalculationType, number>)

    // Calculate daily breakdown
    const dailyBreakdown: Array<{ date: string; count: number }> = []
    const dailyCounts: Record<string, number> = {}

    records.forEach(record => {
      if (record.created_at) {
        const date = new Date(record.created_at).toISOString().split('T')[0]
        if (date) {
          dailyCounts[date] = (dailyCounts[date] || 0) + 1
        }
      }
    })

    Object.entries(dailyCounts).forEach(([date, count]) => {
      dailyBreakdown.push({ date, count })
    })

    const totalDays = Math.max(1, Math.ceil((now.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)))
    const averageCalculationsPerDay = records.length / totalDays

    return {
      totalCalculations: records.length,
      calculationsByType,
      dailyBreakdown: dailyBreakdown.sort((a, b) => a.date.localeCompare(b.date)),
      averageCalculationsPerDay: Math.round(averageCalculationsPerDay * 100) / 100
    }
  } catch (error) {
    console.error('Usage analytics error:', error)
    throw error
  }
}

// Utility functions
const sanitizeInputData = (inputs: Record<string, any>): Record<string, any> => {
  // Remove sensitive data and limit size
  const sanitized = { ...inputs }
  
  // Remove potential PII
  delete sanitized.email
  delete sanitized.phone
  delete sanitized.name
  delete sanitized.address

  // Limit object size
  const serialized = JSON.stringify(sanitized)
  if (serialized.length > 5000) {
    return { _truncated: true, _originalSize: serialized.length }
  }

  return sanitized
}

const sanitizeResultData = (result: BaseCalculationResult): Record<string, any> => {
  // Store only essential result data for analytics
  return {
    totalAmount: result.totalAmount,
    netAmount: result.netAmount,
    calculatedAt: result.calculatedAt,
    breakdownCount: result.breakdown.length,
    hasRecommendations: (result.recommendations?.length || 0) > 0,
    disclaimerCount: result.disclaimers.length
  }
}

const updateUsageCache = (cacheKey: string): void => {
  const cached = usageCache.get(cacheKey)
  if (cached) {
    cached.count += 1
    cached.lastUpdated = new Date()
  }
}

const getCountryFromIP = async (ipAddress?: string): Promise<string | undefined> => {
  if (!ipAddress) return undefined
  
  // This would typically integrate with a GeoIP service
  // For now, return undefined - can be enhanced later
  return undefined
}

// Reset daily usage (for testing or manual resets)
export const resetDailyUsage = async (
  userId?: string,
  sessionId?: string
): Promise<void> => {
  const cacheKey = getRateLimitKey(userId, sessionId)
  usageCache.delete(cacheKey)
}

// Bulk usage cleanup (for scheduled tasks)
export const cleanupOldUsageRecords = async (
  daysToKeep: number = 90
): Promise<{ deletedCount: number }> => {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

  try {
    const { data, error } = await supabase
      .from(ANONYMOUS_SESSION_CONFIG.USAGE_TABLE)
      .delete()
      .lt('created_at', cutoffDate.toISOString())
      .select('id')

    if (error) {
      throw new Error(`Cleanup failed: ${error.message}`)
    }

    return { deletedCount: data?.length || 0 }
  } catch (error) {
    console.error('Usage cleanup error:', error)
    throw error
  }
}

// Export for testing
export { usageCache }