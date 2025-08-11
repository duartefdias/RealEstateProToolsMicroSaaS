import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { createClient } from '@/lib/auth/server'
import { subscriptionManager } from '@/lib/payments/subscription-manager'
import { createServerSupabaseClient } from '@/lib/database/supabase'

export async function POST(request: NextRequest) {
  try {
    const headersList = await headers()
    const { calculatorType, userId, inputData, resultData } = await request.json()
    
    // Get IP address for tracking
    const ipAddress = headersList.get('x-forwarded-for') || 
                     headersList.get('x-real-ip') || 
                     '127.0.0.1'
    
    const sessionId = headersList.get('x-session-id') || 
                      `${ipAddress}-${Date.now()}`

    const supabase = createServerSupabaseClient()

    if (userId) {
      // For registered users - increment usage and track calculation
      const usageIncremented = await subscriptionManager.incrementUsage(userId)
      
      if (usageIncremented) {
        // Track the calculation
        await supabase
          .from('calculations')
          .insert({
            user_id: userId,
            calculator_type: calculatorType,
            input_data: inputData || {},
            result_data: resultData || {},
            ip_address: ipAddress
          })
        
        console.log(`📊 Calculation tracked for user ${userId}: ${calculatorType}`)
      }

      return NextResponse.json({ success: usageIncremented })
    } else {
      // For anonymous users - track calculation without usage increment
      const { data } = await supabase.rpc('track_anonymous_calculation', {
        ip_addr: ipAddress,
        session_id: sessionId,
        calculator_type: calculatorType,
        input_data: inputData || {},
        result_data: resultData || {}
      })

      console.log(`📊 Anonymous calculation tracked: ${calculatorType}`)
      return NextResponse.json({ success: true, calculationId: data })
    }

  } catch (error) {
    console.error('Error incrementing usage:', error)
    return NextResponse.json(
      { error: 'Failed to track calculation' },
      { status: 500 }
    )
  }
}