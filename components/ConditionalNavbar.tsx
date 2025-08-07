'use client'

import { usePathname } from 'next/navigation'
import MainNavbar from './MainNavbar'

export function ConditionalNavbar() {
  const pathname = usePathname()
  
  // Hide navbar on auth pages
  const hideNavbarRoutes = [
    '/auth/login',
    '/auth/signup', 
    '/auth/forgot-password',
    '/auth/callback'
  ]
  
  const shouldHideNavbar = hideNavbarRoutes.some(route => pathname.startsWith(route))
  
  if (shouldHideNavbar) {
    return null
  }
  
  return <MainNavbar />
}