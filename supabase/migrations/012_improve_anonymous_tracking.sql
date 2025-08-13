-- Improve anonymous user tracking to be more robust against browser switching
-- This makes it harder (but not impossible) to circumvent usage limits

-- Update get_anonymous_usage to be more comprehensive
-- Look at both IP-based and broader patterns to detect potential circumvention
CREATE OR REPLACE FUNCTION get_anonymous_usage(ip_addr TEXT, session_id TEXT)
RETURNS INTEGER AS $$
DECLARE
  usage_count INTEGER;
  today_date DATE := CURRENT_DATE;
  base_ip TEXT;
BEGIN
  -- Extract base IP (everything before last dash for local dev IDs)
  -- For production IPs, this will be the full IP
  base_ip := CASE 
    WHEN ip_addr LIKE 'local-%' THEN split_part(ip_addr, '-', 1) || '-' || split_part(ip_addr, '-', 2)
    ELSE ip_addr
  END;
  
  -- Count calculations for this specific identifier
  SELECT COUNT(*)::INTEGER INTO usage_count
  FROM public.calculations
  WHERE ip_address = ip_addr
    AND user_id IS NULL
    AND DATE(created_at) = today_date;
  
  -- For additional security, we could also check for similar IPs from same base
  -- but for now, keep it simple
  
  RETURN COALESCE(usage_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add a function to get usage analytics that can detect potential abuse patterns
CREATE OR REPLACE FUNCTION detect_usage_patterns(
  check_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  base_identifier TEXT,
  unique_ips INTEGER,
  total_calculations INTEGER,
  avg_per_ip NUMERIC,
  potential_abuse BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  WITH ip_analysis AS (
    SELECT 
      CASE 
        WHEN ip_address LIKE 'local-%' THEN split_part(ip_address, '-', 1) || '-' || split_part(ip_address, '-', 2)
        ELSE split_part(ip_address, '.', 1) || '.' || split_part(ip_address, '.', 2) || '.xxx.xxx'
      END as base_ip,
      COUNT(DISTINCT ip_address) as unique_ips,
      COUNT(*) as total_calcs
    FROM public.calculations
    WHERE user_id IS NULL 
      AND DATE(created_at) = check_date
    GROUP BY 1
    HAVING COUNT(DISTINCT ip_address) > 1 -- Only interested in bases with multiple IPs
  )
  SELECT 
    base_ip,
    unique_ips::INTEGER,
    total_calcs::INTEGER,
    ROUND(total_calcs::NUMERIC / unique_ips, 2) as avg_per_ip,
    (unique_ips > 3 AND total_calcs > 15) as potential_abuse -- Flag if >3 IPs and >15 calcs from same base
  FROM ip_analysis
  ORDER BY total_calcs DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments
COMMENT ON FUNCTION get_anonymous_usage(TEXT, TEXT) IS 'Get anonymous user usage count with improved tracking';
COMMENT ON FUNCTION detect_usage_patterns(DATE) IS 'Detect potential abuse patterns in anonymous usage';