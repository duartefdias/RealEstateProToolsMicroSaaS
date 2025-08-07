-- Create calculations table (Task 2.2)
-- Stores all calculator usage data for tracking and analytics
-- Supports both authenticated and anonymous users

CREATE TABLE IF NOT EXISTS public.calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  -- Calculator identification
  calculator_type TEXT NOT NULL CHECK (calculator_type IN (
    'sell-house', 'buy-house', 'mortgage-simulator', 
    'rental-investment', 'property-flip', 'switch-house'
  )),
  
  -- Input and output data stored as JSONB for flexibility
  input_data JSONB NOT NULL DEFAULT '{}',
  result_data JSONB NOT NULL DEFAULT '{}',
  
  -- Anonymous user tracking
  ip_address INET, -- For anonymous user tracking and rate limiting
  session_id TEXT, -- For anonymous session tracking
  user_agent TEXT, -- Browser/device information
  
  -- Location and context
  location TEXT, -- Portuguese location if provided
  property_value NUMERIC(12,2), -- Extracted property value for analytics
  
  -- Metadata
  calculation_duration_ms INTEGER, -- Time taken to perform calculation
  browser_language TEXT DEFAULT 'pt', -- User's browser language
  referrer TEXT, -- Where the user came from
  utm_source TEXT, -- Marketing attribution
  utm_medium TEXT,
  utm_campaign TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create updated_at trigger for calculations
CREATE TRIGGER update_calculations_updated_at
  BEFORE UPDATE ON public.calculations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.calculations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for calculations table
-- Allow users to view their own calculations
CREATE POLICY "Users can view their own calculations"
  ON public.calculations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow users to insert their own calculations
CREATE POLICY "Users can insert their own calculations"
  ON public.calculations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow anonymous users to insert calculations (with IP/session tracking)
CREATE POLICY "Anonymous users can insert calculations"
  ON public.calculations
  FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL AND ip_address IS NOT NULL);

-- Admin users can view all calculations (for analytics)
CREATE POLICY "Admins can view all calculations"
  ON public.calculations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND subscription_tier = 'admin'
    )
  );

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_calculations_user_id ON public.calculations(user_id);
CREATE INDEX IF NOT EXISTS idx_calculations_calculator_type ON public.calculations(calculator_type);
CREATE INDEX IF NOT EXISTS idx_calculations_created_at ON public.calculations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_calculations_ip_address ON public.calculations(ip_address, created_at);
CREATE INDEX IF NOT EXISTS idx_calculations_session_id ON public.calculations(session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_calculations_property_value ON public.calculations(property_value);
CREATE INDEX IF NOT EXISTS idx_calculations_location ON public.calculations(location);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_calculations_user_type_date ON public.calculations(user_id, calculator_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_calculations_anonymous_tracking ON public.calculations(ip_address, session_id, created_at) WHERE user_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_calculations_utm_attribution ON public.calculations(utm_source, utm_medium, utm_campaign, created_at);

-- JSONB indexes for input/output data queries
CREATE INDEX IF NOT EXISTS idx_calculations_input_data ON public.calculations USING GIN (input_data);
CREATE INDEX IF NOT EXISTS idx_calculations_result_data ON public.calculations USING GIN (result_data);

-- Add comment to table
COMMENT ON TABLE public.calculations IS 'All calculator usage tracking with support for both authenticated and anonymous users';

-- Helper function to extract property value from input_data for analytics
CREATE OR REPLACE FUNCTION extract_property_value_from_input(input_data JSONB)
RETURNS NUMERIC AS $$
BEGIN
  -- Try to extract property value from common input field names
  RETURN COALESCE(
    (input_data->>'propertyValue')::NUMERIC,
    (input_data->>'property_value')::NUMERIC,
    (input_data->>'purchasePrice')::NUMERIC,
    (input_data->>'purchase_price')::NUMERIC,
    (input_data->>'salePrice')::NUMERIC,
    (input_data->>'sale_price')::NUMERIC,
    (input_data->>'value')::NUMERIC
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger to automatically set property_value from input_data
CREATE OR REPLACE FUNCTION set_property_value_from_input()
RETURNS TRIGGER AS $$
BEGIN
  NEW.property_value = extract_property_value_from_input(NEW.input_data);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_calculations_property_value
  BEFORE INSERT OR UPDATE ON public.calculations
  FOR EACH ROW
  EXECUTE FUNCTION set_property_value_from_input();

-- Function to get daily calculation count for a user or IP
CREATE OR REPLACE FUNCTION get_daily_calculation_count(
  p_user_id UUID DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS INTEGER AS $$
DECLARE
  calculation_count INTEGER;
BEGIN
  IF p_user_id IS NOT NULL THEN
    -- Count for authenticated user
    SELECT COUNT(*)
    INTO calculation_count
    FROM public.calculations
    WHERE user_id = p_user_id
      AND DATE(created_at) = p_date;
  ELSE
    -- Count for anonymous user by IP and session
    SELECT COUNT(*)
    INTO calculation_count
    FROM public.calculations
    WHERE user_id IS NULL
      AND (ip_address = p_ip_address OR session_id = p_session_id)
      AND DATE(created_at) = p_date;
  END IF;
  
  RETURN COALESCE(calculation_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean old anonymous calculations (data retention)
CREATE OR REPLACE FUNCTION cleanup_old_anonymous_calculations()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete anonymous calculations older than 90 days
  DELETE FROM public.calculations
  WHERE user_id IS NULL
    AND created_at < NOW() - INTERVAL '90 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;