import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/auth/server'
import { subscriptionManager } from '@/lib/payments/subscription-manager'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const subscriptionData = await subscriptionManager.getSubscriptionManagement(session.user.id)

    if (!subscriptionData) {
      return NextResponse.json({ error: 'Failed to fetch subscription data' }, { status: 404 })
    }

    return NextResponse.json(subscriptionData)

  } catch (error) {
    console.error('Error fetching subscription management data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscription data' },
      { status: 500 }
    )
  }
}