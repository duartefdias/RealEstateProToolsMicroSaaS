import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/auth/server'
import { stripe, STRIPE_CONFIG } from '@/lib/payments/stripe-server'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated (using getUser for security)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { priceId, successUrl, cancelUrl } = await request.json()

    if (!priceId) {
      return NextResponse.json({ error: 'Price ID is required' }, { status: 400 })
    }

    // Get or create customer profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, email, full_name')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    let customerId = profile.stripe_customer_id

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile.email || user.email!,
        name: profile.full_name || undefined,
        metadata: {
          userId: user.id,
          source: 'real-estate-pro-tools'
        },
      })

      customerId = customer.id

      // Update profile with customer ID
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)

      console.log('🔐 Created Stripe customer:', customerId, 'for user:', user.id)
    }

    // Create checkout session
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      client_reference_id: user.id,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl || `${request.nextUrl.origin}${STRIPE_CONFIG.success_url}`,
      cancel_url: cancelUrl || `${request.nextUrl.origin}${STRIPE_CONFIG.cancel_url}`,
      
      // Portuguese market configuration
      currency: STRIPE_CONFIG.currency,
      locale: STRIPE_CONFIG.locale,
      
      // Tax and billing
      tax_id_collection: STRIPE_CONFIG.tax_id_collection,
      billing_address_collection: STRIPE_CONFIG.billing_address_collection,
      
      // Payment methods popular in Portugal
      payment_method_types: [...STRIPE_CONFIG.payment_method_types] as Stripe.Checkout.SessionCreateParams.PaymentMethodType[],
      
      // Enable promotional codes
      allow_promotion_codes: STRIPE_CONFIG.allow_promotion_codes,
      
      // Subscription configuration
      subscription_data: {
        metadata: {
          userId: user.id,
          source: 'checkout',
        },
      },
      
      // Customer portal
      customer_update: {
        address: 'auto',
        name: 'auto',
      },
      
      // Consent collection for Portuguese GDPR compliance
      // Note: Requires Terms of Service URL to be set in Stripe Dashboard
      // consent_collection: {
      //   terms_of_service: 'required',
      // },
    }

    const checkoutSession = await stripe.checkout.sessions.create(sessionParams)

    console.log('🔐 Created checkout session:', checkoutSession.id, 'for user:', user.id)

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    })

  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}