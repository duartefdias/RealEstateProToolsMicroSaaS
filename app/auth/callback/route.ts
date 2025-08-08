import { NextResponse } from 'next/server'
import { createClient } from '@/lib/auth/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  console.log('🔐 Server-side auth callback started')
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  let next = searchParams.get('next') ?? '/dashboard'
  
  console.log('🔐 Callback params:', {
    hasCode: !!code,
    next,
    fullUrl: request.url
  })

  if (!next.startsWith('/')) {
    next = '/dashboard'
  }

  if (code) {
    console.log('🔐 Processing authorization code on server...')
    const supabase = await createClient()
    
    try {
      console.log('🔐 Exchanging code for session...')
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('🔐 Auth callback error:', error)
        return NextResponse.redirect(
          `${origin}/auth/login?error=auth_callback_failed&message=${encodeURIComponent(error.message)}`
        )
      }

      if (data.session && data.user) {
        console.log('🔐 Session created successfully on server:', data.user.id)
        
        // Handle profile creation
        try {
          const { data: existingProfile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single()

          if (!existingProfile && profileError?.code === 'PGRST116') {
            console.log('🔐 Creating new profile on server')
            const { error: createError } = await supabase
              .from('profiles')
              .insert({
                id: data.user.id,
                email: data.user.email!,
                full_name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || null,
                subscription_tier: 'registered',
                daily_calculations_used: 0,
                last_calculation_reset: new Date().toISOString().split('T')[0]
              })

            if (createError) {
              console.error('🔐 Profile creation error:', createError)
            } else {
              console.log('🔐 Profile created successfully on server')
            }
          } else if (existingProfile) {
            console.log('🔐 Profile already exists on server')
          }
        } catch (profileError) {
          console.error('🔐 Profile handling error on server:', profileError)
        }

        // Successful authentication, redirect to intended destination
        console.log('🔐 Redirecting to:', next)
        return NextResponse.redirect(`${origin}${next}`)
      } else {
        console.warn('🔐 No session created after successful code exchange')
        return NextResponse.redirect(
          `${origin}/auth/login?error=session_creation_failed`
        )
      }
    } catch (error) {
      console.error('🔐 Auth callback exception:', error)
      return NextResponse.redirect(
        `${origin}/auth/login?error=auth_callback_exception`
      )
    }
  }

  // No code parameter - this shouldn't happen with PKCE flow
  console.log('🔐 No code parameter found')
  return NextResponse.redirect(`${origin}/auth/login?error=no_code`)
}