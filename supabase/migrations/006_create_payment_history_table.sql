-- Create payment_history table (Task 2.6)
-- Stores payment transaction history for audit and analytics
-- Integrates with Stripe payment system

CREATE TABLE IF NOT EXISTS public.payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Stripe payment information
  stripe_payment_intent_id TEXT UNIQUE NOT NULL,
  stripe_charge_id TEXT,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  
  -- Payment details
  amount INTEGER NOT NULL CHECK (amount > 0), -- Amount in cents
  currency TEXT DEFAULT 'EUR' CHECK (currency IN ('EUR', 'USD', 'GBP')),
  
  -- Payment status and metadata
  status TEXT NOT NULL CHECK (status IN (
    'succeeded', 'failed', 'canceled', 'pending', 
    'requires_payment_method', 'requires_confirmation', 
    'requires_action', 'processing', 'requires_capture'
  )),
  
  -- Payment method information
  payment_method_type TEXT CHECK (payment_method_type IN (
    'card', 'sepa_debit', 'ideal', 'sofort', 'giropay', 'eps', 'p24', 'bancontact'
  )),
  payment_method_last4 TEXT, -- Last 4 digits of card/account
  payment_method_brand TEXT, -- visa, mastercard, etc.
  payment_method_country TEXT,
  
  -- Transaction details
  description TEXT,
  receipt_email TEXT,
  receipt_url TEXT,
  invoice_id TEXT,
  
  -- Fees and taxes
  stripe_fee INTEGER DEFAULT 0, -- Stripe processing fee in cents
  application_fee INTEGER DEFAULT 0, -- Platform fee in cents
  tax_amount INTEGER DEFAULT 0, -- Tax amount in cents
  tax_rate NUMERIC(5,4), -- Tax rate as decimal (0.23 for 23%)
  
  -- Billing information
  billing_name TEXT,
  billing_email TEXT,
  billing_address_line1 TEXT,
  billing_address_line2 TEXT,
  billing_address_city TEXT,
  billing_address_state TEXT,
  billing_address_postal_code TEXT,
  billing_address_country TEXT,
  
  -- Dispute and risk information
  dispute_status TEXT CHECK (dispute_status IN ('warning_needs_response', 'warning_under_review', 'warning_closed', 'needs_response', 'under_review', 'charge_refunded', 'won', 'lost')),
  risk_level TEXT CHECK (risk_level IN ('normal', 'elevated', 'highest')),
  risk_score INTEGER CHECK (risk_score >= 0 AND risk_score <= 100),
  
  -- Refund information
  refunded BOOLEAN DEFAULT FALSE,
  refunded_amount INTEGER DEFAULT 0,
  refund_reason TEXT,
  refunded_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  failure_code TEXT,
  failure_message TEXT,
  
  -- Timestamps
  stripe_created_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create updated_at trigger for payment_history
CREATE TRIGGER update_payment_history_updated_at
  BEFORE UPDATE ON public.payment_history
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payment_history table
-- Users can view their own payment history
CREATE POLICY "Users can view their own payment history"
  ON public.payment_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Only system/webhooks can insert payment records
CREATE POLICY "Only system can insert payment history"
  ON public.payment_history
  FOR INSERT
  TO service_role
  WITH CHECK (TRUE);

-- Only system/webhooks can update payment records
CREATE POLICY "Only system can update payment history"
  ON public.payment_history
  FOR UPDATE
  TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

-- Admin users can view all payment history
CREATE POLICY "Admins can view all payment history"
  ON public.payment_history
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
CREATE INDEX IF NOT EXISTS idx_payment_history_user_id ON public.payment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_status ON public.payment_history(status);
CREATE INDEX IF NOT EXISTS idx_payment_history_created_at ON public.payment_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_history_stripe_payment_intent ON public.payment_history(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_stripe_customer ON public.payment_history(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_stripe_subscription ON public.payment_history(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_amount ON public.payment_history(amount DESC);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_payment_history_user_status_date ON public.payment_history(user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_history_successful_payments ON public.payment_history(user_id, amount, created_at DESC) WHERE status = 'succeeded';
CREATE INDEX IF NOT EXISTS idx_payment_history_refunds ON public.payment_history(user_id, refunded_amount, refunded_at) WHERE refunded = TRUE;

-- JSONB index for metadata
CREATE INDEX IF NOT EXISTS idx_payment_history_metadata ON public.payment_history USING GIN (metadata);

-- Add comment to table
COMMENT ON TABLE public.payment_history IS 'Complete payment transaction history with Stripe integration';

-- Function to get user payment statistics
CREATE OR REPLACE FUNCTION get_user_payment_stats(p_user_id UUID)
RETURNS TABLE(
  total_payments INTEGER,
  successful_payments INTEGER,
  failed_payments INTEGER,
  total_spent_cents INTEGER,
  total_refunded_cents INTEGER,
  average_payment_cents NUMERIC,
  last_payment_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_payments,
    COUNT(CASE WHEN status = 'succeeded' THEN 1 END)::INTEGER as successful_payments,
    COUNT(CASE WHEN status = 'failed' THEN 1 END)::INTEGER as failed_payments,
    COALESCE(SUM(CASE WHEN status = 'succeeded' THEN amount END), 0)::INTEGER as total_spent_cents,
    COALESCE(SUM(refunded_amount), 0)::INTEGER as total_refunded_cents,
    ROUND(AVG(CASE WHEN status = 'succeeded' THEN amount END), 2) as average_payment_cents,
    MAX(created_at) as last_payment_date
  FROM public.payment_history
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get payment analytics for admin dashboard
CREATE OR REPLACE FUNCTION get_payment_analytics(
  start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  total_revenue_cents INTEGER,
  total_transactions INTEGER,
  successful_transactions INTEGER,
  failed_transactions INTEGER,
  average_transaction_cents NUMERIC,
  total_stripe_fees_cents INTEGER,
  total_refunds_cents INTEGER,
  unique_customers INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(CASE WHEN status = 'succeeded' THEN amount END), 0)::INTEGER as total_revenue_cents,
    COUNT(*)::INTEGER as total_transactions,
    COUNT(CASE WHEN status = 'succeeded' THEN 1 END)::INTEGER as successful_transactions,
    COUNT(CASE WHEN status = 'failed' THEN 1 END)::INTEGER as failed_transactions,
    ROUND(AVG(CASE WHEN status = 'succeeded' THEN amount END), 2) as average_transaction_cents,
    COALESCE(SUM(CASE WHEN status = 'succeeded' THEN stripe_fee END), 0)::INTEGER as total_stripe_fees_cents,
    COALESCE(SUM(refunded_amount), 0)::INTEGER as total_refunds_cents,
    COUNT(DISTINCT user_id)::INTEGER as unique_customers
  FROM public.payment_history
  WHERE DATE(created_at) BETWEEN start_date AND end_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get revenue by payment method
CREATE OR REPLACE FUNCTION get_revenue_by_payment_method(
  start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  payment_method_type TEXT,
  transaction_count INTEGER,
  total_revenue_cents INTEGER,
  average_transaction_cents NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(ph.payment_method_type, 'unknown') as payment_method_type,
    COUNT(*)::INTEGER as transaction_count,
    COALESCE(SUM(amount), 0)::INTEGER as total_revenue_cents,
    ROUND(AVG(amount), 2) as average_transaction_cents
  FROM public.payment_history ph
  WHERE DATE(ph.created_at) BETWEEN start_date AND end_date
    AND ph.status = 'succeeded'
  GROUP BY ph.payment_method_type
  ORDER BY total_revenue_cents DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get monthly recurring revenue (MRR) calculation
CREATE OR REPLACE FUNCTION calculate_mrr(calculation_date DATE DEFAULT CURRENT_DATE)
RETURNS NUMERIC AS $$
DECLARE
  mrr_amount NUMERIC;
BEGIN
  -- Calculate MRR based on active subscriptions
  -- This assumes subscription payments are monthly
  SELECT COALESCE(SUM(
    CASE 
      WHEN description ILIKE '%monthly%' THEN amount
      WHEN description ILIKE '%annual%' OR description ILIKE '%yearly%' THEN amount / 12.0
      ELSE amount -- Default to monthly
    END
  ), 0) INTO mrr_amount
  FROM public.payment_history ph
  JOIN public.profiles p ON ph.user_id = p.id
  WHERE ph.status = 'succeeded'
    AND ph.stripe_subscription_id IS NOT NULL
    AND p.subscription_status = 'active'
    AND DATE_TRUNC('month', ph.created_at) = DATE_TRUNC('month', calculation_date);
  
  RETURN ROUND(mrr_amount / 100.0, 2); -- Convert from cents to euros
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to detect potential fraud patterns
CREATE OR REPLACE FUNCTION detect_payment_anomalies(
  p_user_id UUID DEFAULT NULL,
  lookback_days INTEGER DEFAULT 7
)
RETURNS TABLE(
  user_id UUID,
  anomaly_type TEXT,
  anomaly_description TEXT,
  risk_score INTEGER,
  payment_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  -- High frequency payments
  SELECT 
    ph.user_id,
    'high_frequency' as anomaly_type,
    'Multiple payments in short timeframe' as anomaly_description,
    90 as risk_score,
    COUNT(*)::INTEGER as payment_count
  FROM public.payment_history ph
  WHERE (p_user_id IS NULL OR ph.user_id = p_user_id)
    AND ph.created_at > NOW() - (lookback_days || ' days')::INTERVAL
  GROUP BY ph.user_id
  HAVING COUNT(*) > 10
  
  UNION ALL
  
  -- High failure rate
  SELECT 
    ph.user_id,
    'high_failure_rate' as anomaly_type,
    'High proportion of failed payments' as anomaly_description,
    80 as risk_score,
    COUNT(*)::INTEGER as payment_count
  FROM public.payment_history ph
  WHERE (p_user_id IS NULL OR ph.user_id = p_user_id)
    AND ph.created_at > NOW() - (lookback_days || ' days')::INTERVAL
  GROUP BY ph.user_id
  HAVING COUNT(*) > 3 
    AND (COUNT(CASE WHEN status = 'failed' THEN 1 END)::FLOAT / COUNT(*)) > 0.5
  
  UNION ALL
  
  -- Unusual amounts
  SELECT 
    ph.user_id,
    'unusual_amount' as anomaly_type,
    'Payment amount significantly different from norm' as anomaly_description,
    70 as risk_score,
    COUNT(*)::INTEGER as payment_count
  FROM public.payment_history ph
  WHERE (p_user_id IS NULL OR ph.user_id = p_user_id)
    AND ph.created_at > NOW() - (lookback_days || ' days')::INTERVAL
    AND ph.status = 'succeeded'
    AND (ph.amount > 10000 OR ph.amount < 100) -- Outside normal subscription range
  GROUP BY ph.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;