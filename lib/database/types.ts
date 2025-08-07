// Database types and interfaces for Real Estate Pro Tools
// Auto-generated types based on Supabase schema

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Enum types for database constraints
export type SubscriptionTier = 'free' | 'registered' | 'pro' | 'admin'
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'incomplete' | 'trialing'
export type CalculatorType = 'sell-house' | 'buy-house' | 'mortgage-simulator' | 'rental-investment' | 'property-flip' | 'switch-house'
export type ClientStatus = 'lead' | 'active' | 'inactive' | 'closed' | 'archived'
export type ClientStage = 'initial_contact' | 'qualification' | 'viewing' | 'negotiation' | 'under_contract' | 'closing' | 'completed' | 'lost'
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'overdue'
export type TaskCategory = 'general' | 'follow_up' | 'viewing' | 'documentation' | 'meeting' | 'phone_call' | 'email' | 'property_research' | 'contract' | 'inspection'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type PropertyType = 'apartment' | 'house' | 'commercial' | 'land' | 'investment'
export type DeviceType = 'desktop' | 'tablet' | 'mobile' | 'bot'
export type PaymentStatus = 'succeeded' | 'failed' | 'canceled' | 'pending' | 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'requires_capture'
export type PaymentMethodType = 'card' | 'sepa_debit' | 'ideal' | 'sofort' | 'giropay' | 'eps' | 'p24' | 'bancontact'
export type Currency = 'EUR' | 'USD' | 'GBP'
export type RecurrencePattern = 'daily' | 'weekly' | 'monthly' | 'yearly'

// Database table interfaces
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          subscription_tier: SubscriptionTier
          daily_calculations_used: number
          last_calculation_reset: string
          stripe_customer_id: string | null
          subscription_id: string | null
          subscription_status: SubscriptionStatus | null
          subscription_plan: string
          current_period_end: string | null
          avatar_url: string | null
          website: string | null
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          subscription_tier?: SubscriptionTier
          daily_calculations_used?: number
          last_calculation_reset?: string
          stripe_customer_id?: string | null
          subscription_id?: string | null
          subscription_status?: SubscriptionStatus | null
          subscription_plan?: string
          current_period_end?: string | null
          avatar_url?: string | null
          website?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          subscription_tier?: SubscriptionTier
          daily_calculations_used?: number
          last_calculation_reset?: string
          stripe_customer_id?: string | null
          subscription_id?: string | null
          subscription_status?: SubscriptionStatus | null
          subscription_plan?: string
          current_period_end?: string | null
          avatar_url?: string | null
          website?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      calculations: {
        Row: {
          id: string
          user_id: string | null
          calculator_type: CalculatorType
          input_data: Json
          result_data: Json
          ip_address: string | null
          session_id: string | null
          user_agent: string | null
          location: string | null
          property_value: number | null
          calculation_duration_ms: number | null
          browser_language: string
          referrer: string | null
          utm_source: string | null
          utm_medium: string | null
          utm_campaign: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          calculator_type: CalculatorType
          input_data?: Json
          result_data?: Json
          ip_address?: string | null
          session_id?: string | null
          user_agent?: string | null
          location?: string | null
          property_value?: number | null
          calculation_duration_ms?: number | null
          browser_language?: string
          referrer?: string | null
          utm_source?: string | null
          utm_medium?: string | null
          utm_campaign?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          calculator_type?: CalculatorType
          input_data?: Json
          result_data?: Json
          ip_address?: string | null
          session_id?: string | null
          user_agent?: string | null
          location?: string | null
          property_value?: number | null
          calculation_duration_ms?: number | null
          browser_language?: string
          referrer?: string | null
          utm_source?: string | null
          utm_medium?: string | null
          utm_campaign?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          user_id: string
          name: string
          email: string | null
          phone: string | null
          address: string | null
          status: ClientStatus
          stage: ClientStage
          budget_min: number | null
          budget_max: number | null
          property_type: PropertyType | null
          preferred_locations: string[] | null
          source: string | null
          assigned_agent: string | null
          priority: TaskPriority
          notes: string | null
          tags: string[] | null
          first_contact_date: string
          last_contact_date: string | null
          next_followup_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          email?: string | null
          phone?: string | null
          address?: string | null
          status?: ClientStatus
          stage?: ClientStage
          budget_min?: number | null
          budget_max?: number | null
          property_type?: PropertyType | null
          preferred_locations?: string[] | null
          source?: string | null
          assigned_agent?: string | null
          priority?: TaskPriority
          notes?: string | null
          tags?: string[] | null
          first_contact_date?: string
          last_contact_date?: string | null
          next_followup_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          email?: string | null
          phone?: string | null
          address?: string | null
          status?: ClientStatus
          stage?: ClientStage
          budget_min?: number | null
          budget_max?: number | null
          property_type?: PropertyType | null
          preferred_locations?: string[] | null
          source?: string | null
          assigned_agent?: string | null
          priority?: TaskPriority
          notes?: string | null
          tags?: string[] | null
          first_contact_date?: string
          last_contact_date?: string | null
          next_followup_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          user_id: string
          client_id: string | null
          title: string
          description: string | null
          category: TaskCategory
          priority: TaskPriority
          status: TaskStatus
          due_date: string | null
          due_time: string | null
          estimated_duration_minutes: number | null
          actual_duration_minutes: number | null
          location: string | null
          attendees: string[] | null
          tags: string[] | null
          completed: boolean
          completed_at: string | null
          completed_by: string | null
          completion_notes: string | null
          is_recurring: boolean
          recurrence_pattern: RecurrencePattern | null
          recurrence_interval: number
          next_occurrence_date: string | null
          attachment_urls: string[] | null
          related_urls: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          client_id?: string | null
          title: string
          description?: string | null
          category?: TaskCategory
          priority?: TaskPriority
          status?: TaskStatus
          due_date?: string | null
          due_time?: string | null
          estimated_duration_minutes?: number | null
          actual_duration_minutes?: number | null
          location?: string | null
          attendees?: string[] | null
          tags?: string[] | null
          completed?: boolean
          completed_at?: string | null
          completed_by?: string | null
          completion_notes?: string | null
          is_recurring?: boolean
          recurrence_pattern?: RecurrencePattern | null
          recurrence_interval?: number
          next_occurrence_date?: string | null
          attachment_urls?: string[] | null
          related_urls?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          client_id?: string | null
          title?: string
          description?: string | null
          category?: TaskCategory
          priority?: TaskPriority
          status?: TaskStatus
          due_date?: string | null
          due_time?: string | null
          estimated_duration_minutes?: number | null
          actual_duration_minutes?: number | null
          location?: string | null
          attendees?: string[] | null
          tags?: string[] | null
          completed?: boolean
          completed_at?: string | null
          completed_by?: string | null
          completion_notes?: string | null
          is_recurring?: boolean
          recurrence_pattern?: RecurrencePattern | null
          recurrence_interval?: number
          next_occurrence_date?: string | null
          attachment_urls?: string[] | null
          related_urls?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
      page_views: {
        Row: {
          id: string
          user_id: string | null
          page_path: string
          page_title: string | null
          page_referrer: string | null
          user_agent: string | null
          device_type: DeviceType | null
          browser_name: string | null
          browser_version: string | null
          operating_system: string | null
          ip_address: string
          country: string | null
          region: string | null
          city: string | null
          session_id: string
          is_new_session: boolean
          session_duration_seconds: number | null
          utm_source: string | null
          utm_medium: string | null
          utm_campaign: string | null
          utm_term: string | null
          utm_content: string | null
          search_query: string | null
          search_engine: string | null
          page_load_time_ms: number | null
          time_on_page_seconds: number | null
          bounce: boolean
          calculator_used: string | null
          conversion_event: string | null
          user_language: string
          user_timezone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          page_path: string
          page_title?: string | null
          page_referrer?: string | null
          user_agent?: string | null
          device_type?: DeviceType | null
          browser_name?: string | null
          browser_version?: string | null
          operating_system?: string | null
          ip_address: string
          country?: string | null
          region?: string | null
          city?: string | null
          session_id: string
          is_new_session?: boolean
          session_duration_seconds?: number | null
          utm_source?: string | null
          utm_medium?: string | null
          utm_campaign?: string | null
          utm_term?: string | null
          utm_content?: string | null
          search_query?: string | null
          search_engine?: string | null
          page_load_time_ms?: number | null
          time_on_page_seconds?: number | null
          bounce?: boolean
          calculator_used?: string | null
          conversion_event?: string | null
          user_language?: string
          user_timezone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          page_path?: string
          page_title?: string | null
          page_referrer?: string | null
          user_agent?: string | null
          device_type?: DeviceType | null
          browser_name?: string | null
          browser_version?: string | null
          operating_system?: string | null
          ip_address?: string
          country?: string | null
          region?: string | null
          city?: string | null
          session_id?: string
          is_new_session?: boolean
          session_duration_seconds?: number | null
          utm_source?: string | null
          utm_medium?: string | null
          utm_campaign?: string | null
          utm_term?: string | null
          utm_content?: string | null
          search_query?: string | null
          search_engine?: string | null
          page_load_time_ms?: number | null
          time_on_page_seconds?: number | null
          bounce?: boolean
          calculator_used?: string | null
          conversion_event?: string | null
          user_language?: string
          user_timezone?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      payment_history: {
        Row: {
          id: string
          user_id: string
          stripe_payment_intent_id: string
          stripe_charge_id: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          amount: number
          currency: Currency
          status: PaymentStatus
          payment_method_type: PaymentMethodType | null
          payment_method_last4: string | null
          payment_method_brand: string | null
          payment_method_country: string | null
          description: string | null
          receipt_email: string | null
          receipt_url: string | null
          invoice_id: string | null
          stripe_fee: number
          application_fee: number
          tax_amount: number
          tax_rate: number | null
          billing_name: string | null
          billing_email: string | null
          billing_address_line1: string | null
          billing_address_line2: string | null
          billing_address_city: string | null
          billing_address_state: string | null
          billing_address_postal_code: string | null
          billing_address_country: string | null
          dispute_status: string | null
          risk_level: string | null
          risk_score: number | null
          refunded: boolean
          refunded_amount: number
          refund_reason: string | null
          refunded_at: string | null
          metadata: Json
          failure_code: string | null
          failure_message: string | null
          stripe_created_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          stripe_payment_intent_id: string
          stripe_charge_id?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          amount: number
          currency?: Currency
          status: PaymentStatus
          payment_method_type?: PaymentMethodType | null
          payment_method_last4?: string | null
          payment_method_brand?: string | null
          payment_method_country?: string | null
          description?: string | null
          receipt_email?: string | null
          receipt_url?: string | null
          invoice_id?: string | null
          stripe_fee?: number
          application_fee?: number
          tax_amount?: number
          tax_rate?: number | null
          billing_name?: string | null
          billing_email?: string | null
          billing_address_line1?: string | null
          billing_address_line2?: string | null
          billing_address_city?: string | null
          billing_address_state?: string | null
          billing_address_postal_code?: string | null
          billing_address_country?: string | null
          dispute_status?: string | null
          risk_level?: string | null
          risk_score?: number | null
          refunded?: boolean
          refunded_amount?: number
          refund_reason?: string | null
          refunded_at?: string | null
          metadata?: Json
          failure_code?: string | null
          failure_message?: string | null
          stripe_created_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          stripe_payment_intent_id?: string
          stripe_charge_id?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          amount?: number
          currency?: Currency
          status?: PaymentStatus
          payment_method_type?: PaymentMethodType | null
          payment_method_last4?: string | null
          payment_method_brand?: string | null
          payment_method_country?: string | null
          description?: string | null
          receipt_email?: string | null
          receipt_url?: string | null
          invoice_id?: string | null
          stripe_fee?: number
          application_fee?: number
          tax_amount?: number
          tax_rate?: number | null
          billing_name?: string | null
          billing_email?: string | null
          billing_address_line1?: string | null
          billing_address_line2?: string | null
          billing_address_city?: string | null
          billing_address_state?: string | null
          billing_address_postal_code?: string | null
          billing_address_country?: string | null
          dispute_status?: string | null
          risk_level?: string | null
          risk_score?: number | null
          refunded?: boolean
          refunded_amount?: number
          refund_reason?: string | null
          refunded_at?: string | null
          metadata?: Json
          failure_code?: string | null
          failure_message?: string | null
          stripe_created_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      subscription_events: {
        Row: {
          id: string
          user_id: string
          stripe_subscription_id: string
          stripe_customer_id: string
          event_type: string
          old_status: string | null
          new_status: string | null
          old_plan_id: string | null
          new_plan_id: string | null
          old_plan_name: string | null
          new_plan_name: string | null
          old_amount_cents: number | null
          new_amount_cents: number | null
          currency: Currency
          current_period_start: string | null
          current_period_end: string | null
          trial_start: string | null
          trial_end: string | null
          cancel_at_period_end: boolean
          canceled_at: string | null
          cancellation_reason: string | null
          cancellation_feedback: string | null
          collection_method: string | null
          payment_method_type: string | null
          next_payment_attempt: string | null
          coupon_id: string | null
          coupon_name: string | null
          discount_percentage: number | null
          discount_amount_cents: number | null
          stripe_event_id: string | null
          api_version: string | null
          event_data: Json
          processed_at: string
          processing_errors: string[] | null
          retry_count: number
          user_agent: string | null
          ip_address: string | null
          initiated_by: string | null
          stripe_created_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          stripe_subscription_id: string
          stripe_customer_id: string
          event_type: string
          old_status?: string | null
          new_status?: string | null
          old_plan_id?: string | null
          new_plan_id?: string | null
          old_plan_name?: string | null
          new_plan_name?: string | null
          old_amount_cents?: number | null
          new_amount_cents?: number | null
          currency?: Currency
          current_period_start?: string | null
          current_period_end?: string | null
          trial_start?: string | null
          trial_end?: string | null
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          cancellation_reason?: string | null
          cancellation_feedback?: string | null
          collection_method?: string | null
          payment_method_type?: string | null
          next_payment_attempt?: string | null
          coupon_id?: string | null
          coupon_name?: string | null
          discount_percentage?: number | null
          discount_amount_cents?: number | null
          stripe_event_id?: string | null
          api_version?: string | null
          event_data?: Json
          processed_at?: string
          processing_errors?: string[] | null
          retry_count?: number
          user_agent?: string | null
          ip_address?: string | null
          initiated_by?: string | null
          stripe_created_at: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          stripe_subscription_id?: string
          stripe_customer_id?: string
          event_type?: string
          old_status?: string | null
          new_status?: string | null
          old_plan_id?: string | null
          new_plan_id?: string | null
          old_plan_name?: string | null
          new_plan_name?: string | null
          old_amount_cents?: number | null
          new_amount_cents?: number | null
          currency?: Currency
          current_period_start?: string | null
          current_period_end?: string | null
          trial_start?: string | null
          trial_end?: string | null
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          cancellation_reason?: string | null
          cancellation_feedback?: string | null
          collection_method?: string | null
          payment_method_type?: string | null
          next_payment_attempt?: string | null
          coupon_id?: string | null
          coupon_name?: string | null
          discount_percentage?: number | null
          discount_amount_cents?: number | null
          stripe_event_id?: string | null
          api_version?: string | null
          event_data?: Json
          processed_at?: string
          processing_errors?: string[] | null
          retry_count?: number
          user_agent?: string | null
          ip_address?: string | null
          initiated_by?: string | null
          stripe_created_at?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types for common operations
export type Profile = Database['public']['Tables']['profiles']['Row']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

export type Calculation = Database['public']['Tables']['calculations']['Row']
export type CalculationInsert = Database['public']['Tables']['calculations']['Insert']
export type CalculationUpdate = Database['public']['Tables']['calculations']['Update']

export type Client = Database['public']['Tables']['clients']['Row']
export type ClientInsert = Database['public']['Tables']['clients']['Insert']
export type ClientUpdate = Database['public']['Tables']['clients']['Update']

export type Task = Database['public']['Tables']['tasks']['Row']
export type TaskInsert = Database['public']['Tables']['tasks']['Insert']
export type TaskUpdate = Database['public']['Tables']['tasks']['Update']

export type PageView = Database['public']['Tables']['page_views']['Row']
export type PageViewInsert = Database['public']['Tables']['page_views']['Insert']
export type PageViewUpdate = Database['public']['Tables']['page_views']['Update']

export type PaymentHistory = Database['public']['Tables']['payment_history']['Row']
export type PaymentHistoryInsert = Database['public']['Tables']['payment_history']['Insert']
export type PaymentHistoryUpdate = Database['public']['Tables']['payment_history']['Update']

export type SubscriptionEvent = Database['public']['Tables']['subscription_events']['Row']
export type SubscriptionEventInsert = Database['public']['Tables']['subscription_events']['Insert']
export type SubscriptionEventUpdate = Database['public']['Tables']['subscription_events']['Update']

// Extended types with relationships
export interface ClientWithTasks extends Client {
  tasks: Task[]
}

export interface TaskWithClient extends Task {
  client: Client | null
}

export interface ProfileWithStats extends Profile {
  total_calculations: number
  active_clients: number
  pending_tasks: number
}

// Calculator input/output types
export interface CalculatorInput {
  propertyValue: number
  location: string
  calculationType: CalculatorType
  [key: string]: any
}

export interface CalculationResult {
  totalCost: number
  breakdown: Record<string, number>
  recommendations?: string[]
  disclaimers: string[]
  [key: string]: any
}

// Usage tracking types
export interface UsageLimit {
  daily_limit: number
  current_usage: number
  can_calculate: boolean
  reset_time: Date
}

export interface UsageStats {
  total_calculations: number
  calculations_today: number
  most_used_calculator: CalculatorType | null
  avg_calculations_per_day: number
}

// Analytics types
export interface PageAnalytics {
  page_path: string
  page_views: number
  unique_visitors: number
  avg_time_on_page: number
  bounce_rate: number
}

export interface TrafficSource {
  source_type: string
  source_detail: string
  sessions: number
  page_views: number
  conversion_rate: number
}

export interface CalculatorFunnel {
  calculator_type: CalculatorType
  landing_page_views: number
  calculator_starts: number
  calculator_completions: number
  conversion_rate: number
}

// Subscription and payment types
export interface SubscriptionPlan {
  id: string | null
  name: string
  daily_calculations: number
  features: string[]
  price: number
  currency: Currency
}

export interface PaymentStats {
  total_payments: number
  successful_payments: number
  failed_payments: number
  total_spent_cents: number
  total_refunded_cents: number
  average_payment_cents: number
  last_payment_date: string | null
}

export interface ClientStats {
  total_clients: number
  active_clients: number
  leads: number
  closed_deals: number
  overdue_followups: number
}

export interface TaskStats {
  total_tasks: number
  pending_tasks: number
  overdue_tasks: number
  completed_today: number
  high_priority_pending: number
}