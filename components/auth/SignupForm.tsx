'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { Icons } from '@/components/ui/icons'
import { useAuth } from '@/lib/auth/context'

const signupSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(50, 'Full name must be less than 50 characters'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  confirmPassword: z
    .string()
    .min(1, 'Please confirm your password'),
  acceptTerms: z
    .boolean()
    .refine((val) => val === true, 'You must accept the terms and conditions'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

type SignupFormData = z.infer<typeof signupSchema>

export function SignupForm() {
  const router = useRouter()
  const { signUp, signInWithGoogle } = useAuth()
  
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
    },
  })

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const { error } = await signUp(data.email, data.password, data.fullName)
      
      if (error) {
        setError(getErrorMessage(error.message))
        return
      }

      // Successful signup
      setSuccess(true)
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
    if (errorMessage.includes('User already registered')) {
      return 'An account with this email already exists. Please sign in instead.'
    }
    if (errorMessage.includes('Password should be at least')) {
      return 'Password must be at least 6 characters long.'
    }
    if (errorMessage.includes('Invalid email')) {
      return 'Please enter a valid email address.'
    }
    if (errorMessage.includes('Signup requires a valid password')) {
      return 'Please enter a valid password.'
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
            We&apos;ve sent a confirmation link to your email address
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Alert>
            <Icons.mail className="h-4 w-4" />
            <AlertDescription>
              Please check your email and click the confirmation link to activate your account.
              Don&apos;t forget to check your spam folder!
            </AlertDescription>
          </Alert>
          
          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.push('/auth/login')}
          >
            Return to Sign In
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          Create Account
        </CardTitle>
        <CardDescription className="text-center">
          Get started with your Real Estate Pro Tools account
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
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
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              type="text"
              placeholder="John Doe"
              autoComplete="name"
              disabled={isLoading || isGoogleLoading}
              {...form.register('fullName')}
            />
            {form.formState.errors.fullName && (
              <p className="text-sm text-destructive">
                {form.formState.errors.fullName.message}
              </p>
            )}
          </div>

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
              placeholder="Create a strong password"
              autoComplete="new-password"
              disabled={isLoading || isGoogleLoading}
              {...form.register('password')}
            />
            {form.formState.errors.password && (
              <p className="text-sm text-destructive">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              autoComplete="new-password"
              disabled={isLoading || isGoogleLoading}
              {...form.register('confirmPassword')}
            />
            {form.formState.errors.confirmPassword && (
              <p className="text-sm text-destructive">
                {form.formState.errors.confirmPassword.message}
              </p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="acceptTerms"
              disabled={isLoading || isGoogleLoading}
              checked={form.watch('acceptTerms')}
              onCheckedChange={(checked) => 
                form.setValue('acceptTerms', !!checked)
              }
            />
            <Label 
              htmlFor="acceptTerms" 
              className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              I agree to the{' '}
              <Link href="/terms" className="text-primary hover:underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
            </Label>
          </div>
          {form.formState.errors.acceptTerms && (
            <p className="text-sm text-destructive">
              {form.formState.errors.acceptTerms.message}
            </p>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || isGoogleLoading}
          >
            {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
            Create Account
          </Button>
        </form>
      </CardContent>
      
      <CardFooter className="flex flex-col space-y-4">
        <div className="text-sm text-center text-muted-foreground">
          Already have an account?{' '}
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