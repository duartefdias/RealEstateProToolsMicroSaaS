'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '@/lib/database/supabase'
import { Profile, UsageLimit } from '@/lib/database/types'

interface AuthContextType {
  // User state
  user: User | null
  profile: Profile | null
  session: Session | null
  
  // Loading states
  loading: boolean
  profileLoading: boolean
  
  // Usage tracking
  usageLimit: UsageLimit | null
  
  // Auth methods
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: AuthError | null }>
  signInWithGoogle: () => Promise<{ error: AuthError | null }>
  signOut: () => Promise<{ error: AuthError | null }>
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>
  
  // Profile methods
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: string | null }>
  refreshProfile: () => Promise<void>
  
  // Usage methods
  refreshUsageLimit: () => Promise<void>
  canCalculate: () => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)
  const [usageLimit, setUsageLimit] = useState<UsageLimit | null>(null)

  // Initialize auth state
  useEffect(() => {
    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          console.error('Error getting session:', error)
        } else {
          setSession(session)
          setUser(session?.user ?? null)
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event)
        setSession(session)
        setUser(session?.user ?? null)
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          // Fetch profile when user signs in
          if (session?.user) {
            await fetchProfile(session.user.id)
            await fetchUsageLimit(session.user.id)
          }
        } else if (event === 'SIGNED_OUT') {
          // Clear profile when user signs out
          setProfile(null)
          setUsageLimit(null)
        }
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Fetch user profile
  const fetchProfile = async (userId: string) => {
    setProfileLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        return
      }

      setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setProfileLoading(false)
    }
  }

  // Fetch usage limit
  const fetchUsageLimit = async (userId: string) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier, daily_calculations_used, last_calculation_reset')
        .eq('id', userId)
        .single()

      if (profile) {
        const limit = profile.subscription_tier === 'pro' || profile.subscription_tier === 'admin' 
          ? Infinity 
          : profile.subscription_tier === 'registered' ? 10 : 5
        
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
    } catch (error) {
      console.error('Error fetching usage limit:', error)
    }
  }

  // Sign in with email/password
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  // Sign up with email/password
  const signUp = async (email: string, password: string, fullName?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })
    return { error }
  }

  // Sign in with Google OAuth
  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    return { error }
  }

  // Sign out
  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (!error) {
      setUser(null)
      setProfile(null)
      setSession(null)
      setUsageLimit(null)
    }
    return { error }
  }

  // Reset password
  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    return { error }
  }

  // Update profile
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
      return { error: null }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile'
      console.error('Error updating profile:', error)
      return { error: errorMessage }
    }
  }

  // Refresh profile
  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id)
    }
  }

  // Refresh usage limit
  const refreshUsageLimit = async () => {
    if (user) {
      await fetchUsageLimit(user.id)
    }
  }

  // Check if user can calculate
  const canCalculate = () => {
    if (!usageLimit) return false
    return usageLimit.can_calculate
  }

  const value: AuthContextType = {
    user,
    profile,
    session,
    loading,
    profileLoading,
    usageLimit,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    resetPassword,
    updateProfile,
    refreshProfile,
    refreshUsageLimit,
    canCalculate,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}