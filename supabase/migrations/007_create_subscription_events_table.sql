-- Create subscription_events table (Task 2.7)
-- Logs all subscription lifecycle events for audit and analytics
-- Tracks subscription changes, cancellations, renewals, etc.

CREATE TABLE IF NOT EXISTS public.subscription_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Stripe subscription information
  stripe_subscription_id TEXT NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  
  -- Event information
  event_type TEXT NOT NULL CHECK (event_type IN (
    'subscription_created', 'subscription_updated', 'subscription_deleted',
    'subscription_trial_started', 'subscription_trial_ended',
    'subscription_paused', 'subscription_resumed',
    'payment_succeeded', 'payment_failed', 'payment_retry',
    'invoice_created', 'invoice_paid', 'invoice_payment_failed',
    'plan_changed', 'quantity_updated', 'discount_applied', 'discount_removed'
  )),
  
  -- Subscription status tracking
  old_status TEXT CHECK (old_status IN ('incomplete', 'incomplete_expired', 'trialing', 'active', 'past_due', 'canceled', 'unpaid', 'paused')),
  new_status TEXT CHECK (new_status IN ('incomplete', 'incomplete_expired', 'trialing', 'active', 'past_due', 'canceled', 'unpaid', 'paused')),
  
  -- Plan information
  old_plan_id TEXT,
  new_plan_id TEXT,
  old_plan_name TEXT,
  new_plan_name TEXT,
  
  -- Pricing information
  old_amount_cents INTEGER,
  new_amount_cents INTEGER,
  currency TEXT DEFAULT 'EUR',
  
  -- Subscription period information
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  trial_start TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  
  -- Cancellation information
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  canceled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,
  cancellation_feedback TEXT,
  
  -- Billing and payment details
  collection_method TEXT CHECK (collection_method IN ('charge_automatically', 'send_invoice')),
  payment_method_type TEXT,
  next_payment_attempt TIMESTAMP WITH TIME ZONE,
  
  -- Discounts and promotions
  coupon_id TEXT,
  coupon_name TEXT,
  discount_percentage NUMERIC(5,2),
  discount_amount_cents INTEGER,
  
  -- Event metadata
  stripe_event_id TEXT UNIQUE, -- Stripe webhook event ID for deduplication
  api_version TEXT, -- Stripe API version
  event_data JSONB DEFAULT '{}', -- Full Stripe event data
  
  -- Processing information
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processing_errors TEXT[], -- Any errors during processing
  retry_count INTEGER DEFAULT 0,
  
  -- Additional context
  user_agent TEXT, -- If user-initiated change
  ip_address INET, -- If user-initiated change
  initiated_by TEXT CHECK (initiated_by IN ('user', 'system', 'admin', 'webhook')),
  
  -- Timestamps
  stripe_created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create updated_at trigger for subscription_events
CREATE TRIGGER update_subscription_events_updated_at
  BEFORE UPDATE ON public.subscription_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscription_events table
-- Users can view their own subscription events
CREATE POLICY "Users can view their own subscription events"
  ON public.subscription_events
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Only system/webhooks can insert subscription events
CREATE POLICY "Only system can insert subscription events"
  ON public.subscription_events
  FOR INSERT
  TO service_role
  WITH CHECK (TRUE);

-- Only system/webhooks can update subscription events
CREATE POLICY "Only system can update subscription events"
  ON public.subscription_events
  FOR UPDATE
  TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

-- Admin users can view all subscription events
CREATE POLICY "Admins can view all subscription events"
  ON public.subscription_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND subscription_tier = 'admin'
    )
  );

-- Create indexes for performance and queries
CREATE INDEX IF NOT EXISTS idx_subscription_events_user_id ON public.subscription_events(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_events_stripe_subscription_id ON public.subscription_events(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_events_event_type ON public.subscription_events(event_type);
CREATE INDEX IF NOT EXISTS idx_subscription_events_created_at ON public.subscription_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_subscription_events_stripe_event_id ON public.subscription_events(stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_subscription_events_new_status ON public.subscription_events(new_status);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_subscription_events_user_type_date ON public.subscription_events(user_id, event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_subscription_events_subscription_timeline ON public.subscription_events(stripe_subscription_id, stripe_created_at DESC);
CREATE INDEX IF NOT EXISTS idx_subscription_events_cancellations ON public.subscription_events(user_id, canceled_at, cancellation_reason) WHERE canceled_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_subscription_events_plan_changes ON public.subscription_events(user_id, old_plan_id, new_plan_id, created_at DESC) WHERE old_plan_id IS DISTINCT FROM new_plan_id;

-- JSONB index for event_data
CREATE INDEX IF NOT EXISTS idx_subscription_events_data ON public.subscription_events USING GIN (event_data);

-- Array indexes
CREATE INDEX IF NOT EXISTS idx_subscription_events_processing_errors ON public.subscription_events USING GIN (processing_errors);

-- Add comment to table
COMMENT ON TABLE public.subscription_events IS 'Complete subscription lifecycle event tracking with Stripe integration';

-- Function to get subscription timeline for a user
CREATE OR REPLACE FUNCTION get_subscription_timeline(p_user_id UUID)
RETURNS TABLE(
  event_date TIMESTAMP WITH TIME ZONE,
  event_type TEXT,
  old_status TEXT,
  new_status TEXT,
  plan_change TEXT,
  amount_change TEXT,
  description TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    se.created_at as event_date,
    se.event_type,
    se.old_status,
    se.new_status,
    CASE 
      WHEN se.old_plan_name IS DISTINCT FROM se.new_plan_name 
      THEN CONCAT(COALESCE(se.old_plan_name, 'None'), ' → ', COALESCE(se.new_plan_name, 'None'))
      ELSE NULL
    END as plan_change,
    CASE 
      WHEN se.old_amount_cents IS DISTINCT FROM se.new_amount_cents 
      THEN CONCAT(
        COALESCE((se.old_amount_cents / 100.0)::TEXT, '0'), '€ → ', 
        COALESCE((se.new_amount_cents / 100.0)::TEXT, '0'), '€'
      )
      ELSE NULL
    END as amount_change,
    CASE se.event_type
      WHEN 'subscription_created' THEN 'Subscription started'
      WHEN 'subscription_updated' THEN 'Subscription modified'
      WHEN 'subscription_deleted' THEN CONCAT('Subscription canceled', COALESCE(' - ' || se.cancellation_reason, ''))
      WHEN 'payment_succeeded' THEN 'Payment successful'
      WHEN 'payment_failed' THEN 'Payment failed'
      WHEN 'plan_changed' THEN 'Plan upgraded/downgraded'
      ELSE INITCAP(REPLACE(se.event_type, '_', ' '))
    END as description
  FROM public.subscription_events se
  WHERE se.user_id = p_user_id
  ORDER BY se.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get subscription analytics
CREATE OR REPLACE FUNCTION get_subscription_analytics(
  start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  new_subscriptions INTEGER,
  canceled_subscriptions INTEGER,
  plan_upgrades INTEGER,
  plan_downgrades INTEGER,
  failed_payments INTEGER,
  churn_rate NUMERIC,
  upgrade_rate NUMERIC
) AS $$
DECLARE
  active_start_count INTEGER;
BEGIN
  -- Get count of active subscriptions at start of period
  SELECT COUNT(DISTINCT user_id) INTO active_start_count
  FROM public.subscription_events
  WHERE created_at < start_date
    AND new_status = 'active';

  RETURN QUERY
  SELECT 
    COUNT(CASE WHEN event_type = 'subscription_created' THEN 1 END)::INTEGER as new_subscriptions,
    COUNT(CASE WHEN event_type = 'subscription_deleted' OR new_status = 'canceled' THEN 1 END)::INTEGER as canceled_subscriptions,
    COUNT(CASE WHEN event_type = 'plan_changed' AND new_amount_cents > old_amount_cents THEN 1 END)::INTEGER as plan_upgrades,
    COUNT(CASE WHEN event_type = 'plan_changed' AND new_amount_cents < old_amount_cents THEN 1 END)::INTEGER as plan_downgrades,
    COUNT(CASE WHEN event_type = 'payment_failed' THEN 1 END)::INTEGER as failed_payments,
    CASE 
      WHEN active_start_count > 0 THEN 
        ROUND((COUNT(CASE WHEN event_type = 'subscription_deleted' OR new_status = 'canceled' THEN 1 END)::NUMERIC / active_start_count * 100), 2)
      ELSE 0
    END as churn_rate,
    CASE 
      WHEN active_start_count > 0 THEN 
        ROUND((COUNT(CASE WHEN event_type = 'plan_changed' AND new_amount_cents > old_amount_cents THEN 1 END)::NUMERIC / active_start_count * 100), 2)
      ELSE 0
    END as upgrade_rate
  FROM public.subscription_events
  WHERE DATE(created_at) BETWEEN start_date AND end_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to identify at-risk subscriptions
CREATE OR REPLACE FUNCTION identify_at_risk_subscriptions()
RETURNS TABLE(
  user_id UUID,
  user_email TEXT,
  subscription_id TEXT,
  risk_factors TEXT[],
  risk_score INTEGER,
  last_activity TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  WITH risk_analysis AS (
    SELECT 
      se.user_id,
      se.stripe_subscription_id,
      ARRAY_REMOVE(ARRAY[
        CASE WHEN COUNT(CASE WHEN event_type = 'payment_failed' THEN 1 END) > 0 THEN 'Recent payment failures' END,
        CASE WHEN MAX(CASE WHEN event_type = 'payment_succeeded' THEN created_at END) < NOW() - INTERVAL '45 days' THEN 'No recent payments' END,
        CASE WHEN COUNT(CASE WHEN event_type = 'plan_changed' AND new_amount_cents < old_amount_cents THEN 1 END) > 0 THEN 'Recent downgrade' END,
        CASE WHEN bool_or(cancel_at_period_end) THEN 'Scheduled for cancellation' END
      ], NULL) as risk_factors,
      MAX(created_at) as last_activity
    FROM public.subscription_events se
    WHERE se.created_at > NOW() - INTERVAL '90 days'
    GROUP BY se.user_id, se.stripe_subscription_id
  )
  SELECT 
    ra.user_id,
    p.email as user_email,
    ra.stripe_subscription_id as subscription_id,
    ra.risk_factors,
    (array_length(ra.risk_factors, 1) * 25)::INTEGER as risk_score, -- 25 points per risk factor
    ra.last_activity
  FROM risk_analysis ra
  JOIN public.profiles p ON ra.user_id = p.id
  WHERE array_length(ra.risk_factors, 1) > 0
  ORDER BY array_length(ra.risk_factors, 1) DESC, ra.last_activity ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate customer lifetime value (CLV)
CREATE OR REPLACE FUNCTION calculate_customer_ltv(p_user_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  subscription_start DATE;
  subscription_end DATE;
  months_active INTEGER;
  total_revenue NUMERIC;
  monthly_value NUMERIC;
  estimated_ltv NUMERIC;
BEGIN
  -- Get subscription timeline
  SELECT 
    MIN(DATE(created_at)),
    CASE 
      WHEN bool_or(new_status = 'canceled') THEN MAX(DATE(created_at))
      ELSE CURRENT_DATE
    END
  INTO subscription_start, subscription_end
  FROM public.subscription_events
  WHERE user_id = p_user_id
    AND event_type IN ('subscription_created', 'subscription_deleted');
  
  -- Calculate months active
  months_active := COALESCE(
    EXTRACT(EPOCH FROM (subscription_end - subscription_start))::INTEGER / (30 * 24 * 3600),
    1
  );
  
  -- Get total revenue from payment history
  SELECT COALESCE(SUM(amount), 0) / 100.0 INTO total_revenue
  FROM public.payment_history
  WHERE user_id = p_user_id AND status = 'succeeded';
  
  -- Calculate monthly value
  monthly_value := CASE 
    WHEN months_active > 0 THEN total_revenue / months_active
    ELSE total_revenue
  END;
  
  -- Estimate LTV (assuming average customer lifetime of 24 months)
  estimated_ltv := monthly_value * 24;
  
  RETURN ROUND(estimated_ltv, 2);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to prevent duplicate event processing
CREATE OR REPLACE FUNCTION prevent_duplicate_events()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if this Stripe event has already been processed
  IF NEW.stripe_event_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM public.subscription_events WHERE stripe_event_id = NEW.stripe_event_id) THEN
      RAISE EXCEPTION 'Duplicate Stripe event: %', NEW.stripe_event_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_duplicate_events_trigger
  BEFORE INSERT ON public.subscription_events
  FOR EACH ROW
  EXECUTE FUNCTION prevent_duplicate_events();