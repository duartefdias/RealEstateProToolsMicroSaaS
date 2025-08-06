export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  subscription_tier: 'free' | 'registered' | 'pro';
  daily_calculations_used: number;
  last_calculation_reset: Date;
  created_at: Date;
}

export interface Client {
  id: string;
  user_id: string;
  name: string;
  email?: string;
  phone?: string;
  status: 'lead' | 'active' | 'inactive' | 'closed';
  stage: 'initial_contact' | 'qualification' | 'showing' | 'negotiation' | 'closing';
  notes?: string;
  created_at: Date;
}

export interface Task {
  id: string;
  user_id: string;
  client_id: string;
  title: string;
  description?: string;
  due_date?: Date;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  created_at: Date;
}