-- Create clients table (Task 2.3)
-- Client Management system for Pro subscribers
-- Stores client information and relationships with tasks

CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Client information
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  
  -- Client status and stage tracking
  status TEXT DEFAULT 'lead' CHECK (status IN ('lead', 'active', 'inactive', 'closed', 'archived')),
  stage TEXT DEFAULT 'initial_contact' CHECK (stage IN (
    'initial_contact', 'qualification', 'viewing', 'negotiation', 
    'under_contract', 'closing', 'completed', 'lost'
  )),
  
  -- Client value and property information
  budget_min NUMERIC(12,2),
  budget_max NUMERIC(12,2),
  property_type TEXT CHECK (property_type IN ('apartment', 'house', 'commercial', 'land', 'investment')),
  preferred_locations TEXT[], -- Array of preferred locations
  
  -- Client relationship data
  source TEXT, -- How they found us (referral, website, etc.)
  assigned_agent TEXT, -- Real estate agent assigned
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  
  -- Notes and communication
  notes TEXT,
  tags TEXT[], -- Tags for categorization
  
  -- Important dates
  first_contact_date DATE DEFAULT CURRENT_DATE,
  last_contact_date DATE,
  next_followup_date DATE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create updated_at trigger for clients
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- RLS Policies for clients table
-- Users can only see their own clients
CREATE POLICY "Users can view their own clients"
  ON public.clients
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own clients
CREATE POLICY "Users can insert their own clients"
  ON public.clients
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own clients
CREATE POLICY "Users can update their own clients"
  ON public.clients
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own clients
CREATE POLICY "Users can delete their own clients"
  ON public.clients
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Only allow Pro subscribers to access client management
CREATE POLICY "Only Pro subscribers can access clients"
  ON public.clients
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND subscription_tier = 'pro'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND subscription_tier = 'pro'
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON public.clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_status ON public.clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_stage ON public.clients(stage);
CREATE INDEX IF NOT EXISTS idx_clients_priority ON public.clients(priority);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON public.clients(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clients_next_followup_date ON public.clients(next_followup_date) WHERE next_followup_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clients_last_contact_date ON public.clients(last_contact_date DESC);
CREATE INDEX IF NOT EXISTS idx_clients_budget ON public.clients(budget_min, budget_max);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_clients_user_status_stage ON public.clients(user_id, status, stage);
CREATE INDEX IF NOT EXISTS idx_clients_user_priority ON public.clients(user_id, priority, created_at DESC);

-- GIN indexes for array columns
CREATE INDEX IF NOT EXISTS idx_clients_preferred_locations ON public.clients USING GIN (preferred_locations);
CREATE INDEX IF NOT EXISTS idx_clients_tags ON public.clients USING GIN (tags);

-- Full text search index for client names and notes
CREATE INDEX IF NOT EXISTS idx_clients_search ON public.clients USING GIN (
  to_tsvector('portuguese', COALESCE(name, '') || ' ' || COALESCE(notes, ''))
);

-- Add comment to table
COMMENT ON TABLE public.clients IS 'Client management for Pro subscribers - stores client information and relationship data';

-- Function to update last_contact_date when client is modified
CREATE OR REPLACE FUNCTION update_client_last_contact()
RETURNS TRIGGER AS $$
BEGIN
  -- Update last_contact_date when notes or status changes (indicating contact)
  IF OLD.notes IS DISTINCT FROM NEW.notes 
     OR OLD.status IS DISTINCT FROM NEW.status 
     OR OLD.stage IS DISTINCT FROM NEW.stage THEN
    NEW.last_contact_date = CURRENT_DATE;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_client_last_contact_trigger
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION update_client_last_contact();

-- Function to get client statistics for a user
CREATE OR REPLACE FUNCTION get_client_statistics(p_user_id UUID)
RETURNS TABLE(
  total_clients INTEGER,
  active_clients INTEGER,
  leads INTEGER,
  closed_deals INTEGER,
  overdue_followups INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_clients,
    COUNT(CASE WHEN status = 'active' THEN 1 END)::INTEGER as active_clients,
    COUNT(CASE WHEN status = 'lead' THEN 1 END)::INTEGER as leads,
    COUNT(CASE WHEN status = 'closed' THEN 1 END)::INTEGER as closed_deals,
    COUNT(CASE WHEN next_followup_date < CURRENT_DATE THEN 1 END)::INTEGER as overdue_followups
  FROM public.clients
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to search clients with full text search
CREATE OR REPLACE FUNCTION search_clients(
  p_user_id UUID,
  p_query TEXT,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE(
  id UUID,
  name TEXT,
  email TEXT,
  status TEXT,
  stage TEXT,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.email,
    c.status,
    c.stage,
    ts_rank(to_tsvector('portuguese', COALESCE(c.name, '') || ' ' || COALESCE(c.notes, '')), 
            plainto_tsquery('portuguese', p_query)) as rank
  FROM public.clients c
  WHERE c.user_id = p_user_id
    AND to_tsvector('portuguese', COALESCE(c.name, '') || ' ' || COALESCE(c.notes, '')) 
        @@ plainto_tsquery('portuguese', p_query)
  ORDER BY rank DESC, c.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;