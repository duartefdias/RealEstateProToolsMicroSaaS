// Database hooks for React components
import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth/context'
import { supabase } from './supabase'
import type { 
  Profile, 
  Client, 
  Task, 
  Calculation, 
  UsageLimit, 
  ClientStats, 
  TaskStats,
  PaymentStats,
  UsageStats 
} from './types'

// Custom hook for user profile
export function useProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProfile() {
      if (!user) {
        setProfile(null)
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (error) throw error
        setProfile(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch profile')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [user])

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: 'No user logged in' }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single()

      if (error) throw error
      setProfile(data)
      return { data, error: null }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to update profile'
      setError(error)
      return { data: null, error }
    }
  }

  return { profile, loading, error, updateProfile }
}

// Custom hook for usage limits
export function useUsageLimit() {
  const { user } = useAuth()
  const [usageLimit, setUsageLimit] = useState<UsageLimit | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUsageLimit = async () => {
    if (!user) {
      setUsageLimit(null)
      setLoading(false)
      return
    }

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier, daily_calculations_used, last_calculation_reset')
        .eq('id', user.id)
        .single()

      if (profile) {
        const limit = profile.subscription_tier === 'pro' ? Infinity :
                     profile.subscription_tier === 'registered' ? 10 : 5
        
        const resetTime = new Date()
        resetTime.setDate(resetTime.getDate() + 1)
        resetTime.setHours(0, 0, 0, 0)

        setUsageLimit({
          daily_limit: limit,
          current_usage: profile.daily_calculations_used,
          can_calculate: profile.daily_calculations_used < limit,
          reset_time: resetTime
        })
      }
    } catch (err) {
      console.error('Error fetching usage limit:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsageLimit()
  }, [user])

  return { usageLimit, loading, refetch: fetchUsageLimit }
}

// Custom hook for clients
export function useClients() {
  const { user } = useAuth()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchClients() {
      if (!user) {
        setClients([])
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (error) throw error
        setClients(data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch clients')
      } finally {
        setLoading(false)
      }
    }

    fetchClients()

    // Set up real-time subscription
    const subscription = supabase
      .channel('clients_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'clients',
          filter: `user_id=eq.${user?.id}`
        }, 
        () => fetchClients()
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [user])

  const createClient = async (clientData: Omit<Client, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return { error: 'No user logged in' }

    try {
      const { data, error } = await supabase
        .from('clients')
        .insert({ ...clientData, user_id: user.id })
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to create client'
      return { data: null, error }
    }
  }

  const updateClient = async (id: string, updates: Partial<Client>) => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user?.id)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to update client'
      return { data: null, error }
    }
  }

  const deleteClient = async (id: string) => {
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id)

      if (error) throw error
      return { error: null }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to delete client'
      return { error }
    }
  }

  return { 
    clients, 
    loading, 
    error, 
    createClient, 
    updateClient, 
    deleteClient 
  }
}

// Custom hook for tasks
export function useTasks(clientId?: string) {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchTasks() {
      if (!user) {
        setTasks([])
        setLoading(false)
        return
      }

      try {
        let query = supabase
          .from('tasks')
          .select('*')
          .eq('user_id', user.id)

        if (clientId) {
          query = query.eq('client_id', clientId)
        }

        const { data, error } = await query.order('created_at', { ascending: false })

        if (error) throw error
        setTasks(data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch tasks')
      } finally {
        setLoading(false)
      }
    }

    fetchTasks()

    // Set up real-time subscription
    const subscription = supabase
      .channel('tasks_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'tasks',
          filter: `user_id=eq.${user?.id}`
        }, 
        () => fetchTasks()
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [user, clientId])

  const createTask = async (taskData: Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return { error: 'No user logged in' }

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({ ...taskData, user_id: user.id })
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to create task'
      return { data: null, error }
    }
  }

  const updateTask = async (id: string, updates: Partial<Task>) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user?.id)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to update task'
      return { data: null, error }
    }
  }

  const deleteTask = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id)

      if (error) throw error
      return { error: null }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to delete task'
      return { error }
    }
  }

  return { 
    tasks, 
    loading, 
    error, 
    createTask, 
    updateTask, 
    deleteTask 
  }
}

// Custom hook for calculations history
export function useCalculations() {
  const { user } = useAuth()
  const [calculations, setCalculations] = useState<Calculation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchCalculations() {
      if (!user) {
        setCalculations([])
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('calculations')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50) // Limit to last 50 calculations

        if (error) throw error
        setCalculations(data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch calculations')
      } finally {
        setLoading(false)
      }
    }

    fetchCalculations()
  }, [user])

  return { calculations, loading, error }
}

// Custom hook for client statistics
export function useClientStats() {
  const { user } = useAuth()
  const [stats, setStats] = useState<ClientStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .rpc('get_client_statistics', { p_user_id: user.id })

        if (error) throw error
        setStats(data)
      } catch (err) {
        console.error('Error fetching client stats:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [user])

  return { stats, loading }
}

// Custom hook for task statistics
export function useTaskStats() {
  const { user } = useAuth()
  const [stats, setStats] = useState<TaskStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .rpc('get_task_statistics', { p_user_id: user.id })

        if (error) throw error
        setStats(data)
      } catch (err) {
        console.error('Error fetching task stats:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [user])

  return { stats, loading }
}

// Custom hook for payment statistics
export function usePaymentStats() {
  const { user } = useAuth()
  const [stats, setStats] = useState<PaymentStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .rpc('get_user_payment_stats', { p_user_id: user.id })

        if (error) throw error
        setStats(data)
      } catch (err) {
        console.error('Error fetching payment stats:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [user])

  return { stats, loading }
}

// Custom hook for usage statistics
export function useUsageStats() {
  const { user } = useAuth()
  const [stats, setStats] = useState<UsageStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        // Get total calculations
        const { data: calculationsData } = await supabase
          .from('calculations')
          .select('calculator_type, created_at')
          .eq('user_id', user.id)

        if (calculationsData) {
          const totalCalculations = calculationsData.length
          const today = new Date().toISOString().split('T')[0]
          const calculationsToday = calculationsData.filter(c => 
            c.created_at.split('T')[0] === today
          ).length

          // Find most used calculator
          const calculatorCounts: Record<string, number> = {}
          calculationsData.forEach(c => {
            calculatorCounts[c.calculator_type] = (calculatorCounts[c.calculator_type] || 0) + 1
          })
          
          const mostUsedCalculator = Object.entries(calculatorCounts)
            .sort(([,a], [,b]) => b - a)[0]?.[0] || null

          // Calculate average per day (last 30 days)
          const thirtyDaysAgo = new Date()
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
          const recentCalculations = calculationsData.filter(c => 
            new Date(c.created_at) >= thirtyDaysAgo
          ).length
          const avgCalculationsPerDay = Math.round(recentCalculations / 30 * 10) / 10

          setStats({
            total_calculations: totalCalculations,
            calculations_today: calculationsToday,
            most_used_calculator: mostUsedCalculator as any,
            avg_calculations_per_day: avgCalculationsPerDay
          })
        }
      } catch (err) {
        console.error('Error fetching usage stats:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [user])

  return { stats, loading }
}