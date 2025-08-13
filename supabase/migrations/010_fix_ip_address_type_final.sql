-- Fix IP address type to support custom client identifiers
-- Handle RLS policy dependencies and function overloads properly

-- First, drop the policy that depends on ip_address column
DROP POLICY IF EXISTS "Anonymous users can insert calculations" ON public.calculations;

-- Drop any other policies that might depend on ip_address
DROP POLICY IF EXISTS "Anonymous users can view their calculations" ON public.calculations;
DROP POLICY IF EXISTS "Users can view their calculations" ON public.calculations;
DROP POLICY IF EXISTS "Users can insert calculations" ON public.calculations;

-- Drop the old functions with INET parameters to avoid conflicts
DROP FUNCTION IF EXISTS get_anonymous_usage(INET, TEXT);
DROP FUNCTION IF EXISTS track_anonymous_calculation(INET, TEXT, TEXT, JSONB, JSONB);

-- Now we can safely alter the calculations table to change ip_address from INET to TEXT
ALTER TABLE public.calculations ALTER COLUMN ip_address TYPE TEXT USING ip_address::TEXT;

-- Recreate the RLS policies with TEXT type
CREATE POLICY "Anonymous users can insert calculations" ON public.calculations
  FOR INSERT
  WITH CHECK (user_id IS NULL);

CREATE POLICY "Anonymous users can view their calculations" ON public.calculations
  FOR SELECT
  USING (user_id IS NULL);

CREATE POLICY "Users can view their calculations" ON public.calculations
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert calculations" ON public.calculations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create the get_anonymous_usage function with TEXT parameter
CREATE OR REPLACE FUNCTION get_anonymous_usage(ip_addr TEXT, session_id TEXT)
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

-- Create the track_anonymous_calculation function with TEXT parameter
CREATE OR REPLACE FUNCTION track_anonymous_calculation(
  ip_addr TEXT,
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

-- Update the get_usage_analytics function to handle TEXT ip addresses
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

-- Update indexes to work with TEXT ip_address
DROP INDEX IF EXISTS idx_calculations_anonymous_daily;
CREATE INDEX IF NOT EXISTS idx_calculations_anonymous_daily 
ON public.calculations(ip_address, session_id, created_at) 
WHERE user_id IS NULL;

-- Add comments with specific function signatures
COMMENT ON FUNCTION get_anonymous_usage(TEXT, TEXT) IS 'Get anonymous user usage count for today (supports both IPs and dev identifiers)';
COMMENT ON FUNCTION track_anonymous_calculation(TEXT, TEXT, TEXT, JSONB, JSONB) IS 'Track anonymous calculation (supports both IPs and dev identifiers)';
COMMENT ON COLUMN calculations.ip_address IS 'Client identifier - can be IP address or dev identifier';