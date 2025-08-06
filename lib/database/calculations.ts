import { supabase, handleSupabaseError } from './supabase'
import { CalculationType, CalculationResult } from '@/types/calculator'

export interface CalculationRecord {
  id: string
  user_id: string | null
  calculator_type: CalculationType
  input_data: Record<string, any>
  result_data: CalculationResult
  ip_address?: string
  session_id?: string
  created_at: Date
}

export const saveCalculation = async (
  calculation: Omit<CalculationRecord, 'id' | 'created_at'>
): Promise<CalculationRecord | null> => {
  try {
    const { data, error } = await supabase
      .from('calculations')
      .insert({
        user_id: calculation.user_id,
        calculator_type: calculation.calculator_type,
        input_data: calculation.input_data,
        result_data: calculation.result_data,
        ip_address: calculation.ip_address,
        session_id: calculation.session_id,
      })
      .select()
      .single()

    if (error) throw error

    return {
      ...data,
      created_at: new Date(data.created_at),
    }
  } catch (error) {
    console.error('Error saving calculation:', handleSupabaseError(error))
    return null
  }
}

export const getUserCalculations = async (
  userId: string,
  limit = 10
): Promise<CalculationRecord[]> => {
  try {
    const { data, error } = await supabase
      .from('calculations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    return data.map(record => ({
      ...record,
      created_at: new Date(record.created_at),
    }))
  } catch (error) {
    console.error('Error fetching user calculations:', handleSupabaseError(error))
    return []
  }
}

export const getAnonymousUsage = async (
  ipAddress: string,
  sessionId: string
): Promise<number> => {
  try {
    const today = new Date().toISOString().split('T')[0]
    
    const { count, error } = await supabase
      .from('calculations')
      .select('*', { count: 'exact', head: true })
      .or(`ip_address.eq.${ipAddress},session_id.eq.${sessionId}`)
      .gte('created_at', `${today}T00:00:00.000Z`)
      .lt('created_at', `${today}T23:59:59.999Z`)

    if (error) throw error

    return count || 0
  } catch (error) {
    console.error('Error fetching anonymous usage:', handleSupabaseError(error))
    return 0
  }
}

export const getCalculationStats = async (
  userId?: string
): Promise<{
  total: number
  today: number
  thisWeek: number
  thisMonth: number
}> => {
  try {
    const today = new Date()
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
    const todayStr = today.toISOString().split('T')[0]

    // Build base query
    let baseQuery = supabase.from('calculations').select('*', { count: 'exact', head: true })
    if (userId) {
      baseQuery = baseQuery.eq('user_id', userId)
    }

    // Get total count
    const { count: total } = await baseQuery

    // Get today's count
    let todayQuery = supabase.from('calculations').select('*', { count: 'exact', head: true })
    if (userId) {
      todayQuery = todayQuery.eq('user_id', userId)
    }
    const { count: todayCount } = await todayQuery
      .gte('created_at', `${todayStr}T00:00:00.000Z`)
      .lt('created_at', `${todayStr}T23:59:59.999Z`)

    // Get this week's count
    let weekQuery = supabase.from('calculations').select('*', { count: 'exact', head: true })
    if (userId) {
      weekQuery = weekQuery.eq('user_id', userId)
    }
    const { count: weekCount } = await weekQuery.gte('created_at', weekAgo.toISOString())

    // Get this month's count
    let monthQuery = supabase.from('calculations').select('*', { count: 'exact', head: true })
    if (userId) {
      monthQuery = monthQuery.eq('user_id', userId)
    }
    const { count: monthCount } = await monthQuery.gte('created_at', monthAgo.toISOString())

    return {
      total: total || 0,
      today: todayCount || 0,
      thisWeek: weekCount || 0,
      thisMonth: monthCount || 0,
    }
  } catch (error) {
    console.error('Error fetching calculation stats:', handleSupabaseError(error))
    return { total: 0, today: 0, thisWeek: 0, thisMonth: 0 }
  }
}