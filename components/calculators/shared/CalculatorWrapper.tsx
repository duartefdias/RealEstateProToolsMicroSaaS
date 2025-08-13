'use client'

import React, { useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { UsageLimitModal, useUsageLimitModal } from '@/components/usage/UsageLimitBanner'
import { CompactPricingCard } from '@/components/payments/PricingPlans'
import { AlertCircle, Calculator, CheckCircle } from 'lucide-react'
import { useAuth } from '@/lib/auth/context'
import { UsageLimit } from '@/types/calculator'
import { CalculatorProvider } from '@/contexts/CalculatorContext'

interface CalculatorWrapperProps {
  title: string
  description?: string
  calculatorType: string
  children: ReactNode
  onCalculate?: () => void
}

interface UsageInfo {
  allowed: boolean
  remaining: number
  used: number
  limit: number
  resetTime: string
  userType: 'anonymous' | 'free' | 'registered' | 'pro'
  requiresUpgrade: boolean
  checkoutUrl?: string
}

export function CalculatorWrapper({ 
  title, 
  description, 
  calculatorType, 
  children, 
  onCalculate 
}: CalculatorWrapperProps) {
  const { user, profile } = useAuth()
  const router = useRouter()
  const [usageInfo, setUsageInfo] = useState<UsageInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)
  
  const {
    showUsageLimitModal,
    UsageLimitModal: UsageLimitModalComponent,
    isUsageLimitModalOpen
  } = useUsageLimitModal()

  // Check usage limits on component mount
  useEffect(() => {
    checkUsageLimits()
  }, [user])

  const checkUsageLimits = async () => {
    console.log('🔍 [CalculatorWrapper] checkUsageLimits called')
    console.log('🔍 [CalculatorWrapper] Calculator Type:', calculatorType)
    console.log('🔍 [CalculatorWrapper] User ID:', user?.id)
    
    setIsLoading(true)
    try {
      const response = await fetch('/api/usage/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          calculatorType,
          userId: user?.id
        })
      })

      console.log('🔍 [CalculatorWrapper] checkUsageLimits response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('🔍 [CalculatorWrapper] checkUsageLimits response data:', data)
        setUsageInfo(data)
        
        // Show upgrade prompt after 3rd calculation for non-pro users
        if (data.used >= 3 && data.userType !== 'pro' && !data.requiresUpgrade) {
          console.log('🔍 [CalculatorWrapper] Showing upgrade prompt for user with 3+ calculations')
          setShowUpgradePrompt(true)
        }
      } else {
        console.error('❌ [CalculatorWrapper] checkUsageLimits failed with status:', response.status)
      }
    } catch (error) {
      console.error('❌ [CalculatorWrapper] Error checking usage limits:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCalculationAttempt = async (): Promise<void> => {
    console.log('🔄 [CalculatorWrapper] handleCalculationAttempt called')
    console.log('🔄 [CalculatorWrapper] Current usage info:', usageInfo)
    console.log('🔄 [CalculatorWrapper] User ID:', user?.id)
    console.log('🔄 [CalculatorWrapper] Calculator type:', calculatorType)
    
    if (!usageInfo) {
      console.log('⚠️ [CalculatorWrapper] No usage info, checking limits...')
      await checkUsageLimits()
      return
    }

    // If user has reached limit, show blocking modal
    if (!usageInfo.allowed) {
      console.log('🚫 [CalculatorWrapper] Usage limit reached, showing modal')
      const modalProps: { usageInfo: UsageLimit; resetTime: Date; checkoutUrl?: string } = {
        usageInfo: {
          userType: usageInfo.userType,
          dailyLimit: usageInfo.limit,
          currentUsage: usageInfo.used,
          canCalculate: usageInfo.allowed,
          resetTime: new Date(usageInfo.resetTime),
          requiresUpgrade: usageInfo.requiresUpgrade || false
        } as UsageLimit,
        resetTime: new Date(usageInfo.resetTime)
      }
      if (usageInfo.checkoutUrl) {
        modalProps.checkoutUrl = usageInfo.checkoutUrl
      }
      showUsageLimitModal(modalProps)
      return
    }

    console.log('✅ [CalculatorWrapper] Usage allowed, calling calculator...')
    
    // Call the calculation logic (calculator will handle its own usage tracking)
    try {
      onCalculate?.()
      // Refresh usage info after calculation
      setTimeout(() => checkUsageLimits(), 1000) // Small delay to allow tracking to complete
    } catch (error) {
      console.error('❌ [CalculatorWrapper] Error during calculation:', error)
    }
  }

  const getUserTypeColor = (userType: string) => {
    switch (userType) {
      case 'pro': return 'bg-purple-100 text-purple-800'
      case 'registered': return 'bg-green-100 text-green-800'
      case 'free': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getUserTypeLabel = (userType: string) => {
    switch (userType) {
      case 'pro': return 'Pro'
      case 'registered': return 'Registado'
      case 'free': return 'Gratuito'
      case 'anonymous': return 'Visitante'
      default: return 'Desconhecido'
    }
  }

  // No need for wrappedOnCalculate since handleCalculationAttempt now calls onCalculate directly

  return (
    <div className="space-y-6">
      {/* Calculator Header with Usage Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calculator className="w-6 h-6 text-blue-600" />
              <div>
                <CardTitle className="text-xl">{title}</CardTitle>
                {description && (
                  <p className="text-sm text-gray-600 mt-1">{description}</p>
                )}
              </div>
            </div>
            
            {usageInfo && (
              <div className="text-right">
                <Badge className={getUserTypeColor(usageInfo.userType)}>
                  {getUserTypeLabel(usageInfo.userType)}
                </Badge>
                {usageInfo.userType !== 'pro' && (
                  <p className="text-sm text-gray-600 mt-1">
                    {usageInfo.remaining} de {usageInfo.limit} cálculos restantes
                  </p>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        
        {/* Usage Warning Bar */}
        {usageInfo && !isLoading && (
          <CardContent className="pt-0">
            {usageInfo.userType === 'pro' ? (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>Cálculos ilimitados</strong> - Obrigado por ser cliente Pro!
                </AlertDescription>
              </Alert>
            ) : usageInfo.remaining <= 2 && usageInfo.remaining > 0 ? (
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  <strong>Aviso:</strong> Apenas {usageInfo.remaining} cálculo{usageInfo.remaining !== 1 ? 's' : ''} restante{usageInfo.remaining !== 1 ? 's' : ''} hoje.
                  {usageInfo.userType === 'anonymous' && (
                    <Button 
                      variant="link" 
                      className="p-0 h-auto ml-2 text-yellow-800 underline"
                      onClick={() => router.push('/auth/signup')}
                    >
                      Registe-se para obter mais
                    </Button>
                  )}
                </AlertDescription>
              </Alert>
            ) : usageInfo.remaining === 0 ? (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <strong>Limite atingido:</strong> Não pode fazer mais cálculos hoje.
                  <Button 
                    variant="link" 
                    className="p-0 h-auto ml-2 text-red-800 underline"
                    onClick={() => {
                      const modalProps: { usageInfo: UsageLimit; resetTime: Date; checkoutUrl?: string } = {
                        usageInfo: {
                          userType: usageInfo.userType,
                          dailyLimit: usageInfo.limit,
                          currentUsage: usageInfo.used,
                          canCalculate: usageInfo.allowed,
                          resetTime: new Date(usageInfo.resetTime),
                          requiresUpgrade: usageInfo.requiresUpgrade || false
                        } as UsageLimit,
                        resetTime: new Date(usageInfo.resetTime)
                      }
                      if (usageInfo.checkoutUrl) {
                        modalProps.checkoutUrl = usageInfo.checkoutUrl
                      }
                      showUsageLimitModal(modalProps)
                    }}
                  >
                    Ver opções de upgrade
                  </Button>
                </AlertDescription>
              </Alert>
            ) : null}
            
            {/* Usage Progress Bar */}
            {usageInfo.userType !== 'pro' && (
              <div className="mt-3">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Utilização hoje</span>
                  <span>{usageInfo.used}/{usageInfo.limit}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      usageInfo.remaining <= 2 && usageInfo.remaining > 0
                        ? 'bg-yellow-500'
                        : usageInfo.remaining === 0
                        ? 'bg-red-500'
                        : 'bg-blue-500'
                    }`}
                    style={{ width: `${(usageInfo.used / usageInfo.limit) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Upgrade Prompt */}
      {showUpgradePrompt && usageInfo?.userType !== 'pro' && usageInfo && (
        <CompactPricingCard 
          currentTier={usageInfo.userType}
          onUpgrade={() => {
            if (usageInfo.checkoutUrl) {
              window.location.href = usageInfo.checkoutUrl
            }
          }}
        />
      )}

      {/* Calculator Content */}
      <CalculatorProvider onCalculate={handleCalculationAttempt}>
        <div 
          onClick={!isUsageLimitModalOpen && !usageInfo?.allowed ? handleCalculationAttempt : undefined}
          className={!usageInfo?.allowed ? 'cursor-pointer' : ''}
        >
          {children}
        </div>
      </CalculatorProvider>

      {/* Usage Limit Modal */}
      {UsageLimitModalComponent}
    </div>
  )
}

// Higher-order component to wrap calculators
export function withUsageTracking<T extends object>(
  WrappedComponent: React.ComponentType<T>,
  calculatorType: string,
  title: string,
  description?: string
) {
  return function UsageTrackedCalculator(props: T) {
    return (
      <CalculatorWrapper 
        title={title}
        {...(description && { description })}
        calculatorType={calculatorType}
      >
        <WrappedComponent {...props} />
      </CalculatorWrapper>
    )
  }
}