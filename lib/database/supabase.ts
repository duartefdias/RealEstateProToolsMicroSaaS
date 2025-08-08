// Re-export from the new auth client
export { createClient as createBrowserClient } from '@/lib/auth/client'

// Create the main browser client instance
import { createClient } from '@/lib/auth/client'
export const supabase = createClient()

// Create Supabase client for server-side operations (admin access)
export const createServerSupabaseClient = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!serviceRoleKey) {
    throw new Error('Missing Supabase service role key')
  }
  
  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    db: {
      schema: 'public',
    },
  })
}

// Helper function to handle Supabase errors
export const handleSupabaseError = (error: any) => {
  console.error('Supabase error:', error)
  
  if (error?.code === 'PGRST301') {
    return 'Resource not found'
  }
  
  if (error?.code === '23505') {
    return 'Resource already exists'
  }
  
  if (error?.code === '42501') {
    return 'Permission denied'
  }
  
  return error?.message || 'An unexpected error occurred'
}

// Type-safe query builders
export const createTypedSupabaseQuery = () => {
  return {
    profiles: () => supabase.from('profiles'),
    calculations: () => supabase.from('calculations'),
    clients: () => supabase.from('clients'),
    tasks: () => supabase.from('tasks'),
    page_views: () => supabase.from('page_views'),
    payment_history: () => supabase.from('payment_history'),
    subscription_events: () => supabase.from('subscription_events'),
  }
}

// Helper function to get current user ID
export async function getCurrentUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id || null
}

// Helper function to check if user is authenticated
export async function isAuthenticated(): Promise<boolean> {
  const userId = await getCurrentUserId()
  return userId !== null
}

// Helper function to get current user profile
export async function getCurrentUserProfile() {
  const userId = await getCurrentUserId()
  if (!userId) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error fetching user profile:', error)
    return null
  }

  return data
}

// Helper function to check subscription tier
export async function hasSubscriptionTier(tier: 'free' | 'registered' | 'pro' | 'admin'): Promise<boolean> {
  const profile = await getCurrentUserProfile()
  if (!profile) return false

  const tierHierarchy = { free: 0, registered: 1, pro: 2, admin: 3 }
  const userTierLevel = tierHierarchy[profile.subscription_tier as keyof typeof tierHierarchy] ?? 0
  const requiredTierLevel = tierHierarchy[tier]

  return userTierLevel >= requiredTierLevel
}

// Helper function to check if user can perform calculations
export async function canPerformCalculation(userId?: string, ipAddress?: string, sessionId?: string): Promise<{
  allowed: boolean
  remaining: number
  resetTime: Date
}> {
  if (userId) {
    // Authenticated user logic
    const profile = await getCurrentUserProfile()
    if (!profile) return { allowed: false, remaining: 0, resetTime: new Date() }

    const limit = profile.subscription_tier === 'pro' || profile.subscription_tier === 'admin' ? 
      Infinity : profile.subscription_tier === 'registered' ? 10 : 5

    const today = new Date().toISOString().split('T')[0]
    if (profile.last_calculation_reset !== today) {
      // Reset daily usage if needed
      await supabase
        .from('profiles')
        .update({
          daily_calculations_used: 0,
          last_calculation_reset: today
        })
        .eq('id', userId)
    }

    const remaining = limit === Infinity ? Infinity : Math.max(0, limit - profile.daily_calculations_used)
    const resetTime = new Date()
    resetTime.setDate(resetTime.getDate() + 1)
    resetTime.setHours(0, 0, 0, 0)

    return {
      allowed: profile.daily_calculations_used < limit,
      remaining,
      resetTime
    }
  } else if (ipAddress && sessionId) {
    // Anonymous user logic
    const { data } = await supabase
      .rpc('get_daily_calculation_count', {
        p_user_id: null,
        p_ip_address: ipAddress,
        p_session_id: sessionId
      })

    const count = data || 0
    const limit = 5
    const resetTime = new Date()
    resetTime.setDate(resetTime.getDate() + 1)
    resetTime.setHours(0, 0, 0, 0)

    return {
      allowed: count < limit,
      remaining: Math.max(0, limit - count),
      resetTime
    }
  }

  return { allowed: false, remaining: 0, resetTime: new Date() }
}

// Helper function to increment calculation usage
export async function incrementCalculationUsage(userId?: string): Promise<void> {
  if (!userId) return

  // Get current usage count
  const { data: profile } = await supabase
    .from('profiles')
    .select('daily_calculations_used')
    .eq('id', userId)
    .single()

  if (profile) {
    await supabase
      .from('profiles')
      .update({
        daily_calculations_used: profile.daily_calculations_used + 1
      })
      .eq('id', userId)
  }
}

// Helper function to record a calculation
export async function recordCalculation(data: {
  userId?: string
  calculatorType: string
  inputData: any
  resultData: any
  ipAddress?: string
  sessionId?: string
  userAgent?: string
  location?: string
  duration?: number
}) {
  const calculationData = {
    user_id: data.userId,
    calculator_type: data.calculatorType,
    input_data: data.inputData,
    result_data: data.resultData,
    ip_address: data.ipAddress,
    session_id: data.sessionId,
    user_agent: data.userAgent,
    location: data.location,
    calculation_duration_ms: data.duration,
  }

  const { error } = await supabase
    .from('calculations')
    .insert(calculationData)

  if (error) {
    console.error('Error recording calculation:', error)
  }

  // Increment usage for authenticated users
  if (data.userId) {
    await incrementCalculationUsage(data.userId)
  }
}

// Helper function to record page view
export async function recordPageView(data: {
  userId?: string
  pagePath: string
  pageTitle?: string
  referrer?: string
  userAgent?: string
  ipAddress: string
  sessionId: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  calculatorUsed?: string
}) {
  const pageViewData = {
    user_id: data.userId,
    page_path: data.pagePath,
    page_title: data.pageTitle,
    page_referrer: data.referrer,
    user_agent: data.userAgent,
    ip_address: data.ipAddress,
    session_id: data.sessionId,
    utm_source: data.utmSource,
    utm_medium: data.utmMedium,
    utm_campaign: data.utmCampaign,
    calculator_used: data.calculatorUsed,
  }

  const { error } = await supabase
    .from('page_views')
    .insert(pageViewData)

  if (error) {
    console.error('Error recording page view:', error)
  }
}

// Helper function to update overdue tasks
export async function updateOverdueTasks(): Promise<number> {
  try {
    const { data, error } = await supabase.rpc('update_overdue_tasks')
    
    if (error) {
      console.error('Error updating overdue tasks:', error)
      return 0
    }
    
    return data || 0
  } catch (err) {
    console.error('Error updating overdue tasks:', err)
    return 0
  }
}