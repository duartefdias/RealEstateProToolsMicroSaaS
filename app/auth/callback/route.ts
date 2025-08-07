import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Database } from '@/lib/database/types'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/dashboard'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    )

    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Auth callback error:', error)
        return NextResponse.redirect(
          `${requestUrl.origin}/auth/login?error=auth_callback_failed&message=${encodeURIComponent(error.message)}`
        )
      }

      if (data.session) {
        // Successful authentication, redirect to intended destination
        return NextResponse.redirect(`${requestUrl.origin}${next}`)
      }
    } catch (error) {
      console.error('Auth callback exception:', error)
      return NextResponse.redirect(
        `${requestUrl.origin}/auth/login?error=auth_callback_exception`
      )
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(
    `${requestUrl.origin}/auth/login?error=no_auth_code`
  )
}