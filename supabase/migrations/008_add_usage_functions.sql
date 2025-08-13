-- Add utility functions for usage tracking and management
-- These functions support the Stripe integration and usage enforcement

-- Function to safely increment daily calculations counter
CREATE OR REPLACE FUNCTION increment_daily_calculations(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  current_usage INTEGER;
  today_date DATE := CURRENT_DATE;
BEGIN
  -- Get current usage and check if reset is needed
  SELECT 
    daily_calculations_used,
    CASE 
      WHEN last_calculation_reset < today_date THEN 0
      ELSE daily_calculations_used
    END
  INTO current_usage
  FROM public.profiles
  WHERE id = user_id;
  
  -- If no profile found, return -1
  IF NOT FOUND THEN
    RETURN -1;
  END IF;
  
  -- Update the usage counter and reset date if needed
  UPDATE public.profiles
  SET 
    daily_calculations_used = CASE 
      WHEN last_calculation_reset < today_date THEN 1
      ELSE daily_calculations_used + 1
    END,
    last_calculation_reset = CASE
      WHEN last_calculation_reset < today_date THEN today_date
      ELSE last_calculation_reset
    END,
    updated_at = NOW()
  WHERE id = user_id;
  
  -- Return the new usage count
  SELECT daily_calculations_used INTO current_usage
  FROM public.profiles
  WHERE id = user_id;
  
  RETURN current_usage;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can perform calculation
CREATE OR REPLACE FUNCTION can_perform_calculation(user_id UUID)
RETURNS TABLE(
  allowed BOOLEAN,
  remaining INTEGER,
  used INTEGER,
  tier_limit INTEGER,
  subscription_tier TEXT
) AS $$
DECLARE
  profile_record public.profiles%ROWTYPE;
  today_date DATE := CURRENT_DATE;
  current_usage INTEGER;
  tier_limit INTEGER;
BEGIN
  -- Get user profile
  SELECT * INTO profile_record
  FROM public.profiles
  WHERE id = user_id;
  
  -- If no profile found, deny access
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 0, 0, 0, 'free'::TEXT;
    RETURN;
  END IF;
  
  -- Reset usage if it's a new day
  current_usage := profile_record.daily_calculations_used;
  IF profile_record.last_calculation_reset < today_date THEN
    current_usage := 0;
  END IF;
  
  -- Determine tier limits
  tier_limit := CASE profile_record.subscription_tier
    WHEN 'pro' THEN 999999 -- Effectively unlimited
    WHEN 'registered' THEN 10
    ELSE 5 -- free tier
  END;
  
  -- Return the result
  RETURN QUERY SELECT 
    current_usage < tier_limit AS allowed,
    GREATEST(0, tier_limit - current_usage) AS remaining,
    current_usage AS used,
    tier_limit AS tier_limit,
    profile_record.subscription_tier AS subscription_tier;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset all daily calculations (for admin/system use)
CREATE OR REPLACE FUNCTION reset_daily_calculations()
RETURNS INTEGER AS $$
DECLARE
  reset_count INTEGER;
BEGIN
  UPDATE public.profiles
  SET 
    daily_calculations_used = 0,
    last_calculation_reset = CURRENT_DATE,
    updated_at = NOW()
  WHERE last_calculation_reset < CURRENT_DATE;
  
  GET DIAGNOSTICS reset_count = ROW_COUNT;
  
  RETURN reset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get anonymous user usage
CREATE OR REPLACE FUNCTION get_anonymous_usage(ip_addr INET, session_id TEXT)
RETURNS INTEGER AS $$
DECLARE
  usage_count INTEGER;
  today_date DATE := CURRENT_DATE;
BEGIN
  SELECT COUNT(*)::INTEGER INTO usage_count
  FROM public.calculations
  WHERE ip_address = ip_addr
    AND (calculations.session_id = get_anonymous_usage.session_id OR user_id IS NULL)
    AND DATE(created_at) = today_date;
  
  RETURN COALESCE(usage_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to track anonymous calculation
CREATE OR REPLACE FUNCTION track_anonymous_calculation(
  ip_addr INET,
  session_id TEXT,
  calculator_type TEXT,
  input_data JSONB,
  result_data JSONB
)
RETURNS UUID AS $$
DECLARE
  calculation_id UUID;
BEGIN
  INSERT INTO public.calculations (
    user_id,
    calculator_type,
    input_data,
    result_data,
    ip_address,
    session_id
  ) VALUES (
    NULL,
    calculator_type,
    input_data,
    result_data,
    ip_addr,
    session_id
  )
  RETURNING id INTO calculation_id;
  
  RETURN calculation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user subscription summary
CREATE OR REPLACE FUNCTION get_subscription_summary(user_id UUID)
RETURNS TABLE(
  subscription_tier TEXT,
  subscription_status TEXT,
  daily_limit INTEGER,
  daily_used INTEGER,
  daily_remaining INTEGER,
  stripe_customer_id TEXT,
  subscription_id TEXT,
  current_period_end TIMESTAMP WITH TIME ZONE,
  can_upgrade BOOLEAN,
  next_reset_time TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
  profile_record public.profiles%ROWTYPE;
  today_date DATE := CURRENT_DATE;
  current_usage INTEGER;
  tier_limit INTEGER;
  tomorrow TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get user profile
  SELECT * INTO profile_record
  FROM public.profiles
  WHERE id = user_id;
  
  -- If no profile found, return default values
  IF NOT FOUND THEN
    tomorrow := (CURRENT_DATE + INTERVAL '1 day')::TIMESTAMP WITH TIME ZONE;
    RETURN QUERY SELECT 
      'free'::TEXT,
      NULL::TEXT,
      5,
      0,
      5,
      NULL::TEXT,
      NULL::TEXT,
      NULL::TIMESTAMP WITH TIME ZONE,
      TRUE,
      tomorrow;
    RETURN;
  END IF;
  
  -- Calculate current usage (reset if new day)
  current_usage := profile_record.daily_calculations_used;
  IF profile_record.last_calculation_reset < today_date THEN
    current_usage := 0;
  END IF;
  
  -- Determine tier limits
  tier_limit := CASE profile_record.subscription_tier
    WHEN 'pro' THEN 999999
    WHEN 'registered' THEN 10
    ELSE 5
  END;
  
  -- Calculate next reset time (tomorrow at midnight)
  tomorrow := (CURRENT_DATE + INTERVAL '1 day')::TIMESTAMP WITH TIME ZONE;
  
  -- Return the summary
  RETURN QUERY SELECT 
    profile_record.subscription_tier,
    profile_record.subscription_status,
    tier_limit,
    current_usage,
    GREATEST(0, tier_limit - current_usage),
    profile_record.stripe_customer_id,
    profile_record.subscription_id,
    profile_record.current_period_end,
    profile_record.subscription_tier != 'pro',
    tomorrow;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to upgrade user subscription (called by webhooks)
CREATE OR REPLACE FUNCTION upgrade_user_subscription(
  user_id UUID,
  new_tier TEXT,
  stripe_customer_id TEXT DEFAULT NULL,
  stripe_subscription_id TEXT DEFAULT NULL,
  subscription_status TEXT DEFAULT 'active',
  current_period_end TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Validate tier
  IF new_tier NOT IN ('free', 'registered', 'pro') THEN
    RAISE EXCEPTION 'Invalid subscription tier: %', new_tier;
  END IF;
  
  -- Update user profile
  UPDATE public.profiles
  SET 
    subscription_tier = new_tier,
    subscription_status = upgrade_user_subscription.subscription_status,
    stripe_customer_id = COALESCE(upgrade_user_subscription.stripe_customer_id, profiles.stripe_customer_id),
    subscription_id = COALESCE(stripe_subscription_id, profiles.subscription_id),
    current_period_end = COALESCE(upgrade_user_subscription.current_period_end, profiles.current_period_end),
    updated_at = NOW()
  WHERE id = user_id;
  
  -- Check if update was successful
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get usage analytics for admin dashboard
CREATE OR REPLACE FUNCTION get_usage_analytics(
  start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  total_calculations INTEGER,
  anonymous_calculations INTEGER,
  registered_calculations INTEGER,
  unique_users INTEGER,
  unique_anonymous_sessions INTEGER,
  avg_calculations_per_user NUMERIC,
  top_calculator_type TEXT,
  peak_usage_hour INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH calculation_stats AS (
    SELECT 
      COUNT(*) as total_calcs,
      COUNT(CASE WHEN user_id IS NULL THEN 1 END) as anon_calcs,
      COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as reg_calcs,
      COUNT(DISTINCT user_id) as unique_users,
      COUNT(DISTINCT session_id) FILTER (WHERE user_id IS NULL) as unique_anon,
      MODE() WITHIN GROUP (ORDER BY calculator_type) as top_calc,
      MODE() WITHIN GROUP (ORDER BY EXTRACT(HOUR FROM created_at)) as peak_hour
    FROM public.calculations
    WHERE DATE(created_at) BETWEEN start_date AND end_date
  )
  SELECT 
    total_calcs::INTEGER,
    anon_calcs::INTEGER,
    reg_calcs::INTEGER,
    COALESCE(unique_users, 0)::INTEGER,
    COALESCE(unique_anon, 0)::INTEGER,
    CASE 
      WHEN unique_users > 0 THEN ROUND(reg_calcs::NUMERIC / unique_users, 2)
      ELSE 0
    END,
    top_calc,
    peak_hour::INTEGER
  FROM calculation_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create index for efficient anonymous usage lookups
CREATE INDEX IF NOT EXISTS idx_calculations_anonymous_daily 
ON public.calculations(ip_address, session_id, created_at) 
WHERE user_id IS NULL;

-- Create index for efficient user calculation counting
CREATE INDEX IF NOT EXISTS idx_calculations_user_daily 
ON public.calculations(user_id, created_at) 
WHERE user_id IS NOT NULL;

-- Create index for efficient date-based queries (using created_at directly)
CREATE INDEX IF NOT EXISTS idx_calculations_created_at 
ON public.calculations(created_at, user_id, ip_address, session_id);

-- Add comment
COMMENT ON FUNCTION increment_daily_calculations IS 'Safely increment user daily calculation counter with automatic reset';
COMMENT ON FUNCTION can_perform_calculation IS 'Check if user can perform calculation based on their tier limits';
COMMENT ON FUNCTION get_subscription_summary IS 'Get complete subscription and usage information for a user';
COMMENT ON FUNCTION upgrade_user_subscription IS 'Update user subscription tier and Stripe information (webhook use)';
COMMENT ON FUNCTION get_usage_analytics IS 'Get usage analytics for admin dashboard';