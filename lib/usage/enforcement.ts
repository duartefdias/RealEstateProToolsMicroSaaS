import { UserType, UsageLimit, CalculationType } from '@/types/calculator'
import { checkUsageLimit, withUsageTracking } from './tracking'
import { createUsageContext, ANONYMOUS_SESSION_CONFIG } from './session-tracking'

// Enforcement results
export interface EnforcementResult {
  allowed: boolean
  reason?: string
  usageInfo: UsageLimit
  suggestedAction?: {
    type: 'upgrade' | 'wait' | 'register'
    url: string
    message: string
  }
  blockingModal?: {
    title: string
    description: string
    ctaText: string
    ctaUrl: string
    waitTime?: string
  }
}

export interface TierAccess {
  hasAccess: boolean
  requiredTier: UserType
  currentTier: UserType
  upgradeRequired: boolean
  upgradeUrl: string
  message: string
}

// Rate limiting configuration
const RATE_LIMITS = {
  // Requests per minute per user/session
  perMinute: {
    anonymous: 3,
    free: 3,
    registered: 5,
    pro: 10
  },
  // Requests per hour per user/session
  perHour: {
    anonymous: 10,
    free: 10,
    registered: 20,
    pro: 100
  }
} as const

// In-memory rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, Array<{ timestamp: number; count: number }>>()

// Main usage enforcement function
export const enforceUsageLimit = async (
  calculatorType: CalculationType,
  userType: UserType,
  userId?: string,
  sessionId?: string,
  ipAddress?: string
): Promise<EnforcementResult> => {
  try {
    // Check daily usage limit
    const usageInfo = await checkUsageLimit(userType, userId, sessionId, ipAddress)
    
    // Check rate limiting
    const rateLimitResult = checkRateLimit(userType, userId || sessionId || ipAddress || 'unknown')
    
    if (!rateLimitResult.allowed) {
      return {
        allowed: false,
        reason: 'rate_limit_exceeded',
        usageInfo,
        suggestedAction: {
          type: 'wait',
          url: '#',
          message: `Muitas tentativas. Aguarde ${Math.ceil(rateLimitResult.waitTimeMs! / 60000)} minutos.`
        }
      }
    }

    // Check daily limit
    if (!usageInfo.canCalculate) {
      const timeUntilReset = getTimeUntilReset(usageInfo.resetTime)
      
      return {
        allowed: false,
        reason: 'daily_limit_exceeded',
        usageInfo,
        suggestedAction: {
          type: userType === 'anonymous' ? 'register' : 'upgrade',
          url: usageInfo.upgradeUrl || '/pricing',
          message: userType === 'anonymous' 
            ? 'Registe-se gratuitamente para mais cálculos'
            : 'Faça upgrade para cálculos ilimitados'
        },
        blockingModal: {
          title: 'Limite Diário Atingido',
          description: `Já utilizou ${usageInfo.currentUsage} de ${usageInfo.dailyLimit} cálculos hoje. ${
            userType === 'pro' ? 'Contacte o suporte se precisar de mais recursos.' : 
            userType === 'anonymous' ? 'Registe-se gratuitamente para mais cálculos ou faça upgrade para uso ilimitado.' :
            'Faça upgrade para o plano Pro para cálculos ilimitados.'
          }`,
          ctaText: userType === 'anonymous' ? 'Registar Grátis' : 'Ver Planos Pro',
          ctaUrl: usageInfo.upgradeUrl || '/pricing',
          waitTime: `O limite reinicia em ${timeUntilReset}`
        }
      }
    }

    // Usage allowed
    return {
      allowed: true,
      usageInfo
    }
  } catch (error) {
    console.error('Usage enforcement error:', error)
    
    // Fail safely - allow usage but log the error
    return {
      allowed: true,
      reason: 'enforcement_error',
      usageInfo: {
        dailyLimit: 1,
        currentUsage: 0,
        canCalculate: true,
        resetTime: new Date(),
        userType,
        requiresUpgrade: false
      }
    }
  }
}

// Check tier-based access to calculators
export const checkTierAccess = (
  calculatorType: CalculationType,
  userType: UserType,
  requiredTier: 'free' | 'registered' | 'pro' = 'free'
): TierAccess => {
  const tierLevels = {
    anonymous: -1,
    free: 0,
    registered: 1,
    pro: 2
  }

  const currentLevel = tierLevels[userType] ?? -1
  const requiredLevel = tierLevels[requiredTier] ?? 0

  const hasAccess = currentLevel >= requiredLevel
  const upgradeRequired = !hasAccess

  let upgradeUrl = '/pricing'
  let message = 'Acesso negado.'

  if (requiredTier === 'registered' && userType === 'anonymous') {
    upgradeUrl = '/auth/signup'
    message = 'Esta calculadora requer registo gratuito.'
  } else if (requiredTier === 'pro' && userType !== 'pro') {
    message = 'Esta calculadora requer subscrição Pro.'
  }

  return {
    hasAccess,
    requiredTier: requiredTier as UserType,
    currentTier: userType,
    upgradeRequired,
    upgradeUrl,
    message
  }
}

// Rate limiting check
const checkRateLimit = (
  userType: UserType,
  identifier: string
): { allowed: boolean; waitTimeMs?: number; remaining?: number } => {
  const now = Date.now()
  const perMinuteLimit = RATE_LIMITS.perMinute[userType]
  const perHourLimit = RATE_LIMITS.perHour[userType]

  // Clean old entries
  const keyMinute = `${identifier}:minute`
  const keyHour = `${identifier}:hour`

  let minuteRequests = rateLimitStore.get(keyMinute) || []
  let hourRequests = rateLimitStore.get(keyHour) || []

  // Remove entries older than 1 minute
  minuteRequests = minuteRequests.filter(req => now - req.timestamp < 60 * 1000)
  // Remove entries older than 1 hour
  hourRequests = hourRequests.filter(req => now - req.timestamp < 60 * 60 * 1000)

  // Check limits
  if (minuteRequests.length >= perMinuteLimit) {
    const oldestRequest = Math.min(...minuteRequests.map(r => r.timestamp))
    const waitTimeMs = (oldestRequest + 60 * 1000) - now
    return { allowed: false, waitTimeMs }
  }

  if (hourRequests.length >= perHourLimit) {
    const oldestRequest = Math.min(...hourRequests.map(r => r.timestamp))
    const waitTimeMs = (oldestRequest + 60 * 60 * 1000) - now
    return { allowed: false, waitTimeMs }
  }

  // Record this request
  minuteRequests.push({ timestamp: now, count: 1 })
  hourRequests.push({ timestamp: now, count: 1 })

  rateLimitStore.set(keyMinute, minuteRequests)
  rateLimitStore.set(keyHour, hourRequests)

  return { 
    allowed: true, 
    remaining: Math.min(
      perMinuteLimit - minuteRequests.length,
      perHourLimit - hourRequests.length
    )
  }
}

// Get user-friendly time until reset
const getTimeUntilReset = (resetTime: Date): string => {
  const now = new Date()
  const diffMs = resetTime.getTime() - now.getTime()
  
  if (diffMs <= 0) {
    return 'agora'
  }

  const hours = Math.floor(diffMs / (60 * 60 * 1000))
  const minutes = Math.floor((diffMs % (60 * 60 * 1000)) / (60 * 1000))

  if (hours > 0) {
    return `${hours}h ${minutes}min`
  } else {
    return `${minutes} minutos`
  }
}

// Enhanced enforcement with context
export const enforceWithContext = async (
  calculatorType: CalculationType,
  userType: UserType,
  userId?: string
): Promise<{
  enforcement: EnforcementResult
  context: any
  middleware: any
}> => {
  // Create usage context
  const context = await createUsageContext()
  
  // Get middleware with usage tracking
  const middleware = await withUsageTracking(
    calculatorType,
    userType,
    userId,
    context
  )

  // Enforce usage limits
  const enforcement = await enforceUsageLimit(
    calculatorType,
    userType,
    userId,
    context.sessionId,
    context.ipAddress
  )

  return {
    enforcement,
    context,
    middleware
  }
}

// Check if user is approaching limits (for warnings)
export const checkUsageWarnings = (usageInfo: UsageLimit): {
  shouldWarn: boolean
  warningType: 'approaching_limit' | 'rate_limit_soon' | 'upgrade_suggested' | null
  message: string
} => {
  const { dailyLimit, currentUsage, userType } = usageInfo
  
  // If user is close to daily limit (80% or higher)
  if (currentUsage / dailyLimit >= 0.8 && userType !== 'pro') {
    const remaining = dailyLimit - currentUsage
    return {
      shouldWarn: true,
      warningType: 'approaching_limit',
      message: `Restam apenas ${remaining} cálculos hoje. Considere fazer upgrade para uso ilimitado.`
    }
  }

  // If user has used 50% on free tier
  if (currentUsage / dailyLimit >= 0.5 && userType === 'anonymous') {
    return {
      shouldWarn: true,
      warningType: 'upgrade_suggested',
      message: 'Registe-se gratuitamente para dobrar o seu limite diário de cálculos.'
    }
  }

  return {
    shouldWarn: false,
    warningType: null,
    message: ''
  }
}

// Convert enforcement result to user-facing message
export const getEnforcementMessage = (result: EnforcementResult): string => {
  if (result.allowed) {
    const remaining = result.usageInfo.dailyLimit - result.usageInfo.currentUsage
    if (remaining <= 2 && result.usageInfo.userType !== 'pro') {
      return `Restam ${remaining} cálculos hoje.`
    }
    return ''
  }

  switch (result.reason) {
    case 'daily_limit_exceeded':
      return result.blockingModal?.description || 'Limite diário atingido.'
    case 'rate_limit_exceeded':
      return result.suggestedAction?.message || 'Muitas tentativas. Aguarde alguns minutos.'
    case 'tier_access_denied':
      return 'Esta funcionalidade requer upgrade.'
    default:
      return 'Acesso temporariamente indisponível.'
  }
}

// Get upgrade recommendations based on usage patterns
export const getUpgradeRecommendations = (
  usageInfo: UsageLimit,
  calculationsToday: number,
  calculationsThisWeek: number
): {
  shouldRecommendUpgrade: boolean
  recommendedTier: UserType
  reasons: string[]
  benefits: string[]
} => {
  const { userType, currentUsage, dailyLimit } = usageInfo
  
  if (userType === 'pro') {
    return {
      shouldRecommendUpgrade: false,
      recommendedTier: 'pro',
      reasons: [],
      benefits: []
    }
  }

  const reasons: string[] = []
  const benefits: string[] = []
  let shouldRecommendUpgrade = false
  let recommendedTier: UserType = 'registered'

  // Analyze usage patterns
  if (currentUsage >= dailyLimit) {
    shouldRecommendUpgrade = true
    reasons.push('Atingiu o limite diário')
  }

  if (calculationsThisWeek > dailyLimit * 5) {
    shouldRecommendUpgrade = true
    recommendedTier = 'pro'
    reasons.push('Utilização consistentemente alta')
  }

  if (userType === 'anonymous') {
    benefits.push('Duplicar limite diário (10 vs 5 cálculos)')
    benefits.push('Histórico de cálculos guardado')
    benefits.push('Acesso a funcionalidades adicionais')
    
    if (!shouldRecommendUpgrade && calculationsToday >= 3) {
      shouldRecommendUpgrade = true
      reasons.push('Utilizador ativo')
    }
  } else {
    benefits.push('Cálculos ilimitados')
    benefits.push('Gestão de clientes')
    benefits.push('Relatórios avançados')
    benefits.push('Exportação de dados')
    benefits.push('Suporte prioritário')
    recommendedTier = 'pro'
  }

  return {
    shouldRecommendUpgrade,
    recommendedTier,
    reasons,
    benefits
  }
}

// Cleanup rate limiting store
export const cleanupRateLimitStore = (): void => {
  const now = Date.now()
  const cutoff = now - (2 * 60 * 60 * 1000) // 2 hours ago

  for (const [key, requests] of rateLimitStore.entries()) {
    const filtered = requests.filter(req => now - req.timestamp < cutoff)
    if (filtered.length === 0) {
      rateLimitStore.delete(key)
    } else {
      rateLimitStore.set(key, filtered)
    }
  }
}

// Export for testing
export { rateLimitStore, RATE_LIMITS }