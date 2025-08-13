import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { createClient } from '@/lib/auth/server'
import { subscriptionManager } from '@/lib/payments/subscription-manager'
import { createServerSupabaseClient } from '@/lib/database/supabase'
import { getClientIP, generateSessionId } from '@/lib/utils/client-ip'

export async function POST(request: NextRequest) {
  try {
    const headersList = await headers()
    const { calculatorType, userId, inputData, resultData } = await request.json()
    
    console.log('📈 [API /usage/increment] Request received')
    console.log('📈 [API /usage/increment] Calculator Type:', calculatorType)
    console.log('📈 [API /usage/increment] User ID:', userId)
    
    // Get client IP address for tracking
    const ipAddress = getClientIP(headersList)
    
    const sessionId = headersList.get('x-session-id') || 
                      generateSessionId(ipAddress, headersList.get('user-agent') || undefined)

    console.log('📈 [API /usage/increment] IP Address:', ipAddress)
    console.log('📈 [API /usage/increment] Session ID:', sessionId)
    console.log('📈 [API /usage/increment] User Agent:', headersList.get('user-agent')?.slice(0, 100))

    const supabase = createServerSupabaseClient()

    if (userId) {
      console.log('📈 [API /usage/increment] Processing registered user...')
      
      // For registered users - increment usage and track calculation
      const usageIncremented = await subscriptionManager.incrementUsage(userId)
      
      if (usageIncremented) {
        // Track the calculation
        const { error: insertError } = await supabase
          .from('calculations')
          .insert({
            user_id: userId,
            calculator_type: calculatorType,
            input_data: inputData || {},
            ip_address: ipAddress
          })
        
        if (insertError) {
          console.error('❌ [API /usage/increment] Error inserting calculation for registered user:', insertError)
        } else {
          console.log(`✅ [API /usage/increment] Calculation tracked for user ${userId}: ${calculatorType}`)
        }
      }

      return NextResponse.json({ success: usageIncremented })
    } else {
      console.log('📈 [API /usage/increment] Processing anonymous user...')
      
      // For anonymous users - track calculation using the database function
      const { data, error } = await supabase.rpc('track_anonymous_calculation', {
        ip_addr: ipAddress,
        session_id: sessionId,
        calculator_type: calculatorType,
        input_data: inputData || {}
      })

      if (error) {
        console.error('❌ [API /usage/increment] Error tracking anonymous calculation:', error)
        return NextResponse.json(
          { error: 'Failed to track anonymous calculation', details: error },
          { status: 500 }
        )
      }

      console.log(`✅ [API /usage/increment] Anonymous calculation tracked: ${calculatorType}`)
      console.log(`✅ [API /usage/increment] Calculation ID: ${data}`)
      return NextResponse.json({ success: true, calculationId: data })
    }

  } catch (error) {
    console.error('❌ [API /usage/increment] Error incrementing usage:', error)
    return NextResponse.json(
      { error: 'Failed to track calculation' },
      { status: 500 }
    )
  }
}