'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/context'
import { supabase } from '@/lib/database/supabase'

export default function AuthCallbackPage() {
  const router = useRouter()
  const { refreshProfile, refreshUsageLimit } = useAuth()
  const [status, setStatus] = useState('Processing authentication...')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleAuthCallback = async () => {
      console.log('🔐 Auth callback started')
      console.log('🔐 URL:', window.location.href)

      try {
        // Check for OAuth errors first
        const searchParams = new URLSearchParams(window.location.search)
        const error_code = searchParams.get('error')
        const error_description = searchParams.get('error_description')
        
        if (error_code) {
          console.error('🔐 OAuth error:', { error_code, error_description })
          setError(`OAuth error: ${error_description || error_code}`)
          setTimeout(() => {
            router.push(`/auth/login?error=oauth_error&message=${encodeURIComponent(error_description || error_code)}`)
          }, 2000)
          return
        }

        // Let Supabase handle the session automatically (it detects tokens in URL)
        console.log('🔐 Checking for session...')
        setStatus('Verifying authentication...')
        
        // Small delay to let Supabase process the URL fragments
        await new Promise(resolve => setTimeout(resolve, 500))
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        console.log('🔐 Session check result:', {
          hasSession: !!session,
          hasUser: !!session?.user,
          error: sessionError?.message
        })

        if (sessionError) {
          console.error('🔐 Session error:', sessionError)
          setError('Failed to verify authentication')
          setTimeout(() => {
            router.push('/auth/login?error=session_error')
          }, 2000)
          return
        }

        if (session && session.user) {
          console.log('🔐 Authentication successful:', session.user.id)
          setStatus('Creating user profile...')

          // Handle profile creation/update
          try {
            const { data: existingProfile, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single()

            // Only create profile if it doesn't exist (ignore "not found" errors)
            if (!existingProfile && profileError?.code === 'PGRST116') {
              console.log('🔐 Creating new user profile')
              const { error: createError } = await supabase
                .from('profiles')
                .insert({
                  id: session.user.id,
                  email: session.user.email!,
                  full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || null,
                  subscription_tier: 'registered',
                  daily_calculations_used: 0,
                  last_calculation_reset: new Date().toISOString().split('T')[0]
                })

              if (createError) {
                console.error('🔐 Profile creation error:', createError)
              } else {
                console.log('🔐 Profile created successfully')
              }
            } else if (existingProfile) {
              console.log('🔐 User profile already exists')
            } else if (profileError) {
              console.error('🔐 Profile check error:', profileError)
            }

            // Refresh auth context
            setStatus('Loading user data...')
            await refreshProfile()
            await refreshUsageLimit()

            // Clear the hash from URL to clean up
            if (window.location.hash) {
              window.history.replaceState(null, '', window.location.pathname)
            }

            setStatus('Redirecting to dashboard...')
            console.log('🔐 Redirecting to dashboard')
            router.push('/dashboard')
          } catch (profileError) {
            console.error('🔐 Profile handling error:', profileError)
            // Don't fail auth if profile creation fails
            setStatus('Redirecting...')
            router.push('/dashboard')
          }
        } else {
          console.error('🔐 No session found after OAuth')
          setError('Authentication failed - no session created')
          setTimeout(() => {
            router.push('/auth/login?error=no_session')
          }, 2000)
        }
      } catch (error) {
        console.error('🔐 Auth callback error:', error)
        setError('Authentication processing failed')
        setTimeout(() => {
          router.push(`/auth/login?error=callback_exception`)
        }, 2000)
      }
    }

    handleAuthCallback()
  }, [router, refreshProfile, refreshUsageLimit])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-4 p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">
            {error ? 'Authentication Failed' : 'Completing Sign In'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {error ? error : status}
          </p>
          {!error && (
            <div className="mt-4 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          )}
          {error && (
            <p className="mt-4 text-xs text-gray-500">
              You will be redirected to the login page shortly...
            </p>
          )}
        </div>
      </div>
    </div>
  )
}