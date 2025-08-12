import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/payments/stripe-server'
import { createServerSupabaseClient } from '@/lib/database/supabase'

// This is a temporary endpoint to manually trigger webhook processing
// for testing when webhooks can't reach your local server
export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json()
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 })
    }

    console.log('🧪 Manually processing checkout session:', sessionId)

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer']
    })

    console.log('Retrieved session:', session.id, 'Mode:', session.mode, 'Status:', session.status)

    // Process the session as if it came from a webhook
    if (session.mode === 'subscription' && session.subscription) {
      await handleCheckoutSessionCompleted(session)
      console.log('✅ Successfully processed subscription checkout')
      
      return NextResponse.json({ 
        success: true, 
        message: 'Checkout session processed successfully',
        session: {
          id: session.id,
          customer: session.customer,
          subscription: session.subscription,
          amount_total: session.amount_total
        }
      })
    } else {
      return NextResponse.json({ 
        error: 'Session is not a completed subscription checkout',
        session: {
          mode: session.mode,
          status: session.status
        }
      }, { status: 400 })
    }

  } catch (error) {
    console.error('Error processing test webhook:', error)
    return NextResponse.json(
      { error: 'Failed to process checkout session', details: error.message },
      { status: 500 }
    )
  }
}

// Copy the exact same logic from the webhook handler
async function handleCheckoutSessionCompleted(session: any) {
  console.log('🔐 Processing checkout session completed:', session.id)
  
  const supabase = createServerSupabaseClient()
  const userId = session.client_reference_id || session.metadata?.userId

  if (!userId) {
    console.error('🔐 No user ID in checkout session:', session.id)
    throw new Error('No user ID found in checkout session')
  }

  console.log('Processing for user:', userId)

  // Extract customer ID - handle both string ID and expanded object
  const customerId = typeof session.customer === 'string' 
    ? session.customer 
    : session.customer?.id

  if (!customerId) {
    console.error('No customer ID found in session')
    throw new Error('No customer ID found in checkout session')
  }

  // Update user profile with subscription info
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      subscription_tier: 'pro',
      stripe_customer_id: customerId,
      subscription_id: session.subscription as string,
      subscription_status: 'active',
      subscription_plan: 'pro'
    })
    .eq('id', userId)

  if (profileError) {
    console.error('Error updating profile:', profileError)
    throw profileError
  }

  console.log('✅ Updated user profile to Pro subscription')

  // Record the payment if we have payment details
  if (session.amount_total && session.currency) {
    // For subscriptions, we might have invoice instead of payment_intent
    const paymentReference = session.payment_intent || session.invoice || session.id
    
    const { error: paymentError } = await supabase
      .from('payment_history')
      .insert({
        user_id: userId,
        stripe_payment_intent_id: paymentReference as string,
        amount: session.amount_total,
        currency: session.currency.toUpperCase(),
        status: 'succeeded',
        description: 'Pro subscription - Monthly',
      })

    if (paymentError) {
      console.error('Error recording payment:', paymentError)
    } else {
      console.log('✅ Recorded payment in history')
    }
  }

  // Record subscription event (only if metadata column exists)
  try {
    // Get subscription details for the event
    const subscription = typeof session.subscription === 'string' 
      ? await stripe.subscriptions.retrieve(session.subscription)
      : session.subscription

    const { error: eventError } = await supabase
      .from('subscription_events')
      .insert({
        user_id: userId,
        stripe_customer_id: customerId,
        stripe_subscription_id: session.subscription as string,
        event_type: 'checkout_completed',
        old_status: null,
        new_status: 'active',
        stripe_created_at: new Date(subscription.created * 1000).toISOString()
      })

    if (eventError) {
      console.error('Error recording subscription event:', eventError)
      // Try without metadata if that was the issue
      if (eventError.message?.includes('metadata')) {
        console.log('Retrying subscription event without metadata...')
        const { error: retryError } = await supabase
          .from('subscription_events')
          .insert({
            user_id: userId,
            stripe_customer_id: customerId,
            stripe_subscription_id: session.subscription as string,
            event_type: 'checkout_completed',
            old_status: null,
            new_status: 'active',
            stripe_created_at: new Date(subscription.created * 1000).toISOString()
          })
        
        if (!retryError) {
          console.log('✅ Recorded subscription event (without metadata)')
        }
      }
    } else {
      console.log('✅ Recorded subscription event')
    }
  } catch (error) {
    console.error('Failed to record subscription event:', error)
  }

  console.log('🎉 Successfully upgraded user to Pro subscription:', userId)
}