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
    .min(2, 'O nome completo deve ter pelo menos 2 caracteres')
    .max(50, 'O nome completo deve ter menos de 50 caracteres'),
  email: z
    .string()
    .min(1, 'Email é obrigatório')
    .email('Por favor introduza um endereço de email válido'),
  password: z
    .string()
    .min(8, 'A palavra-passe deve ter pelo menos 8 caracteres')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'A palavra-passe deve conter pelo menos uma letra maiúscula, uma minúscula e um número'
    ),
  confirmPassword: z
    .string()
    .min(1, 'Por favor confirme a sua palavra-passe'),
  acceptTerms: z
    .boolean()
    .refine((val) => val === true, 'Deve aceitar os termos e condições'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As palavras-passe não coincidem",
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
    if (errorMessage.includes('User already registered')) {
      return 'Já existe uma conta com este email. Por favor inicie sessão.'
    }
    if (errorMessage.includes('Password should be at least')) {
      return 'A palavra-passe deve ter pelo menos 6 caracteres.'
    }
    if (errorMessage.includes('Invalid email')) {
      return 'Por favor introduza um endereço de email válido.'
    }
    if (errorMessage.includes('Signup requires a valid password')) {
      return 'Por favor introduza uma palavra-passe válida.'
    }
    return errorMessage
  }

  if (success) {
    return (
      <Card className="w-full">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center text-green-600">
            Verifique o Seu Email
          </CardTitle>
          <CardDescription className="text-center">
            Enviámos um link de confirmação para o seu endereço de email
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Alert>
            <Icons.mail className="h-4 w-4" />
            <AlertDescription>
              Por favor verifique o seu email e clique no link de confirmação para ativar a sua conta.
              Não se esqueça de verificar a pasta de spam!
            </AlertDescription>
          </Alert>
          
          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.push('/auth/login')}
          >
            Voltar ao Iniciar Sessão
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          Criar Conta
        </CardTitle>
        <CardDescription className="text-center">
          Comece com a sua conta Real Estate Pro Tools
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
            <Label htmlFor="fullName">Nome Completo</Label>
            <Input
              id="fullName"
              type="text"
              placeholder="João Silva"
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
              placeholder="Crie uma palavra-passe forte"
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
            <Label htmlFor="confirmPassword">Confirmar Palavra-passe</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirme a sua palavra-passe"
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
              Concordo com os{' '}
              <Link href="/terms" className="text-primary hover:underline">
                Termos de Serviço
              </Link>{' '}
              e{' '}
              <Link href="/privacy" className="text-primary hover:underline">
                Política de Privacidade
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
            Criar Conta
          </Button>
        </form>
      </CardContent>
      
      <CardFooter className="flex flex-col space-y-4">
        <div className="text-sm text-center text-muted-foreground">
          Já tem uma conta?{' '}
          <Link
            href="/auth/login"
            className="text-primary hover:underline font-medium"
          >
            Iniciar sessão
          </Link>
        </div>
      </CardFooter>
    </Card>
  )
}