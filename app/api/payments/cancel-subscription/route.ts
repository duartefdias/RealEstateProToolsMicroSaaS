import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/auth/server'
import { subscriptionManager } from '@/lib/payments/subscription-manager'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { reason } = await request.json()

    const success = await subscriptionManager.cancelSubscription(
      session.user.id,
      reason
    )

    if (!success) {
      return NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 400 })
    }

    console.log('🔐 Subscription canceled for user:', session.user.id)

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error canceling subscription:', error)
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    )
  }
}