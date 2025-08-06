import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Create Supabase client for client-side operations
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'x-application': 'real-estate-pro-tools',
    },
  },
})

// Create Supabase client for server-side operations (admin access)
export const createServerSupabaseClient = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!serviceRoleKey) {
    throw new Error('Missing Supabase service role key')
  }
  
  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    db: {
      schema: 'public',
    },
  })
}

// Helper function to handle Supabase errors
export const handleSupabaseError = (error: any) => {
  console.error('Supabase error:', error)
  
  if (error?.code === 'PGRST301') {
    return 'Resource not found'
  }
  
  if (error?.code === '23505') {
    return 'Resource already exists'
  }
  
  if (error?.code === '42501') {
    return 'Permission denied'
  }
  
  return error?.message || 'An unexpected error occurred'
}

// Type-safe query builders
export const createTypedSupabaseQuery = () => {
  return {
    profiles: () => supabase.from('profiles'),
    calculations: () => supabase.from('calculations'),
    clients: () => supabase.from('clients'),
    tasks: () => supabase.from('tasks'),
  }
}