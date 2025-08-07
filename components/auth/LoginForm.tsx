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
    .min(1, 'Email é obrigatório')
    .email('Por favor introduza um endereço de email válido'),
  password: z
    .string()
    .min(1, 'Palavra-passe é obrigatória')
    .min(6, 'A palavra-passe deve ter pelo menos 6 caracteres'),
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
      setError('Ocorreu um erro inesperado. Por favor tente novamente.')
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
      setError('Ocorreu um erro inesperado. Por favor tente novamente.')
      setIsGoogleLoading(false)
    }
  }

  const getErrorMessage = (errorMessage: string) => {
    if (errorMessage.includes('Invalid login credentials')) {
      return 'Email ou palavra-passe inválidos. Por favor verifique as suas credenciais e tente novamente.'
    }
    if (errorMessage.includes('Email not confirmed')) {
      return 'Por favor verifique o seu email e clique no link de confirmação antes de iniciar sessão.'
    }
    if (errorMessage.includes('Too many requests')) {
      return 'Demasiadas tentativas de login. Por favor aguarde alguns minutos antes de tentar novamente.'
    }
    return errorMessage
  }

  const getUrlErrorMessage = (error: string | null) => {
    if (!error) return null
    
    switch (error) {
      case 'auth_callback_failed':
        return 'Falha na autenticação. Por favor tente iniciar sessão novamente.'
      case 'auth_callback_exception':
        return 'Ocorreu um erro durante a autenticação. Por favor tente novamente.'
      case 'no_auth_code':
        return 'A autenticação ficou incompleta. Por favor tente iniciar sessão novamente.'
      case 'auth_failed':
        return 'Falha na autenticação. Por favor tente iniciar sessão novamente.'
      default:
        return 'Ocorreu um erro de autenticação.'
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          Iniciar Sessão
        </CardTitle>
        <CardDescription className="text-center">
          Introduza o seu email e palavra-passe para aceder à sua conta
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
          Continuar com Google
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Ou continuar com email
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
              placeholder="nome@exemplo.com"
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
            <Label htmlFor="password">Palavra-passe</Label>
            <Input
              id="password"
              type="password"
              placeholder="Introduza a sua palavra-passe"
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
              Esqueceu-se da palavra-passe?
            </Link>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || isGoogleLoading}
          >
            {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
            Iniciar Sessão
          </Button>
        </form>
      </CardContent>
      
      <CardFooter className="flex flex-col space-y-4">
        <div className="text-sm text-center text-muted-foreground">
          Não tem uma conta?{' '}
          <Link
            href="/auth/signup"
            className="text-primary hover:underline font-medium"
          >
            Registar-se
          </Link>
        </div>
      </CardFooter>
    </Card>
  )
}