/**
 * Extract the real client IP address from various headers
 * This is crucial for proper anonymous user tracking
 */
export function getClientIP(headersList: Headers): string {
  // Try multiple headers for real IP (in order of preference)
  const xForwardedFor = headersList.get('x-forwarded-for')
  const xRealIP = headersList.get('x-real-ip')
  const cfConnectingIP = headersList.get('cf-connecting-ip') // Cloudflare
  const xClientIP = headersList.get('x-client-ip')
  const remoteAddr = headersList.get('remote-addr')
  
  // x-forwarded-for can contain multiple IPs (client, proxy1, proxy2, ...)
  // The first IP should be the original client IP
  if (xForwardedFor) {
    const ips = xForwardedFor.split(',').map(ip => ip.trim())
    const clientIP = ips[0]
    if (clientIP && !isLocalIP(clientIP)) {
      return clientIP
    }
  }
  
  // Try other headers
  if (cfConnectingIP && !isLocalIP(cfConnectingIP)) {
    return cfConnectingIP
  }
  if (xRealIP && !isLocalIP(xRealIP)) {
    return xRealIP
  }
  if (xClientIP && !isLocalIP(xClientIP)) {
    return xClientIP
  }
  if (remoteAddr && !isLocalIP(remoteAddr)) {
    return remoteAddr
  }
  
  // Fallback for local development: create unique identifier
  // In production, this should be the actual client IP from proxy headers
  
  // For local development, create a more stable identifier that's harder to game
  // but still respects privacy (no persistent cookies or localStorage)
  const userAgent = headersList.get('user-agent') || 'unknown'
  const acceptLanguage = headersList.get('accept-language') || 'en'
  const acceptEncoding = headersList.get('accept-encoding') || 'none'
  
  // Create browser fingerprint - this will be the same across tabs but different across browsers
  const browserFingerprint = `${userAgent}|${acceptLanguage}|${acceptEncoding}`
  
  // Use djb2 hash for consistent results
  let hash = 5381
  for (let i = 0; i < browserFingerprint.length; i++) {
    hash = ((hash << 5) + hash) + browserFingerprint.charCodeAt(i)
    hash = hash & hash // Convert to 32-bit integer
  }
  
  // Create a stable identifier for this browser session
  const hashStr = Math.abs(hash).toString(36)
  
  // For local dev, use "local" prefix. In production, this would be actual IP
  return `local-${hashStr}`
}

/**
 * Check if an IP address is a local/loopback address
 */
function isLocalIP(ip: string): boolean {
  if (!ip) return true
  
  // IPv4 local addresses
  if (ip === '127.0.0.1' || ip === 'localhost') return true
  if (ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) return true
  
  // IPv6 local addresses  
  if (ip === '::1' || ip === '::ffff:127.0.0.1') return true
  
  return false
}

/**
 * Generate a session ID for anonymous users
 * Uses client IP and a timestamp, but with some persistence
 */
export function generateSessionId(clientIP: string, userAgent?: string): string {
  // For better session persistence, we use:
  // - Client IP (already unique)
  // - Date and hour (so session persists for ~1 hour)
  // - Short user agent hash for extra uniqueness
  
  const hour = new Date().getHours().toString().padStart(2, '0')
  const date = new Date().toISOString().split('T')[0].replace(/-/g, '') // YYYYMMDD
  
  // Create a short hash from user agent if available
  let agentHash = '0'
  if (userAgent && userAgent.length > 10) {
    const hash = userAgent.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0)
      return a & a
    }, 5381)
    agentHash = Math.abs(hash).toString(36).slice(-3) // Last 3 characters
  }
  
  return `${clientIP}-${date}-${hour}h-${agentHash}`
}