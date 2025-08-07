import { Metadata } from 'next'
import { Suspense } from 'react'
import Link from 'next/link'
import { LoginForm } from '@/components/auth/LoginForm'

export const metadata: Metadata = {
  title: 'Iniciar Sessão - Real Estate Pro Tools',
  description: 'Inicie sessão na sua conta Real Estate Pro Tools',
}

function LoginFormWithSuspense() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center p-8">A carregar...</div>}>
      <LoginForm />
    </Suspense>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-8 w-8 text-primary"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9,22 9,12 15,12 15,22" />
            </svg>
            <div>
              <h1 className="text-xl font-bold text-foreground">Real Estate Pro Tools</h1>
              <p className="text-xs text-muted-foreground">Ferramentas Profissionais de Imobiliário</p>
            </div>
          </Link>
        </div>
        <LoginFormWithSuspense />
      </div>
    </div>
  )
}