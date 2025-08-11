-- Create payment and subscription related tables
-- Run this migration in your Supabase dashboard

-- Add subscription columns to profiles if they don't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT,
ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMP;

-- Payment history tracking
CREATE TABLE IF NOT EXISTS payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT,
  amount INTEGER, -- in cents
  currency TEXT DEFAULT 'EUR',
  status TEXT, -- succeeded, failed, canceled
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Subscription events log
CREATE TABLE IF NOT EXISTS subscription_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT,
  event_type TEXT, -- created, updated, canceled, renewed
  old_status TEXT,
  new_status TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Usage tracking for calculations
CREATE TABLE IF NOT EXISTS calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  calculator_type TEXT NOT NULL,
  input_data JSONB,
  result_data JSONB,
  ip_address INET, -- For anonymous user tracking
  session_id TEXT, -- For anonymous user tracking
  created_at TIMESTAMP DEFAULT NOW()
);

-- Client Management (Pro feature)
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  status TEXT DEFAULT 'lead', -- lead, active, inactive, closed
  stage TEXT DEFAULT 'initial_contact',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tasks Management
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  completed BOOLEAN DEFAULT FALSE,
  priority TEXT DEFAULT 'medium',
  created_at TIMESTAMP DEFAULT NOW()
);

-- SEO and Analytics
CREATE TABLE IF NOT EXISTS page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_path TEXT,
  user_agent TEXT,
  ip_address INET,
  referrer TEXT,
  country TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_payment_history_user_id ON payment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_created_at ON payment_history(created_at);
CREATE INDEX IF NOT EXISTS idx_subscription_events_user_id ON subscription_events(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_events_stripe_subscription_id ON subscription_events(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_calculations_user_id ON calculations(user_id);
CREATE INDEX IF NOT EXISTS idx_calculations_created_at ON calculations(created_at);
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_client_id ON tasks(client_id);
CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON page_views(created_at);

-- Row Level Security (RLS) policies
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payment_history
CREATE POLICY "Users can view their own payment history" ON payment_history
    FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for subscription_events
CREATE POLICY "Users can view their own subscription events" ON subscription_events
    FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for calculations
CREATE POLICY "Users can view their own calculations" ON calculations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own calculations" ON calculations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for clients
CREATE POLICY "Users can manage their own clients" ON clients
    FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for tasks
CREATE POLICY "Users can manage their own tasks" ON tasks
    FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for page_views (allow all for analytics)
CREATE POLICY "Allow all page view inserts" ON page_views
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all page view selects" ON page_views
    FOR SELECT USING (true);