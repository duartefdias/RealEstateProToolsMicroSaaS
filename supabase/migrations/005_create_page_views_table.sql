-- Create page_views table (Task 2.5)
-- Analytics tracking for SEO and user behavior insights
-- Stores page view data for both authenticated and anonymous users

CREATE TABLE IF NOT EXISTS public.page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  -- Page information
  page_path TEXT NOT NULL,
  page_title TEXT,
  page_referrer TEXT,
  
  -- User agent and device information
  user_agent TEXT,
  device_type TEXT CHECK (device_type IN ('desktop', 'tablet', 'mobile', 'bot')),
  browser_name TEXT,
  browser_version TEXT,
  operating_system TEXT,
  
  -- Location data
  ip_address INET NOT NULL,
  country TEXT,
  region TEXT,
  city TEXT,
  
  -- Session tracking
  session_id TEXT NOT NULL,
  is_new_session BOOLEAN DEFAULT FALSE,
  session_duration_seconds INTEGER,
  
  -- UTM and marketing attribution
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  
  -- SEO and search data
  search_query TEXT, -- If came from search engine
  search_engine TEXT, -- Google, Bing, etc.
  
  -- Page performance metrics
  page_load_time_ms INTEGER,
  time_on_page_seconds INTEGER,
  bounce BOOLEAN DEFAULT FALSE, -- True if only page in session
  
  -- Conversion tracking
  calculator_used TEXT, -- Which calculator was accessed from this page
  conversion_event TEXT, -- signup, subscription, etc.
  
  -- Language and locale
  user_language TEXT DEFAULT 'pt',
  user_timezone TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create updated_at trigger for page_views
CREATE TRIGGER update_page_views_updated_at
  BEFORE UPDATE ON public.page_views
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies for page_views table
-- Users can view their own page views
CREATE POLICY "Users can view their own page views"
  ON public.page_views
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow anonymous page view insertions (for analytics)
CREATE POLICY "Anyone can insert page views"
  ON public.page_views
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (TRUE); -- Allow all insertions for analytics

-- Admin users can view all page views (for analytics dashboard)
CREATE POLICY "Admins can view all page views"
  ON public.page_views
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND subscription_tier = 'admin'
    )
  );

-- Create indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_page_views_user_id ON public.page_views(user_id);
CREATE INDEX IF NOT EXISTS idx_page_views_page_path ON public.page_views(page_path);
CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON public.page_views(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_session_id ON public.page_views(session_id);
CREATE INDEX IF NOT EXISTS idx_page_views_ip_address ON public.page_views(ip_address);
CREATE INDEX IF NOT EXISTS idx_page_views_country ON public.page_views(country);
CREATE INDEX IF NOT EXISTS idx_page_views_device_type ON public.page_views(device_type);

-- Composite indexes for common analytics queries
-- Index by created_at and page_path (date filtering will be done in WHERE clause)
CREATE INDEX IF NOT EXISTS idx_page_views_created_at_path ON public.page_views(created_at, page_path);
CREATE INDEX IF NOT EXISTS idx_page_views_utm_attribution ON public.page_views(utm_source, utm_medium, utm_campaign, created_at);
CREATE INDEX IF NOT EXISTS idx_page_views_calculator_conversion ON public.page_views(calculator_used, conversion_event, created_at) WHERE calculator_used IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_page_views_bounce_analysis ON public.page_views(session_id, bounce, created_at);
CREATE INDEX IF NOT EXISTS idx_page_views_search_traffic ON public.page_views(search_engine, search_query, created_at) WHERE search_engine IS NOT NULL;

-- Add comment to table
COMMENT ON TABLE public.page_views IS 'Page view analytics tracking for SEO and user behavior insights';

-- Function to extract device type from user agent
CREATE OR REPLACE FUNCTION extract_device_type(user_agent_string TEXT)
RETURNS TEXT AS $$
BEGIN
  IF user_agent_string IS NULL THEN
    RETURN 'unknown';
  END IF;
  
  user_agent_string = LOWER(user_agent_string);
  
  -- Bot detection
  IF user_agent_string ~ '(bot|crawler|spider|scraper|facebookexternalhit|twitterbot|linkedinbot)' THEN
    RETURN 'bot';
  END IF;
  
  -- Mobile detection
  IF user_agent_string ~ '(mobile|android|iphone|ipod|blackberry|windows phone)' THEN
    RETURN 'mobile';
  END IF;
  
  -- Tablet detection
  IF user_agent_string ~ '(tablet|ipad)' THEN
    RETURN 'tablet';
  END IF;
  
  -- Default to desktop
  RETURN 'desktop';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to extract browser name from user agent
CREATE OR REPLACE FUNCTION extract_browser_name(user_agent_string TEXT)
RETURNS TEXT AS $$
BEGIN
  IF user_agent_string IS NULL THEN
    RETURN 'unknown';
  END IF;
  
  user_agent_string = LOWER(user_agent_string);
  
  IF user_agent_string ~ 'edg/' THEN
    RETURN 'Edge';
  ELSIF user_agent_string ~ 'chrome/' THEN
    RETURN 'Chrome';
  ELSIF user_agent_string ~ 'firefox/' THEN
    RETURN 'Firefox';
  ELSIF user_agent_string ~ 'safari/' AND user_agent_string !~ 'chrome/' THEN
    RETURN 'Safari';
  ELSIF user_agent_string ~ 'opera/' THEN
    RETURN 'Opera';
  ELSE
    RETURN 'Other';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger to automatically set device_type and browser_name from user_agent
CREATE OR REPLACE FUNCTION set_page_view_metadata()
RETURNS TRIGGER AS $$
BEGIN
  -- Set device type and browser name from user agent
  NEW.device_type = extract_device_type(NEW.user_agent);
  NEW.browser_name = extract_browser_name(NEW.user_agent);
  
  -- Set user language if not provided
  IF NEW.user_language IS NULL THEN
    NEW.user_language = 'pt'; -- Default to Portuguese
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_page_view_metadata_trigger
  BEFORE INSERT ON public.page_views
  FOR EACH ROW
  EXECUTE FUNCTION set_page_view_metadata();

-- Function to get page analytics for a date range
CREATE OR REPLACE FUNCTION get_page_analytics(
  start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  page_path TEXT,
  page_views BIGINT,
  unique_visitors BIGINT,
  avg_time_on_page NUMERIC,
  bounce_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pv.page_path,
    COUNT(*) as page_views,
    COUNT(DISTINCT COALESCE(pv.user_id::TEXT, pv.ip_address::TEXT || pv.user_agent)) as unique_visitors,
    ROUND(AVG(pv.time_on_page_seconds)::NUMERIC, 2) as avg_time_on_page,
    ROUND((COUNT(CASE WHEN pv.bounce THEN 1 END)::NUMERIC / COUNT(*) * 100), 2) as bounce_rate
  FROM public.page_views pv
  WHERE pv.created_at >= start_date::timestamp
    AND pv.created_at < (end_date + INTERVAL '1 day')::timestamp
  GROUP BY pv.page_path
  ORDER BY page_views DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get traffic sources analytics
CREATE OR REPLACE FUNCTION get_traffic_sources(
  start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  source_type TEXT,
  source_detail TEXT,
  sessions BIGINT,
  page_views BIGINT,
  conversion_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN pv.search_engine IS NOT NULL THEN 'Search Engine'
      WHEN pv.utm_source IS NOT NULL THEN 'Campaign'
      WHEN pv.page_referrer IS NOT NULL THEN 'Referral'
      ELSE 'Direct'
    END as source_type,
    COALESCE(pv.search_engine, pv.utm_source, pv.page_referrer, 'Direct') as source_detail,
    COUNT(DISTINCT pv.session_id) as sessions,
    COUNT(*) as page_views,
    ROUND((COUNT(CASE WHEN pv.conversion_event IS NOT NULL THEN 1 END)::NUMERIC / COUNT(DISTINCT pv.session_id) * 100), 2) as conversion_rate
  FROM public.page_views pv
  WHERE pv.created_at >= start_date::timestamp
    AND pv.created_at < (end_date + INTERVAL '1 day')::timestamp
  GROUP BY source_type, source_detail
  ORDER BY sessions DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get calculator funnel analytics
CREATE OR REPLACE FUNCTION get_calculator_funnel(
  start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  calculator_type TEXT,
  landing_page_views BIGINT,
  calculator_starts BIGINT,
  calculator_completions BIGINT,
  conversion_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH calculator_pages AS (
    SELECT 
      CASE 
        WHEN page_path LIKE '%/calculators/sell-house%' THEN 'sell-house'
        WHEN page_path LIKE '%/calculators/buy-house%' THEN 'buy-house'
        WHEN page_path LIKE '%/calculators/mortgage-simulator%' THEN 'mortgage-simulator'
        WHEN page_path LIKE '%/calculators/rental-investment%' THEN 'rental-investment'
        WHEN page_path LIKE '%/calculators/property-flip%' THEN 'property-flip'
        WHEN page_path LIKE '%/calculators/switch-house%' THEN 'switch-house'
        ELSE NULL
      END as calc_type,
      *
    FROM public.page_views
    WHERE created_at >= start_date::timestamp
      AND created_at < (end_date + INTERVAL '1 day')::timestamp
      AND page_path LIKE '%/calculators/%'
  )
  SELECT 
    cp.calc_type as calculator_type,
    COUNT(*) as landing_page_views,
    COUNT(CASE WHEN cp.calculator_used IS NOT NULL THEN 1 END) as calculator_starts,
    COUNT(CASE WHEN cp.conversion_event = 'calculation_completed' THEN 1 END) as calculator_completions,
    ROUND((COUNT(CASE WHEN cp.conversion_event = 'calculation_completed' THEN 1 END)::NUMERIC / COUNT(*) * 100), 2) as conversion_rate
  FROM calculator_pages cp
  WHERE cp.calc_type IS NOT NULL
  GROUP BY cp.calc_type
  ORDER BY landing_page_views DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup old page views (data retention)
CREATE OR REPLACE FUNCTION cleanup_old_page_views()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete page views older than 1 year
  DELETE FROM public.page_views
  WHERE created_at < NOW() - INTERVAL '1 year';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;