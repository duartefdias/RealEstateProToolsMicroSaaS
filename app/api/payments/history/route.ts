import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/auth/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch user's payment history
    const { data: payments, error } = await supabase
      .from('payment_history')
      .select(`
        id,
        stripe_payment_intent_id,
        amount,
        currency,
        status,
        description,
        created_at
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50) // Limit to last 50 payments

    if (error) {
      console.error('Error fetching payment history:', error)
      return NextResponse.json(
        { error: 'Failed to fetch payment history' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      payments: payments || [],
      count: payments?.length || 0
    })

  } catch (error) {
    console.error('Error in payment history API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}