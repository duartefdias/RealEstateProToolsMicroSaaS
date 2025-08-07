'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
})

type LoginFormData = z.infer<typeof loginSchema>

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { signIn, signInWithGoogle } = useAuth()
  
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const redirect = searchParams.get('redirect') || '/dashboard'
  const urlError = searchParams.get('error')
  const urlMessage = searchParams.get('message')

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await signIn(data.email, data.password)
      
      if (error) {
        setError(getErrorMessage(error.message))
        return
      }

      // Successful login
      router.push(redirect)
      router.refresh()
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true)
    setError(null)

    try {
      const { error } = await signInWithGoogle()
      
      if (error) {
        setError(getErrorMessage(error.message))
        return
      }

      // OAuth redirect will be handled automatically
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      setIsGoogleLoading(false)
    }
  }

  const getErrorMessage = (errorMessage: string) => {
    if (errorMessage.includes('Invalid login credentials')) {
      return 'Invalid email or password. Please check your credentials and try again.'
    }
    if (errorMessage.includes('Email not confirmed')) {
      return 'Please check your email and click the confirmation link before signing in.'
    }
    if (errorMessage.includes('Too many requests')) {
      return 'Too many login attempts. Please wait a few minutes before trying again.'
    }
    return errorMessage
  }

  const getUrlErrorMessage = (error: string | null) => {
    if (!error) return null
    
    switch (error) {
      case 'auth_callback_failed':
        return 'Authentication failed. Please try signing in again.'
      case 'auth_callback_exception':
        return 'An error occurred during authentication. Please try again.'
      case 'no_auth_code':
        return 'Authentication was incomplete. Please try signing in again.'
      case 'auth_failed':
        return 'Authentication failed. Please try signing in again.'
      default:
        return 'An authentication error occurred.'
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          Sign In
        </CardTitle>
        <CardDescription className="text-center">
          Enter your email and password to access your account
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* URL Error Message */}
        {urlError && (
          <Alert variant="destructive">
            <AlertDescription>
              {urlMessage || getUrlErrorMessage(urlError)}
            </AlertDescription>
          </Alert>
        )}

        {/* Form Error Message */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Google OAuth Button */}
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleGoogleSignIn}
          disabled={isGoogleLoading || isLoading}
        >
          {isGoogleLoading ? (
            <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Icons.google className="mr-2 h-4 w-4" />
          )}
          Continue with Google
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with email
            </span>
          </div>
        </div>

        {/* Email/Password Form */}
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              autoComplete="email"
              disabled={isLoading || isGoogleLoading}
              {...form.register('email')}
            />
            {form.formState.errors.email && (
              <p className="text-sm text-destructive">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              autoComplete="current-password"
              disabled={isLoading || isGoogleLoading}
              {...form.register('password')}
            />
            {form.formState.errors.password && (
              <p className="text-sm text-destructive">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>

          <div className="flex items-center justify-end">
            <Link
              href="/auth/forgot-password"
              className="text-sm text-primary hover:underline"
            >
              Forgot your password?
            </Link>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || isGoogleLoading}
          >
            {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
            Sign In
          </Button>
        </form>
      </CardContent>
      
      <CardFooter className="flex flex-col space-y-4">
        <div className="text-sm text-center text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link
            href="/auth/signup"
            className="text-primary hover:underline font-medium"
          >
            Sign up
          </Link>
        </div>
      </CardFooter>
    </Card>
  )
}