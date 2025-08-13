-- Remove result_data column from calculations table to reduce storage
-- This column was storing unnecessary large JSON data that's not needed for usage tracking

-- Update the track_anonymous_calculation function to not insert result_data
CREATE OR REPLACE FUNCTION track_anonymous_calculation(
  ip_addr TEXT,
  session_id TEXT,
  calculator_type TEXT,
  input_data JSONB
)
RETURNS UUID AS $$
DECLARE
  calculation_id UUID;
BEGIN
  INSERT INTO public.calculations (
    user_id,
    calculator_type,
    input_data,
    ip_address,
    session_id
  ) VALUES (
    NULL,
    calculator_type,
    input_data,
    ip_addr,
    session_id
  )
  RETURNING id INTO calculation_id;
  
  RETURN calculation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the old function signature that included result_data
DROP FUNCTION IF EXISTS track_anonymous_calculation(TEXT, TEXT, TEXT, JSONB, JSONB);

-- Remove the result_data column from calculations table
ALTER TABLE public.calculations DROP COLUMN IF EXISTS result_data;

-- Update comments
COMMENT ON FUNCTION track_anonymous_calculation(TEXT, TEXT, TEXT, JSONB) IS 'Track anonymous calculation with input data only (result_data removed for storage optimization)';