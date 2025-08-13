-- Fix ambiguous column reference in get_anonymous_usage function
-- This addresses the error: column reference 'session_id' is ambiguous

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

COMMENT ON FUNCTION get_anonymous_usage IS 'Get anonymous user usage count for today (fixed column ambiguity)';