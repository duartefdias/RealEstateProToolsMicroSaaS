import { createHash } from 'crypto'
import { UsageContext } from '@/types/calculator'

// Anonymous session configuration
export const ANONYMOUS_SESSION_CONFIG = {
  // Session expiry in milliseconds (24 hours)
  SESSION_EXPIRY: 24 * 60 * 60 * 1000,
  // Storage key for localStorage
  SESSION_STORAGE_KEY: 'rept_session',
  // Cookie name for server-side tracking
  SESSION_COOKIE_NAME: 'rept_session_id',
  // Daily usage limits
  DAILY_LIMITS: {
    anonymous: 5,
    free: 5,      // Same as anonymous but registered
    registered: 10,
    pro: Infinity
  },
  // Usage tracking table in Supabase
  USAGE_TABLE: 'usage_tracking',
  PROFILES_TABLE: 'profiles'
} as const

export interface AnonymousSession {
  sessionId: string
  ipAddress?: string
  userAgent?: string
  referrer?: string
  createdAt: Date
  lastActivity: Date
  fingerprint: string
  metadata: {
    country?: string
    region?: string
    city?: string
    timezone?: string
  }
}

export interface UsageRecord {
  id: string
  sessionId?: string
  userId?: string
  calculatorType: string
  ipAddress?: string
  userAgent?: string
  createdAt: Date
  metadata?: Record<string, any>
}

// Generate browser fingerprint for session tracking
export const generateBrowserFingerprint = (): string => {
  if (typeof window === 'undefined') {
    return ''
  }

  const components = [
    navigator.userAgent,
    navigator.language,
    (navigator as any).userAgentData?.platform || 'unknown',
    screen.width + 'x' + screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    navigator.cookieEnabled,
    navigator.doNotTrack || 'unspecified'
  ]

  const fingerprint = components.join('|')
  return createHash('sha256').update(fingerprint).digest('hex').substring(0, 16)
}

// Generate cryptographically secure session ID
export const generateSessionId = (): string => {
  if (typeof window === 'undefined') {
    return ''
  }

  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

// Get or create anonymous session
export const getOrCreateAnonymousSession = async (): Promise<AnonymousSession> => {
  if (typeof window === 'undefined') {
    throw new Error('Session tracking only available in browser environment')
  }

  // Try to get existing session from localStorage
  const existingSessionData = localStorage.getItem(ANONYMOUS_SESSION_CONFIG.SESSION_STORAGE_KEY)
  
  if (existingSessionData) {
    try {
      const session: AnonymousSession = JSON.parse(existingSessionData)
      session.createdAt = new Date(session.createdAt)
      session.lastActivity = new Date(session.lastActivity)

      // Check if session is still valid
      const now = new Date()
      const sessionAge = now.getTime() - session.createdAt.getTime()
      
      if (sessionAge < ANONYMOUS_SESSION_CONFIG.SESSION_EXPIRY) {
        // Update last activity and return existing session
        session.lastActivity = now
        localStorage.setItem(
          ANONYMOUS_SESSION_CONFIG.SESSION_STORAGE_KEY, 
          JSON.stringify(session)
        )
        return session
      }
    } catch (error) {
      console.warn('Failed to parse existing session data:', error)
    }
  }

  // Create new session
  const newSession: AnonymousSession = {
    sessionId: generateSessionId(),
    fingerprint: generateBrowserFingerprint(),
    createdAt: new Date(),
    lastActivity: new Date(),
    userAgent: navigator.userAgent,
    ...(document.referrer && { referrer: document.referrer }),
    metadata: {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    }
  }

  // Store in localStorage
  localStorage.setItem(
    ANONYMOUS_SESSION_CONFIG.SESSION_STORAGE_KEY, 
    JSON.stringify(newSession)
  )

  return newSession
}

// Get current session or null if none exists
export const getCurrentSession = (): AnonymousSession | null => {
  if (typeof window === 'undefined') {
    return null
  }

  const sessionData = localStorage.getItem(ANONYMOUS_SESSION_CONFIG.SESSION_STORAGE_KEY)
  if (!sessionData) {
    return null
  }

  try {
    const session: AnonymousSession = JSON.parse(sessionData)
    session.createdAt = new Date(session.createdAt)
    session.lastActivity = new Date(session.lastActivity)

    // Check if session is still valid
    const now = new Date()
    const sessionAge = now.getTime() - session.createdAt.getTime()
    
    if (sessionAge >= ANONYMOUS_SESSION_CONFIG.SESSION_EXPIRY) {
      // Session expired, remove it
      localStorage.removeItem(ANONYMOUS_SESSION_CONFIG.SESSION_STORAGE_KEY)
      return null
    }

    return session
  } catch (error) {
    console.warn('Failed to parse session data:', error)
    localStorage.removeItem(ANONYMOUS_SESSION_CONFIG.SESSION_STORAGE_KEY)
    return null
  }
}

// Clear current session
export const clearCurrentSession = (): void => {
  if (typeof window === 'undefined') {
    return
  }

  localStorage.removeItem(ANONYMOUS_SESSION_CONFIG.SESSION_STORAGE_KEY)
}

// Create usage context from session and request data
export const createUsageContext = async (
  ipAddress?: string
): Promise<UsageContext> => {
  let session: AnonymousSession | null = null
  
  try {
    session = getCurrentSession()
    if (!session) {
      session = await getOrCreateAnonymousSession()
    }
  } catch (error) {
    console.warn('Failed to create usage context:', error)
  }

  return {
    sessionId: session?.sessionId || 'fallback-' + Date.now(),
    ...(ipAddress && { ipAddress }),
    ...(session?.userAgent && { userAgent: session.userAgent }),
    ...(session?.referrer && { referrer: session.referrer })
  }
}

// Enhanced fingerprinting for fraud detection (server-side safe)
export const generateEnhancedFingerprint = (
  userAgent?: string,
  ipAddress?: string,
  acceptLanguage?: string,
  additionalHeaders?: Record<string, string>
): string => {
  const components = [
    userAgent || '',
    ipAddress || '',
    acceptLanguage || '',
    Object.entries(additionalHeaders || {})
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}:${value}`)
      .join(';')
  ]

  const fingerprint = components.join('|')
  return createHash('sha256').update(fingerprint).digest('hex').substring(0, 16)
}

// Session validation utilities
export const validateSessionIntegrity = (session: AnonymousSession): boolean => {
  // Basic validation checks
  if (!session.sessionId || !session.fingerprint || !session.createdAt) {
    return false
  }

  // Check session age
  const now = new Date()
  const sessionAge = now.getTime() - new Date(session.createdAt).getTime()
  if (sessionAge > ANONYMOUS_SESSION_CONFIG.SESSION_EXPIRY) {
    return false
  }

  // Validate fingerprint format (should be hex string)
  if (!/^[a-f0-9]+$/i.test(session.fingerprint)) {
    return false
  }

  return true
}

// Get session statistics
export const getSessionStats = (session: AnonymousSession) => {
  const now = new Date()
  const createdAt = new Date(session.createdAt)
  const lastActivity = new Date(session.lastActivity)

  return {
    ageMs: now.getTime() - createdAt.getTime(),
    ageDays: Math.floor((now.getTime() - createdAt.getTime()) / (24 * 60 * 60 * 1000)),
    idleMs: now.getTime() - lastActivity.getTime(),
    idleMinutes: Math.floor((now.getTime() - lastActivity.getTime()) / (60 * 1000)),
    isExpired: (now.getTime() - createdAt.getTime()) > ANONYMOUS_SESSION_CONFIG.SESSION_EXPIRY
  }
}

// Session migration for when users register
export const migrateAnonymousSession = async (userId: string): Promise<void> => {
  const session = getCurrentSession()
  if (!session) {
    return
  }

  // Store migration data for backend processing
  const migrationData = {
    sessionId: session.sessionId,
    userId,
    migratedAt: new Date(),
    originalFingerprint: session.fingerprint
  }

  // Store in localStorage temporarily for API call
  localStorage.setItem('rept_session_migration', JSON.stringify(migrationData))

  // Clear anonymous session since user is now authenticated
  clearCurrentSession()
}

// Detect suspicious session activity
export const detectSuspiciousActivity = (
  session: AnonymousSession,
  currentFingerprint: string,
  currentUserAgent?: string
): { suspicious: boolean; reasons: string[] } => {
  const reasons: string[] = []
  let suspicious = false

  // Fingerprint mismatch (could indicate session hijacking)
  if (session.fingerprint !== currentFingerprint) {
    suspicious = true
    reasons.push('Browser fingerprint mismatch')
  }

  // User agent change (could indicate session sharing)
  if (session.userAgent && currentUserAgent && session.userAgent !== currentUserAgent) {
    suspicious = true
    reasons.push('User agent changed during session')
  }

  // Session too old (could indicate stale session reuse)
  const sessionAge = new Date().getTime() - new Date(session.createdAt).getTime()
  if (sessionAge > ANONYMOUS_SESSION_CONFIG.SESSION_EXPIRY * 2) {
    suspicious = true
    reasons.push('Session unusually old')
  }

  return { suspicious, reasons }
}

// Cleanup expired sessions (client-side utility)
export const cleanupExpiredSessions = (): void => {
  const session = getCurrentSession()
  if (!session) {
    return
  }

  const stats = getSessionStats(session)
  if (stats.isExpired) {
    clearCurrentSession()
  }
}

// Rate limiting helper based on session
export const getRateLimitKey = (
  userId?: string,
  sessionId?: string,
  ipAddress?: string
): string => {
  if (userId) {
    return `user:${userId}`
  }
  if (sessionId) {
    return `session:${sessionId}`
  }
  if (ipAddress) {
    return `ip:${ipAddress}`
  }
  return `anonymous:${Date.now()}`
}

// Session configuration is already exported at the top

// Hook for React components
export const useAnonymousSession = () => {
  if (typeof window === 'undefined') {
    return { session: null, isLoading: true }
  }

  const [session, setSession] = React.useState<AnonymousSession | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    const initializeSession = async () => {
      try {
        const currentSession = await getOrCreateAnonymousSession()
        setSession(currentSession)
      } catch (error) {
        console.error('Failed to initialize anonymous session:', error)
        setSession(null)
      } finally {
        setIsLoading(false)
      }
    }

    initializeSession()
  }, [])

  const refreshSession = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const currentSession = await getOrCreateAnonymousSession()
      setSession(currentSession)
    } catch (error) {
      console.error('Failed to refresh session:', error)
      setSession(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { session, isLoading, refreshSession }
}

// Import React for the hook
import React from 'react'