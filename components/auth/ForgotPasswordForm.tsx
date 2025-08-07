'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Icons } from '@/components/ui/icons'
import { useAuth } from '@/lib/auth/context'

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
})

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

export function ForgotPasswordForm() {
  const { resetPassword } = useAuth()
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  })

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const { error } = await resetPassword(data.email)
      
      if (error) {
        setError(getErrorMessage(error.message))
        return
      }

      // Successful password reset request
      setSuccess(true)
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const getErrorMessage = (errorMessage: string) => {
    if (errorMessage.includes('User not found')) {
      return 'No account found with this email address.'
    }
    if (errorMessage.includes('Invalid email')) {
      return 'Please enter a valid email address.'
    }
    return errorMessage
  }

  if (success) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center text-green-600">
            Check Your Email
          </CardTitle>
          <CardDescription className="text-center">
            We&apos;ve sent password reset instructions to your email
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Alert>
            <Icons.mail className="h-4 w-4" />
            <AlertDescription>
              If an account with that email exists, we&apos;ve sent you a password reset link.
              Please check your email and follow the instructions to reset your password.
            </AlertDescription>
          </Alert>
          
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setSuccess(false)}
          >
            Send Another Email
          </Button>
        </CardContent>
        
        <CardFooter>
          <div className="text-sm text-center text-muted-foreground">
            Remember your password?{' '}
            <Link
              href="/auth/login"
              className="text-primary hover:underline font-medium"
            >
              Sign in
            </Link>
          </div>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          Forgot Password
        </CardTitle>
        <CardDescription className="text-center">
          Enter your email address and we&apos;ll send you a password reset link
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Form Error Message */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              autoComplete="email"
              disabled={isLoading}
              {...form.register('email')}
            />
            {form.formState.errors.email && (
              <p className="text-sm text-destructive">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
            Send Reset Link
          </Button>
        </form>
      </CardContent>
      
      <CardFooter>
        <div className="text-sm text-center text-muted-foreground">
          Remember your password?{' '}
          <Link
            href="/auth/login"
            className="text-primary hover:underline font-medium"
          >
            Sign in
          </Link>
        </div>
      </CardFooter>
    </Card>
  )
}