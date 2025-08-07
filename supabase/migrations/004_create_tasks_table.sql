-- Create tasks table (Task 2.4)
-- Task management system for Pro subscribers
-- Links to clients and provides task tracking functionality

CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  
  -- Task information
  title TEXT NOT NULL,
  description TEXT,
  
  -- Task classification
  category TEXT DEFAULT 'general' CHECK (category IN (
    'general', 'follow_up', 'viewing', 'documentation', 'meeting', 
    'phone_call', 'email', 'property_research', 'contract', 'inspection'
  )),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled', 'overdue')),
  
  -- Scheduling
  due_date DATE,
  due_time TIME,
  estimated_duration_minutes INTEGER, -- Estimated time to complete
  actual_duration_minutes INTEGER, -- Actual time spent (when completed)
  
  -- Task details
  location TEXT, -- For tasks that require physical presence
  attendees TEXT[], -- Email addresses of people involved
  tags TEXT[], -- Flexible tagging system
  
  -- Completion tracking
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by UUID REFERENCES public.profiles(id),
  completion_notes TEXT,
  
  -- Recurrence (for recurring tasks)
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_pattern TEXT CHECK (recurrence_pattern IN ('daily', 'weekly', 'monthly', 'yearly')),
  recurrence_interval INTEGER DEFAULT 1, -- Every N periods
  next_occurrence_date DATE,
  
  -- Attachments and links
  attachment_urls TEXT[], -- URLs to files or documents
  related_urls TEXT[], -- Related links (property listings, etc.)
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create updated_at trigger for tasks
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tasks table
-- Users can only see their own tasks
CREATE POLICY "Users can view their own tasks"
  ON public.tasks
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own tasks
CREATE POLICY "Users can insert their own tasks"
  ON public.tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own tasks
CREATE POLICY "Users can update their own tasks"
  ON public.tasks
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own tasks
CREATE POLICY "Users can delete their own tasks"
  ON public.tasks
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Only allow Pro subscribers to access task management
CREATE POLICY "Only Pro subscribers can access tasks"
  ON public.tasks
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
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_client_id ON public.tasks(client_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON public.tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_category ON public.tasks(category);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON public.tasks(completed, completed_at);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON public.tasks(created_at DESC);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_tasks_user_status_due ON public.tasks(user_id, status, due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_user_client ON public.tasks(user_id, client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_user_priority_status ON public.tasks(user_id, priority, status);
CREATE INDEX IF NOT EXISTS idx_tasks_overdue ON public.tasks(user_id, due_date, status) WHERE status NOT IN ('completed', 'cancelled');

-- GIN indexes for array columns
CREATE INDEX IF NOT EXISTS idx_tasks_tags ON public.tasks USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_tasks_attendees ON public.tasks USING GIN (attendees);

-- Full text search index
CREATE INDEX IF NOT EXISTS idx_tasks_search ON public.tasks USING GIN (
  to_tsvector('portuguese', COALESCE(title, '') || ' ' || COALESCE(description, ''))
);

-- Add comment to table
COMMENT ON TABLE public.tasks IS 'Task management system for Pro subscribers with client relationships';

-- Function to automatically update completed fields when status changes
CREATE OR REPLACE FUNCTION update_task_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- When task is marked as completed
  IF OLD.status != 'completed' AND NEW.status = 'completed' THEN
    NEW.completed = TRUE;
    NEW.completed_at = NOW();
    NEW.completed_by = auth.uid();
  END IF;
  
  -- When task is unmarked as completed
  IF OLD.status = 'completed' AND NEW.status != 'completed' THEN
    NEW.completed = FALSE;
    NEW.completed_at = NULL;
    NEW.completed_by = NULL;
    NEW.completion_notes = NULL;
  END IF;
  
  -- Note: Overdue status should be handled by application logic or scheduled job
  -- We don't auto-update to overdue in the trigger to avoid issues with immutable functions
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_task_completion_trigger
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_task_completion();

-- Function to create recurring task instances
CREATE OR REPLACE FUNCTION create_next_recurring_task()
RETURNS TRIGGER AS $$
DECLARE
  next_due_date DATE;
BEGIN
  -- Only process if this is a recurring task being completed
  IF OLD.status != 'completed' 
     AND NEW.status = 'completed' 
     AND NEW.is_recurring = TRUE 
     AND NEW.recurrence_pattern IS NOT NULL THEN
    
    -- Calculate next due date based on pattern
    CASE NEW.recurrence_pattern
      WHEN 'daily' THEN
        next_due_date = NEW.due_date + (NEW.recurrence_interval || ' days')::INTERVAL;
      WHEN 'weekly' THEN
        next_due_date = NEW.due_date + (NEW.recurrence_interval || ' weeks')::INTERVAL;
      WHEN 'monthly' THEN
        next_due_date = NEW.due_date + (NEW.recurrence_interval || ' months')::INTERVAL;
      WHEN 'yearly' THEN
        next_due_date = NEW.due_date + (NEW.recurrence_interval || ' years')::INTERVAL;
    END CASE;
    
    -- Create the next occurrence
    INSERT INTO public.tasks (
      user_id, client_id, title, description, category, priority, 
      due_date, due_time, estimated_duration_minutes,
      location, tags, is_recurring, recurrence_pattern, 
      recurrence_interval
    ) VALUES (
      NEW.user_id, NEW.client_id, NEW.title, NEW.description, 
      NEW.category, NEW.priority, next_due_date, NEW.due_time,
      NEW.estimated_duration_minutes, NEW.location, NEW.tags,
      NEW.is_recurring, NEW.recurrence_pattern, NEW.recurrence_interval
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_next_recurring_task_trigger
  AFTER UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION create_next_recurring_task();

-- Function to get task statistics for a user
CREATE OR REPLACE FUNCTION get_task_statistics(p_user_id UUID)
RETURNS TABLE(
  total_tasks INTEGER,
  pending_tasks INTEGER,
  overdue_tasks INTEGER,
  completed_today INTEGER,
  high_priority_pending INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_tasks,
    COUNT(CASE WHEN status IN ('pending', 'in_progress') THEN 1 END)::INTEGER as pending_tasks,
    COUNT(CASE WHEN status = 'overdue' THEN 1 END)::INTEGER as overdue_tasks,
    COUNT(CASE WHEN completed = TRUE AND DATE(completed_at) = CURRENT_DATE THEN 1 END)::INTEGER as completed_today,
    COUNT(CASE WHEN priority = 'high' AND status IN ('pending', 'in_progress', 'overdue') THEN 1 END)::INTEGER as high_priority_pending
  FROM public.tasks
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get upcoming tasks (next 7 days)
CREATE OR REPLACE FUNCTION get_upcoming_tasks(
  p_user_id UUID,
  p_days_ahead INTEGER DEFAULT 7
)
RETURNS TABLE(
  id UUID,
  title TEXT,
  due_date DATE,
  due_time TIME,
  priority TEXT,
  client_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.title,
    t.due_date,
    t.due_time,
    t.priority,
    c.name as client_name
  FROM public.tasks t
  LEFT JOIN public.clients c ON t.client_id = c.id
  WHERE t.user_id = p_user_id
    AND t.status IN ('pending', 'in_progress')
    AND t.due_date IS NOT NULL
    AND t.due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + p_days_ahead
  ORDER BY t.due_date ASC, t.due_time ASC NULLS LAST, t.priority DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to search tasks
CREATE OR REPLACE FUNCTION search_tasks(
  p_user_id UUID,
  p_query TEXT,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE(
  id UUID,
  title TEXT,
  description TEXT,
  status TEXT,
  priority TEXT,
  due_date DATE,
  client_name TEXT,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.title,
    t.description,
    t.status,
    t.priority,
    t.due_date,
    c.name as client_name,
    ts_rank(to_tsvector('portuguese', COALESCE(t.title, '') || ' ' || COALESCE(t.description, '')), 
            plainto_tsquery('portuguese', p_query)) as rank
  FROM public.tasks t
  LEFT JOIN public.clients c ON t.client_id = c.id
  WHERE t.user_id = p_user_id
    AND to_tsvector('portuguese', COALESCE(t.title, '') || ' ' || COALESCE(t.description, '')) 
        @@ plainto_tsquery('portuguese', p_query)
  ORDER BY rank DESC, t.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update overdue tasks (to be called by application or cron job)
CREATE OR REPLACE FUNCTION update_overdue_tasks()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE public.tasks
  SET status = 'overdue'
  WHERE due_date < CURRENT_DATE
    AND status IN ('pending', 'in_progress')
    AND completed = FALSE;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;