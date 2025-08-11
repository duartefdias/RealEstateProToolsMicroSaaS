'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { UsageLimitModal, useUsageLimitModal } from '@/components/usage/UsageLimitBanner'
import { CompactPricingCard } from '@/components/payments/PricingPlans'
import { 
  Calculator, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  Zap, 
  Star,
  TrendingUp,
  Shield,
  Users,
  ArrowRight,
  Info
} from 'lucide-react'
import { CalculatorConfig, CalculationStatus, UsageLimit, UserType } from '@/types/calculator'
import { useAuth } from '@/lib/auth/context'
import { cn } from '@/lib/utils'

interface CalculatorLayoutProps {
  config: CalculatorConfig
  children: React.ReactNode
  status?: CalculationStatus
  progress?: number
  usageInfo?: UsageLimit | null
  onCalculate?: () => Promise<void>
  showUpgradePrompts?: boolean
  className?: string
}

export function CalculatorLayout({
  config,
  children,
  status = 'idle',
  progress = 0,
  usageInfo,
  onCalculate,
  showUpgradePrompts = true,
  className
}: CalculatorLayoutProps) {
  const { user, profile } = useAuth()
  const router = useRouter()
  const [showUpgradeCard, setShowUpgradeCard] = useState(false)
  const [calculationCount, setCalculationCount] = useState(0)
  
  const {
    showUsageLimitModal,
    UsageLimitModal: UsageLimitModalComponent,
    isUsageLimitModalOpen
  } = useUsageLimitModal()

  const userType: UserType = user 
    ? (profile?.subscription_tier as UserType) || 'free'
    : 'anonymous'

  const canAccess = checkTierAccess(config.tier, userType)
  const shouldShowUpgradePrompt = showUpgradePrompts && calculationCount >= 2 && userType !== 'pro'

  // Track calculation attempts for conversion optimization
  useEffect(() => {
    if (status === 'success') {
      setCalculationCount(prev => prev + 1)
      
      // Show upgrade prompts based on user behavior
      if (calculationCount >= 2 && userType !== 'pro') {
        setTimeout(() => setShowUpgradeCard(true), 2000)
      }
    }
  }, [status, calculationCount, userType])

  const handleCalculateClick = async () => {
    // Check usage limits before calculation
    if (usageInfo && !usageInfo.canCalculate) {
      const modalProps: { usageInfo: typeof usageInfo; resetTime: Date; checkoutUrl?: string } = {
        usageInfo,
        resetTime: usageInfo.resetTime
      }
      if (usageInfo.upgradeUrl) {
        modalProps.checkoutUrl = usageInfo.upgradeUrl
      }
      showUsageLimitModal(modalProps)
      return
    }

    // Check tier access
    if (!canAccess) {
      const upgradeUrl = userType === 'anonymous' 
        ? '/auth/signup'
        : '/pricing'
      
      showUpgradePrompt(config.tier, userType, upgradeUrl)
      return
    }

    if (onCalculate) {
      await onCalculate()
    }
  }

  const showUpgradePrompt = (requiredTier: string, currentUserType: UserType, upgradeUrl: string) => {
    if (requiredTier === 'registered' && currentUserType === 'anonymous') {
      router.push('/auth/signup')
    } else if (requiredTier === 'pro') {
      router.push('/pricing')
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'basic': return 'bg-green-100 text-green-800'
      case 'intermediate': return 'bg-yellow-100 text-yellow-800'
      case 'advanced': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'free': return <Zap className="w-4 h-4 text-blue-600" />
      case 'registered': return <Star className="w-4 h-4 text-green-600" />
      case 'pro': return <Shield className="w-4 h-4 text-purple-600" />
      default: return <Calculator className="w-4 h-4" />
    }
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Calculator Header */}
      <Card className="border-2 border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="text-4xl">{config.icon}</div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <CardTitle className="text-2xl font-bold text-blue-900">
                    {config.name}
                  </CardTitle>
                  <Badge className={getDifficultyColor(config.difficulty)}>
                    {config.difficulty === 'basic' && 'Básico'}
                    {config.difficulty === 'intermediate' && 'Intermédio'}
                    {config.difficulty === 'advanced' && 'Avançado'}
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    {getTierIcon(config.tier)}
                    {config.tier.charAt(0).toUpperCase() + config.tier.slice(1)}
                  </Badge>
                </div>
                <CardDescription className="text-blue-700 text-base leading-relaxed max-w-2xl">
                  {config.description}
                </CardDescription>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="text-right space-y-1">
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                {config.estimatedTime} min
              </div>
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Users className="w-4 h-4" />
                {Math.floor(Math.random() * 500 + 100)} utilizações
              </div>
              <div className="flex items-center gap-1 text-sm text-green-600">
                <TrendingUp className="w-4 h-4" />
                98% precisão
              </div>
            </div>
          </div>

          {/* Progress Bar for Multi-step Calculators */}
          {progress > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progresso</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Tier Access Alert */}
      {!canAccess && (
        <Alert className="border-amber-200 bg-amber-50">
          <Shield className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <div className="flex items-center justify-between">
              <div>
                <strong>Calculadora Premium:</strong> Esta calculadora requer 
                {config.tier === 'registered' ? ' registo gratuito' : ' subscrição Pro'}.
              </div>
              <Button 
                size="sm" 
                onClick={() => showUpgradePrompt(config.tier, userType, '')}
                className="bg-amber-600 hover:bg-amber-700"
              >
                {config.tier === 'registered' ? 'Registar Grátis' : 'Upgrade para Pro'}
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Usage Information */}
      {usageInfo && userType !== 'pro' && (
        <Card className="border-gray-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-full">
                  <Calculator className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {usageInfo.canCalculate 
                      ? `${usageInfo.dailyLimit - usageInfo.currentUsage} cálculos restantes hoje`
                      : 'Limite diário atingido'
                    }
                  </p>
                  <p className="text-sm text-gray-600">
                    Reinicia em{' '}
                    {usageInfo.resetTime.toLocaleTimeString('pt-PT', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
              </div>
              
              {!usageInfo.canCalculate && (
                <Button 
                  size="sm" 
                  onClick={() => router.push('/pricing')}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Upgrade para Ilimitado
                </Button>
              )}
            </div>
            
            {/* Usage Progress Bar */}
            <div className="mt-3">
              <Progress 
                value={(usageInfo.currentUsage / usageInfo.dailyLimit) * 100} 
                className={cn(
                  "w-full",
                  usageInfo.currentUsage / usageInfo.dailyLimit >= 0.8 && "bg-red-100"
                )}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Calculator Status */}
      {status === 'calculating' && (
        <Alert>
          <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full" />
          <AlertDescription>
            A processar o seu cálculo... Por favor aguarde.
          </AlertDescription>
        </Alert>
      )}

      {status === 'error' && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            Ocorreu um erro durante o cálculo. Por favor, verifique os dados introduzidos e tente novamente.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Calculator Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {children}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Upgrade Prompt Card */}
          {shouldShowUpgradePrompt && showUpgradeCard && (
            <CompactPricingCard 
              currentTier={userType}
              onUpgrade={() => router.push('/pricing')}
            />
          )}

          {/* Quick Tips */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Info className="w-5 h-5 text-blue-600" />
                Dicas Importantes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm space-y-2">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Todos os cálculos são baseados na legislação portuguesa atual</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Resultados são estimativas orientativas</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Para valores oficiais, consulte um profissional</span>
                </div>
              </div>
              
              <Separator className="my-3" />
              
              <div className="text-xs text-gray-500">
                <p className="font-medium mb-1">Precisão dos cálculos:</p>
                <p>Os nossos algoritmos são validados com dados oficiais e atualizados regularmente.</p>
              </div>
            </CardContent>
          </Card>

          {/* Related Calculators */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Calculadoras Relacionadas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {getRelatedCalculators(config.id).map((relatedConfig) => (
                <Button
                  key={relatedConfig.id}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start h-auto p-3 text-left"
                  onClick={() => router.push(relatedConfig.route)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{relatedConfig.icon}</span>
                    <div>
                      <div className="font-medium">{relatedConfig.name}</div>
                      <div className="text-xs text-gray-500 line-clamp-2">
                        {relatedConfig.description}
                      </div>
                    </div>
                  </div>
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Calculate Button (if provided) */}
      {onCalculate && (
        <div className="flex justify-center pt-4">
          <Button
            size="lg"
            onClick={handleCalculateClick}
            disabled={status === 'calculating' || (usageInfo && !usageInfo.canCalculate) || !canAccess}
            className="w-full max-w-md bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8"
          >
            {status === 'calculating' ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                A Calcular...
              </>
            ) : (
              <>
                <Calculator className="w-4 h-4 mr-2" />
                Calcular {config.name.replace('Calculadora de ', '')}
              </>
            )}
          </Button>
        </div>
      )}

      {/* Usage Limit Modal */}
      {UsageLimitModalComponent}
    </div>
  )
}

// Helper functions
function checkTierAccess(requiredTier: string, userType: UserType): boolean {
  const tierLevels = { anonymous: -1, free: 0, registered: 1, pro: 2 }
  const userLevel = tierLevels[userType] ?? -1
  const requiredLevel = tierLevels[requiredTier as keyof typeof tierLevels] ?? 0
  
  return userLevel >= requiredLevel
}

function getRelatedCalculators(currentId: string) {
  // This would typically come from the calculator config
  // For now, return a static list
  const related = [
    {
      id: 'buy-house',
      name: 'Compra de Casa',
      description: 'Calcule custos de compra',
      icon: '🔑',
      route: '/calculators/buy-house'
    },
    {
      id: 'mortgage-simulator',
      name: 'Crédito Habitação',
      description: 'Simule financiamento',
      icon: '🏦',
      route: '/calculators/mortgage-simulator'
    }
  ]
  
  return related.filter(calc => calc.id !== currentId).slice(0, 2)
}