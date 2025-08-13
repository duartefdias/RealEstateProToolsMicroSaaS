import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { createClient } from '@/lib/auth/server'
import { checkUsageLimit } from '@/lib/auth/usage-tracking'
import { getClientIP, generateSessionId } from '@/lib/utils/client-ip'

export async function POST(request: NextRequest) {
  try {
    const headersList = await headers()
    const { calculatorType, userId } = await request.json()
    
    console.log('📊 [API /usage/check] Request received')
    console.log('📊 [API /usage/check] Calculator Type:', calculatorType)
    console.log('📊 [API /usage/check] User ID:', userId)
    
    // Get client IP address for tracking
    const ipAddress = getClientIP(headersList)
    
    // Generate session ID for anonymous users
    const sessionId = headersList.get('x-session-id') || 
                      generateSessionId(ipAddress, headersList.get('user-agent') || undefined)
    
    console.log('📊 [API /usage/check] IP Address:', ipAddress)
    console.log('📊 [API /usage/check] Session ID:', sessionId)

    // Check usage limits
    const usageCheck = await checkUsageLimit(
      userId || undefined,
      ipAddress,
      sessionId
    )

    console.log('📊 [API /usage/check] Usage check result:', usageCheck)

    const response = {
      allowed: usageCheck.allowed,
      remaining: usageCheck.remaining === Infinity ? -1 : usageCheck.remaining,
      used: usageCheck.used,
      limit: usageCheck.limit === Infinity ? -1 : usageCheck.limit,
      resetTime: usageCheck.resetTime.toISOString(),
      requiresUpgrade: usageCheck.requiresUpgrade,
      userType: usageCheck.userType,
      checkoutUrl: usageCheck.checkoutUrl
    }

    console.log('📊 [API /usage/check] Response:', response)
    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ [API /usage/check] Error checking usage limits:', error)
    return NextResponse.json(
      { error: 'Failed to check usage limits' },
      { status: 500 }
    )
  }
}