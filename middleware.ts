import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Database } from '@/lib/database/types'

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value))
          res = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session if expired - required for Server Components
  const { data: { session } } = await supabase.auth.getSession()

  const url = req.nextUrl.clone()
  
  // Protected routes that require authentication
  const protectedRoutes = [
    '/dashboard',
    '/profile',
    '/client-management',
    '/settings',
    '/billing'
  ]

  // Routes that require Pro subscription
  const proRoutes = [
    '/client-management',
    '/billing'
  ]

  // Public routes that redirect authenticated users
  const publicRoutes = [
    '/auth/login',
    '/auth/signup',
    '/auth/forgot-password'
  ]

  const isProtectedRoute = protectedRoutes.some(route => 
    url.pathname.startsWith(route)
  )
  
  const isProRoute = proRoutes.some(route => 
    url.pathname.startsWith(route)
  )
  
  const isPublicAuthRoute = publicRoutes.some(route => 
    url.pathname.startsWith(route)
  )

  // Handle authentication redirects
  if (!session && isProtectedRoute) {
    // Store the intended destination
    url.pathname = '/auth/login'
    url.searchParams.set('redirect', req.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from auth pages
  if (session && isPublicAuthRoute) {
    url.pathname = '/dashboard'
    url.searchParams.delete('redirect')
    return NextResponse.redirect(url)
  }

  // Check Pro subscription for Pro-only routes
  if (session && isProRoute) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', session.user.id)
      .single()

    if (!profile || profile.subscription_tier !== 'pro') {
      // Redirect to upgrade page
      url.pathname = '/pricing'
      url.searchParams.set('upgrade', 'required')
      return NextResponse.redirect(url)
    }
  }

  // Skip middleware processing for auth callback - let the route handler deal with it
  if (url.pathname === '/auth/callback') {
    return res
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}