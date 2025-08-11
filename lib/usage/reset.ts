import { createClient } from '@supabase/supabase-js'
import { UserType } from '@/types/calculator'
import { ANONYMOUS_SESSION_CONFIG } from './session-tracking'
import { usageCache } from './tracking'
import { rateLimitStore } from './enforcement'

// Initialize Supabase client for reset operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role for reset operations
)

// Daily reset configuration
export const RESET_CONFIG = {
  // Time to perform daily reset (UTC)
  RESET_HOUR: 0, // Midnight UTC
  RESET_MINUTE: 0,
  // Grace period before hard reset (minutes)
  GRACE_PERIOD_MINUTES: 5,
  // Batch size for processing resets
  BATCH_SIZE: 1000,
  // Retention period for usage records (days)
  USAGE_RETENTION_DAYS: 90
} as const

export interface ResetResult {
  success: boolean
  affectedUsers: number
  affectedSessions: number
  cacheCleared: boolean
  rateLimitCleared: boolean
  errors: string[]
  timestamp: Date
  executionTimeMs: number
}

export interface UserResetInfo {
  userId: string
  userType: UserType
  previousUsage: number
  newLimit: number
  lastReset: Date
}

// Main daily reset function
export const performDailyReset = async (): Promise<ResetResult> => {
  const startTime = Date.now()
  const timestamp = new Date()
  const errors: string[] = []
  let affectedUsers = 0
  let affectedSessions = 0

  console.log('Starting daily usage reset at', timestamp.toISOString())

  try {
    // Step 1: Clear in-memory caches
    const cacheCleared = clearUsageCaches()
    
    // Step 2: Reset user profile counters
    const userResetResult = await resetUserProfileCounters()
    affectedUsers = userResetResult.affectedCount
    
    if (userResetResult.errors.length > 0) {
      errors.push(...userResetResult.errors)
    }

    // Step 3: Clean up old usage records (optional maintenance)
    const cleanupResult = await cleanupOldUsageRecords()
    
    if (cleanupResult.errors.length > 0) {
      errors.push(...cleanupResult.errors)
    }

    // Step 4: Clear rate limiting stores
    const rateLimitCleared = clearRateLimitStores()

    console.log(`Daily reset completed. Users: ${affectedUsers}, Sessions: ${affectedSessions}, Errors: ${errors.length}`)

    return {
      success: errors.length === 0,
      affectedUsers,
      affectedSessions,
      cacheCleared,
      rateLimitCleared,
      errors,
      timestamp,
      executionTimeMs: Date.now() - startTime
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Daily reset failed:', error)
    
    return {
      success: false,
      affectedUsers,
      affectedSessions,
      cacheCleared: false,
      rateLimitCleared: false,
      errors: [...errors, `Critical error: ${errorMessage}`],
      timestamp,
      executionTimeMs: Date.now() - startTime
    }
  }
}

// Reset user profile daily counters
const resetUserProfileCounters = async (): Promise<{
  affectedCount: number
  errors: string[]
}> => {
  const errors: string[] = []
  let affectedCount = 0

  try {
    const today = new Date().toISOString().split('T')[0]

    // Update all user profiles to reset daily counters
    const { data, error } = await supabase
      .from(ANONYMOUS_SESSION_CONFIG.PROFILES_TABLE)
      .update({
        daily_calculations_used: 0,
        last_calculation_reset: today
      })
      .neq('last_calculation_reset', today) // Only update if not already reset today
      .select('id')

    if (error) {
      errors.push(`Profile reset error: ${error.message}`)
    } else {
      affectedCount = data?.length || 0
      console.log(`Reset daily counters for ${affectedCount} user profiles`)
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    errors.push(`Profile reset exception: ${errorMessage}`)
  }

  return { affectedCount, errors }
}

// Clean up old usage records to manage database size
const cleanupOldUsageRecords = async (): Promise<{
  deletedCount: number
  errors: string[]
}> => {
  const errors: string[] = []
  let totalDeleted = 0

  try {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - RESET_CONFIG.USAGE_RETENTION_DAYS)

    // Delete in batches to avoid overwhelming the database
    let hasMoreRecords = true
    
    while (hasMoreRecords) {
      const { data, error } = await supabase
        .from(ANONYMOUS_SESSION_CONFIG.USAGE_TABLE)
        .delete()
        .lt('created_at', cutoffDate.toISOString())
        .limit(RESET_CONFIG.BATCH_SIZE)
        .select('id')

      if (error) {
        errors.push(`Cleanup error: ${error.message}`)
        break
      }

      const deletedCount = data?.length || 0
      totalDeleted += deletedCount
      hasMoreRecords = deletedCount === RESET_CONFIG.BATCH_SIZE

      // Small delay between batches
      if (hasMoreRecords) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    console.log(`Cleaned up ${totalDeleted} old usage records`)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    errors.push(`Cleanup exception: ${errorMessage}`)
  }

  return { deletedCount: totalDeleted, errors }
}

// Clear in-memory usage caches
const clearUsageCaches = (): boolean => {
  try {
    usageCache.clear()
    console.log('Cleared usage cache')
    return true
  } catch (error) {
    console.error('Failed to clear usage cache:', error)
    return false
  }
}

// Clear rate limiting stores
const clearRateLimitStores = (): boolean => {
  try {
    rateLimitStore.clear()
    console.log('Cleared rate limit stores')
    return true
  } catch (error) {
    console.error('Failed to clear rate limit stores:', error)
    return false
  }
}

// Selective reset for specific user (for manual overrides)
export const resetUserUsage = async (userId: string): Promise<{
  success: boolean
  previousUsage: number
  newLimit: number
  error?: string
}> => {
  try {
    // Get current usage
    const { data: profile, error: fetchError } = await supabase
      .from(ANONYMOUS_SESSION_CONFIG.PROFILES_TABLE)
      .select('daily_calculations_used, subscription_tier')
      .eq('id', userId)
      .single()

    if (fetchError) {
      return {
        success: false,
        previousUsage: 0,
        newLimit: 0,
        error: `Failed to fetch user profile: ${fetchError.message}`
      }
    }

    const previousUsage = profile.daily_calculations_used || 0
    const userType = (profile.subscription_tier as UserType) || 'free'
    const newLimit = ANONYMOUS_SESSION_CONFIG.DAILY_LIMITS[userType]

    // Reset user's daily usage
    const today = new Date().toISOString().split('T')[0]
    const { error: updateError } = await supabase
      .from(ANONYMOUS_SESSION_CONFIG.PROFILES_TABLE)
      .update({
        daily_calculations_used: 0,
        last_calculation_reset: today
      })
      .eq('id', userId)

    if (updateError) {
      return {
        success: false,
        previousUsage,
        newLimit,
        error: `Failed to reset user usage: ${updateError.message}`
      }
    }

    // Clear user's cache
    const userCacheKeys = Array.from(usageCache.keys()).filter(key => key.includes(`user:${userId}`))
    userCacheKeys.forEach(key => usageCache.delete(key))

    console.log(`Manual reset for user ${userId}: ${previousUsage} -> 0`)

    return {
      success: true,
      previousUsage,
      newLimit
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return {
      success: false,
      previousUsage: 0,
      newLimit: 0,
      error: errorMessage
    }
  }
}

// Check if daily reset is needed
export const isDailyResetNeeded = async (): Promise<{
  needed: boolean
  lastResetDate?: string
  currentDate: string
  reason?: string
}> => {
  const currentDate = new Date().toISOString().split('T')[0]

  try {
    // Check if we have any profiles that haven't been reset today
    const { data, error } = await supabase
      .from(ANONYMOUS_SESSION_CONFIG.PROFILES_TABLE)
      .select('last_calculation_reset')
      .neq('last_calculation_reset', currentDate)
      .limit(1)

    if (error) {
      return {
        needed: true, // Assume reset is needed if we can't check
        currentDate,
        reason: `Database check failed: ${error.message}`
      }
    }

    const needed = (data?.length || 0) > 0
    const lastResetDate = data?.[0]?.last_calculation_reset

    return {
      needed,
      lastResetDate,
      currentDate,
      reason: needed ? 'Users found with outdated reset dates' : 'All users up to date'
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return {
      needed: true,
      currentDate,
      reason: `Exception during check: ${errorMessage}`
    }
  }
}

// Get reset statistics for monitoring
export const getResetStatistics = async (): Promise<{
  totalUsers: number
  usersResetToday: number
  totalUsageRecords: number
  oldestUsageRecord?: string
  averageUsagePerUser: number
  cacheSize: number
  rateLimitStoreSize: number
}> => {
  const currentDate = new Date().toISOString().split('T')[0]

  try {
    // Get user statistics
    const { data: users, error: userError } = await supabase
      .from(ANONYMOUS_SESSION_CONFIG.PROFILES_TABLE)
      .select('daily_calculations_used, last_calculation_reset')

    if (userError) {
      throw new Error(`User stats error: ${userError.message}`)
    }

    const totalUsers = users?.length || 0
    const usersResetToday = users?.filter(u => u.last_calculation_reset === currentDate).length || 0
    const totalUsage = users?.reduce((sum, u) => sum + (u.daily_calculations_used || 0), 0) || 0
    const averageUsagePerUser = totalUsers > 0 ? totalUsage / totalUsers : 0

    // Get usage record statistics
    const { data: usageStats, error: usageError } = await supabase
      .from(ANONYMOUS_SESSION_CONFIG.USAGE_TABLE)
      .select('created_at')
      .order('created_at', { ascending: true })
      .limit(1)

    if (usageError) {
      console.warn('Usage stats error:', usageError.message)
    }

    const { count: totalUsageRecords } = await supabase
      .from(ANONYMOUS_SESSION_CONFIG.USAGE_TABLE)
      .select('*', { count: 'exact', head: true })

    return {
      totalUsers,
      usersResetToday,
      totalUsageRecords: totalUsageRecords || 0,
      oldestUsageRecord: usageStats?.[0]?.created_at,
      averageUsagePerUser: Math.round(averageUsagePerUser * 100) / 100,
      cacheSize: usageCache.size,
      rateLimitStoreSize: rateLimitStore.size
    }
  } catch (error) {
    console.error('Failed to get reset statistics:', error)
    
    return {
      totalUsers: 0,
      usersResetToday: 0,
      totalUsageRecords: 0,
      averageUsagePerUser: 0,
      cacheSize: usageCache.size,
      rateLimitStoreSize: rateLimitStore.size
    }
  }
}

// Schedule daily reset (for cron jobs or scheduled functions)
export const scheduleDailyReset = (): {
  nextResetTime: Date
  timeUntilReset: number
  scheduleInfo: string
} => {
  const now = new Date()
  const nextReset = new Date()
  
  // Set to next midnight UTC
  nextReset.setUTCHours(RESET_CONFIG.RESET_HOUR, RESET_CONFIG.RESET_MINUTE, 0, 0)
  
  // If we've already passed today's reset time, schedule for tomorrow
  if (nextReset <= now) {
    nextReset.setUTCDate(nextReset.getUTCDate() + 1)
  }

  const timeUntilReset = nextReset.getTime() - now.getTime()

  return {
    nextResetTime: nextReset,
    timeUntilReset,
    scheduleInfo: `Next reset at ${nextReset.toISOString()} (in ${Math.round(timeUntilReset / 1000 / 60)} minutes)`
  }
}

// Force reset (emergency use only)
export const forceCompleteReset = async (): Promise<ResetResult> => {
  console.warn('FORCE RESET: Performing emergency complete reset')
  
  const result = await performDailyReset()
  
  // Additional force operations
  try {
    // Clear ALL caches aggressively
    usageCache.clear()
    rateLimitStore.clear()
    
    console.warn('FORCE RESET: Completed emergency reset')
  } catch (error) {
    console.error('FORCE RESET: Error during force reset:', error)
    result.errors.push(`Force reset error: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  return result
}