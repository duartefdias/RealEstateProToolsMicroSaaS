import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { stripe } from '@/lib/payments/stripe'
import { createServerSupabaseClient } from '@/lib/database/supabase'

// Raw body is needed for webhook signature verification
export async function POST(request: NextRequest) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) {
    console.error('🔐 Missing Stripe signature')
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
    console.log('🔐 Webhook received:', event.type, 'ID:', event.id)
  } catch (error) {
    console.error('🔐 Webhook signature verification failed:', error)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session)
        break

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice)
        break

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice)
        break

      case 'customer.created':
        await handleCustomerCreated(event.data.object as Stripe.Customer)
        break

      default:
        console.log('🔐 Unhandled webhook event:', event.type)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('🔐 Webhook handler error:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log('🔐 Checkout session completed:', session.id)
  
  if (session.mode === 'subscription' && session.subscription) {
    const supabase = createServerSupabaseClient()
    const userId = session.client_reference_id || session.metadata?.userId

    if (!userId) {
      console.error('🔐 No user ID in checkout session:', session.id)
      return
    }

    // Update user profile with subscription info
    await supabase
      .from('profiles')
      .update({
        subscription_tier: 'pro',
        stripe_customer_id: session.customer as string,
        subscription_id: session.subscription as string,
        subscription_status: 'active',
      })
      .eq('id', userId)

    // Record the payment
    if (session.amount_total && session.currency) {
      await supabase
        .from('payment_history')
        .insert({
          user_id: userId,
          stripe_payment_intent_id: session.payment_intent as string,
          amount: session.amount_total,
          currency: session.currency.toUpperCase(),
          status: 'succeeded',
          description: 'Pro subscription - Monthly',
        })
    }

    console.log('🔐 Updated user to Pro subscription:', userId)
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log('🔐 Subscription created:', subscription.id)
  
  const supabase = createServerSupabaseClient()
  const customerId = subscription.customer as string
  
  // Find user by customer ID
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (!profile) {
    console.error('🔐 No user found for customer:', customerId)
    return
  }

  // Record subscription event
  await supabase
    .from('subscription_events')
    .insert({
      user_id: profile.id,
      stripe_subscription_id: subscription.id,
      event_type: 'created',
      old_status: null,
      new_status: subscription.status,
      metadata: {
        priceId: subscription.items.data[0]?.price.id,
        customerEmail: subscription.metadata?.email,
      },
    })
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('🔐 Subscription updated:', subscription.id, 'Status:', subscription.status)
  
  const supabase = createServerSupabaseClient()
  const customerId = subscription.customer as string
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, subscription_status')
    .eq('stripe_customer_id', customerId)
    .single()

  if (!profile) {
    console.error('🔐 No user found for customer:', customerId)
    return
  }

  const oldStatus = profile.subscription_status
  const newStatus = subscription.status

  // Update subscription status
  let newTier = 'free'
  if (subscription.status === 'active') {
    newTier = 'pro'
  } else if (['past_due', 'unpaid'].includes(subscription.status)) {
    newTier = 'registered' // Downgrade to registered but keep account
  }

  await supabase
    .from('profiles')
    .update({
      subscription_tier: newTier,
      subscription_status: newStatus,
      subscription_id: subscription.id,
      current_period_end: (subscription as any).current_period_end ? new Date((subscription as any).current_period_end * 1000).toISOString() : null,
    })
    .eq('id', profile.id)

  // Record the event
  await supabase
    .from('subscription_events')
    .insert({
      user_id: profile.id,
      stripe_subscription_id: subscription.id,
      event_type: 'updated',
      old_status: oldStatus,
      new_status: newStatus,
      metadata: {
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        currentPeriodEnd: (subscription as any).current_period_end,
      },
    })

  console.log('🔐 Updated subscription for user:', profile.id, 'from', oldStatus, 'to', newStatus)
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('🔐 Subscription deleted:', subscription.id)
  
  const supabase = createServerSupabaseClient()
  const customerId = subscription.customer as string
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (!profile) {
    console.error('🔐 No user found for customer:', customerId)
    return
  }

  // Downgrade to registered user (keep their account but remove Pro features)
  await supabase
    .from('profiles')
    .update({
      subscription_tier: 'registered',
      subscription_status: 'canceled',
      subscription_id: null,
    })
    .eq('id', profile.id)

  // Record the event
  await supabase
    .from('subscription_events')
    .insert({
      user_id: profile.id,
      stripe_subscription_id: subscription.id,
      event_type: 'canceled',
      old_status: 'active',
      new_status: 'canceled',
      metadata: {
        canceledAt: subscription.canceled_at,
        cancelAt: subscription.cancel_at,
      },
    })

  console.log('🔐 Subscription canceled for user:', profile.id)
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('🔐 Payment succeeded:', invoice.id)
  
  const supabase = createServerSupabaseClient()
  const customerId = invoice.customer as string
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (!profile) {
    console.error('🔐 No user found for customer:', customerId)
    return
  }

  // Record successful payment
  await supabase
    .from('payment_history')
    .insert({
      user_id: profile.id,
      stripe_payment_intent_id: (invoice as any).payment_intent || null,
      amount: invoice.amount_paid,
      currency: invoice.currency.toUpperCase(),
      status: 'succeeded',
      description: invoice.lines.data[0]?.description || 'Subscription payment',
    })

  // Record subscription event
  await supabase
    .from('subscription_events')
    .insert({
      user_id: profile.id,
      stripe_subscription_id: (invoice as any).subscription || null,
      event_type: 'payment_succeeded',
      old_status: null,
      new_status: 'active',
      metadata: {
        invoiceId: invoice.id,
        amount: invoice.amount_paid,
        periodStart: invoice.period_start,
        periodEnd: invoice.period_end,
      },
    })

  console.log('🔐 Payment recorded for user:', profile.id, 'Amount:', invoice.amount_paid)
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  console.log('🔐 Payment failed:', invoice.id)
  
  const supabase = createServerSupabaseClient()
  const customerId = invoice.customer as string
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (!profile) {
    console.error('🔐 No user found for customer:', customerId)
    return
  }

  // Record failed payment
  await supabase
    .from('payment_history')
    .insert({
      user_id: profile.id,
      stripe_payment_intent_id: (invoice as any).payment_intent || null,
      amount: invoice.amount_due,
      currency: invoice.currency.toUpperCase(),
      status: 'failed',
      description: `Failed payment - ${invoice.lines.data[0]?.description || 'Subscription payment'}`,
    })

  // Record subscription event
  await supabase
    .from('subscription_events')
    .insert({
      user_id: profile.id,
      stripe_subscription_id: (invoice as any).subscription || null,
      event_type: 'payment_failed',
      old_status: 'active',
      new_status: 'past_due',
      metadata: {
        invoiceId: invoice.id,
        attemptCount: invoice.attempt_count,
        nextPaymentAttempt: invoice.next_payment_attempt,
      },
    })

  console.log('🔐 Payment failure recorded for user:', profile.id)
}

async function handleCustomerCreated(customer: Stripe.Customer) {
  console.log('🔐 Customer created:', customer.id)
  
  // Customer creation is usually handled in the checkout session
  // This is mainly for logging purposes
}