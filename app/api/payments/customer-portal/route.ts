import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/auth/server'
import { stripe, STRIPE_CONFIG } from '@/lib/payments/stripe-server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile with Stripe customer ID
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (!profile?.stripe_customer_id) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 404 })
    }

    // Extract customer ID - handle both string ID and JSON object cases
    let customerId: string
    try {
      // Try to parse as JSON first (in case it's stored as a full object)
      const customerData = JSON.parse(profile.stripe_customer_id)
      customerId = customerData.id
      console.log('📝 Extracted customer ID from JSON object:', customerId)
    } catch {
      // If parsing fails, assume it's already just the ID
      customerId = profile.stripe_customer_id
      console.log('📝 Using customer ID directly:', customerId)
    }

    // Create customer portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${request.nextUrl.origin}${STRIPE_CONFIG.customer_portal_return_url}`,
    })

    console.log('🔐 Created customer portal session for user:', user.id)

    return NextResponse.json({
      url: portalSession.url,
    })

  } catch (error) {
    console.error('Error creating customer portal session:', error)
    return NextResponse.json(
      { error: 'Failed to create customer portal session' },
      { status: 500 }
    )
  }
}