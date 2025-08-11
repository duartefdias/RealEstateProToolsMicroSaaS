import { Metadata } from 'next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/ui/icons'
import Link from 'next/link'
import DashboardContent from '@/components/dashboard/DashboardContent'

export const metadata: Metadata = {
  title: 'Dashboard - Real Estate Pro Tools',
  description: 'Your Real Estate Pro Tools dashboard',
}

export default function DashboardPage() {
  return <DashboardContent />
}