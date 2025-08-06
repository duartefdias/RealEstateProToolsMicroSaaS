import { supabase, handleSupabaseError } from './supabase'
import { Profile } from '@/types/user'

export const getProfile = async (userId: string): Promise<Profile | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Profile not found
      }
      throw error
    }

    return {
      ...data,
      last_calculation_reset: new Date(data.last_calculation_reset),
      created_at: new Date(data.created_at),
    }
  } catch (error) {
    console.error('Error fetching profile:', error)
    return null
  }
}

export const createProfile = async (
  userId: string,
  email: string,
  fullName?: string
): Promise<Profile | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email,
        full_name: fullName,
        subscription_tier: 'free',
        daily_calculations_used: 0,
        last_calculation_reset: new Date().toISOString().split('T')[0],
      })
      .select()
      .single()

    if (error) throw error

    return {
      ...data,
      last_calculation_reset: new Date(data.last_calculation_reset),
      created_at: new Date(data.created_at),
    }
  } catch (error) {
    console.error('Error creating profile:', handleSupabaseError(error))
    return null
  }
}

export const updateProfile = async (
  userId: string,
  updates: Partial<Profile>
): Promise<Profile | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error

    return {
      ...data,
      last_calculation_reset: new Date(data.last_calculation_reset),
      created_at: new Date(data.created_at),
    }
  } catch (error) {
    console.error('Error updating profile:', handleSupabaseError(error))
    return null
  }
}

export const incrementDailyCalculations = async (userId: string): Promise<boolean> => {
  try {
    const { error } = await supabase.rpc('increment_daily_calculations', {
      user_id: userId,
    })

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error incrementing calculations:', handleSupabaseError(error))
    return false
  }
}

export const resetDailyUsage = async (userId: string): Promise<boolean> => {
  try {
    const today = new Date().toISOString().split('T')[0]
    
    const { error } = await supabase
      .from('profiles')
      .update({
        daily_calculations_used: 0,
        last_calculation_reset: today,
      })
      .eq('id', userId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error resetting daily usage:', handleSupabaseError(error))
    return false
  }
}