export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          subscription_tier: 'free' | 'registered' | 'pro';
          daily_calculations_used: number;
          last_calculation_reset: string;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          subscription_tier?: 'free' | 'registered' | 'pro';
          daily_calculations_used?: number;
          last_calculation_reset?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          subscription_tier?: 'free' | 'registered' | 'pro';
          daily_calculations_used?: number;
          last_calculation_reset?: string;
          created_at?: string;
        };
      };
      calculations: {
        Row: {
          id: string;
          user_id: string | null;
          calculator_type: string;
          input_data: any;
          result_data: any;
          ip_address: string | null;
          session_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          calculator_type: string;
          input_data: any;
          result_data: any;
          ip_address?: string | null;
          session_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          calculator_type?: string;
          input_data?: any;
          result_data?: any;
          ip_address?: string | null;
          session_id?: string | null;
          created_at?: string;
        };
      };
      clients: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          email: string | null;
          phone: string | null;
          status: 'lead' | 'active' | 'inactive' | 'closed';
          stage: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          email?: string | null;
          phone?: string | null;
          status?: 'lead' | 'active' | 'inactive' | 'closed';
          stage?: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          email?: string | null;
          phone?: string | null;
          status?: 'lead' | 'active' | 'inactive' | 'closed';
          stage?: string;
          notes?: string | null;
          created_at?: string;
        };
      };
      tasks: {
        Row: {
          id: string;
          user_id: string;
          client_id: string;
          title: string;
          description: string | null;
          due_date: string | null;
          completed: boolean;
          priority: 'low' | 'medium' | 'high';
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          client_id: string;
          title: string;
          description?: string | null;
          due_date?: string | null;
          completed?: boolean;
          priority?: 'low' | 'medium' | 'high';
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          client_id?: string;
          title?: string;
          description?: string | null;
          due_date?: string | null;
          completed?: boolean;
          priority?: 'low' | 'medium' | 'high';
          created_at?: string;
        };
      };
    };
  };
}