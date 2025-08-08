import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { createClient } from '@/lib/auth/server'
import { checkUsageLimit } from '@/lib/auth/usage-tracking'

export async function POST(request: NextRequest) {
  try {
    const headersList = await headers()
    const { calculatorType, userId } = await request.json()
    
    // Get IP address and session info for anonymous users
    const ipAddress = headersList.get('x-forwarded-for') || 
                     headersList.get('x-real-ip') || 
                     request.ip || 
                     'unknown'
    
    // Generate session ID for anonymous users (you might want to use cookies)
    const sessionId = headersList.get('x-session-id') || 
                      `${ipAddress}-${Date.now()}`

    // Check usage limits
    const usageCheck = await checkUsageLimit(
      userId || undefined,
      ipAddress,
      sessionId
    )

    return NextResponse.json({
      allowed: usageCheck.allowed,
      remaining: usageCheck.remaining === Infinity ? -1 : usageCheck.remaining,
      used: usageCheck.used,
      limit: usageCheck.limit === Infinity ? -1 : usageCheck.limit,
      resetTime: usageCheck.resetTime.toISOString(),
      requiresUpgrade: usageCheck.requiresUpgrade,
      userType: usageCheck.userType,
      checkoutUrl: usageCheck.checkoutUrl
    })

  } catch (error) {
    console.error('Error checking usage limits:', error)
    return NextResponse.json(
      { error: 'Failed to check usage limits' },
      { status: 500 }
    )
  }
}