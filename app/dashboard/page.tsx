import { Metadata } from 'next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/ui/icons'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Dashboard - Real Estate Pro Tools',
  description: 'Your Real Estate Pro Tools dashboard',
}

export default function DashboardPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to Real Estate Pro Tools. Get started with our professional calculators.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Icons.calculator className="h-5 w-5" />
                House Selling Calculator
              </CardTitle>
              <CardDescription>
                Calculate all costs associated with selling your property in Portugal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/calculators/sell-house">
                  Start Calculation
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Icons.home className="h-5 w-5" />
                House Buying Calculator
              </CardTitle>
              <CardDescription>
                Calculate IMT, stamp duty, and all buying costs for your property purchase
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href="/calculators/buy-house">
                  Coming Soon
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Icons.trending className="h-5 w-5" />
                Mortgage Simulator
              </CardTitle>
              <CardDescription>
                Simulate your mortgage payments and compare different scenarios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href="/calculators/mortgage-simulator">
                  Coming Soon
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Pro Features Preview */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icons.star className="h-5 w-5 text-primary" />
              Upgrade to Pro
            </CardTitle>
            <CardDescription>
              Unlock advanced features for professional real estate management
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2 text-sm">
              <div className="flex items-center gap-2">
                <Icons.check className="h-4 w-4 text-primary" />
                <span>Unlimited calculations</span>
              </div>
              <div className="flex items-center gap-2">
                <Icons.users className="h-4 w-4 text-primary" />
                <span>Client management system</span>
              </div>
              <div className="flex items-center gap-2">
                <Icons.tasks className="h-4 w-4 text-primary" />
                <span>Task and follow-up tracking</span>
              </div>
              <div className="flex items-center gap-2">
                <Icons.chart className="h-4 w-4 text-primary" />
                <span>Advanced reporting and analytics</span>
              </div>
            </div>
            <Button asChild>
              <Link href="/pricing">
                View Pricing Plans
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Your latest calculations and activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6 text-muted-foreground">
              <Icons.calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No calculations yet.</p>
              <p className="text-sm">Start with our House Selling Calculator above!</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}