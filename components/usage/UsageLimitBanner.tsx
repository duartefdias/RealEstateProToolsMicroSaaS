'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  AlertCircle, 
  Clock, 
  Zap, 
  Crown, 
  Star, 
  TrendingUp, 
  ArrowRight,
  X,
  CheckCircle,
  Timer,
  Target,
  Gift
} from 'lucide-react'
import { UsageLimit, UserType } from '@/types/calculator'
import { cn } from '@/lib/utils'

interface UsageLimitBannerProps {
  usageInfo: UsageLimit
  userType: UserType
  onUpgrade?: () => void
  onDismiss?: () => void
  variant?: 'default' | 'compact' | 'warning' | 'blocking'
  showProgress?: boolean
  showTimeToReset?: boolean
  className?: string
}

interface UsageLimitModalProps {
  isOpen: boolean
  onClose: () => void
  usageInfo: UsageLimit
  checkoutUrl?: string
  resetTime: Date
  onUpgrade?: () => void
}

export function UsageLimitBanner({
  usageInfo,
  userType,
  onUpgrade,
  onDismiss,
  variant = 'default',
  showProgress = true,
  showTimeToReset = true,
  className
}: UsageLimitBannerProps) {
  const router = useRouter()
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  const { dailyLimit, currentUsage, canCalculate, resetTime, requiresUpgrade } = usageInfo
  const usagePercentage = (currentUsage / dailyLimit) * 100
  const remaining = Math.max(0, dailyLimit - currentUsage)
  
  const timeUntilReset = getTimeUntilReset(resetTime)
  const isCloseToLimit = usagePercentage >= 80
  const isAtLimit = currentUsage >= dailyLimit

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade()
    } else {
      router.push(userType === 'anonymous' ? '/auth/signup' : '/pricing')
    }
  }

  const handleDismiss = () => {
    setDismissed(true)
    onDismiss?.()
  }

  // Blocking modal variant - prevents interaction
  if (variant === 'blocking' && !canCalculate) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <Card className="w-full max-w-md mx-4 shadow-2xl border-2 border-red-200">
          <CardHeader className="text-center pb-4">
            <div className="w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <CardTitle className="text-xl text-red-900">
              Limite Diário Atingido
            </CardTitle>
            <CardDescription className="text-red-700">
              Já utilizou todos os {dailyLimit} cálculos disponíveis hoje
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-sm text-red-800 mb-2">
                <strong>O que pode fazer:</strong>
              </div>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• Aguardar até {timeUntilReset} para reiniciar</li>
                {userType === 'anonymous' && (
                  <li>• <strong>Registar-se gratuitamente</strong> para dobrar o limite</li>
                )}
                {userType !== 'pro' && (
                  <li>• <strong>Upgrade para Pro</strong> para cálculos ilimitados</li>
                )}
              </ul>
            </div>

            <div className="space-y-3">
              {userType === 'anonymous' && (
                <Button 
                  onClick={handleUpgrade}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <Star className="w-4 h-4 mr-2" />
                  Registar Grátis (10 cálculos/dia)
                </Button>
              )}
              
              {userType === 'registered' && (
                <Button 
                  onClick={handleUpgrade}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  <Crown className="w-4 h-4 mr-2" />
                  Upgrade para Pro (Ilimitado)
                </Button>
              )}
              
              <div className="text-center">
                <div className="text-sm text-gray-600">
                  Limite reinicia em <strong>{timeUntilReset}</strong>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Compact variant for minimal space
  if (variant === 'compact') {
    return (
      <div className={cn("flex items-center justify-between p-3 border rounded-lg", 
        isAtLimit ? "border-red-200 bg-red-50" : 
        isCloseToLimit ? "border-amber-200 bg-amber-50" : "border-blue-200 bg-blue-50",
        className
      )}>
        <div className="flex items-center gap-2">
          <div className={cn("w-2 h-2 rounded-full",
            isAtLimit ? "bg-red-500" : 
            isCloseToLimit ? "bg-amber-500" : "bg-blue-500"
          )} />
          <span className="text-sm font-medium">
            {remaining} cálculos restantes
          </span>
        </div>
        
        {requiresUpgrade && userType !== 'pro' && (
          <Button size="sm" onClick={handleUpgrade} className="h-7 text-xs px-3">
            {userType === 'anonymous' ? 'Registar' : 'Upgrade'}
          </Button>
        )}
      </div>
    )
  }

  // Warning variant for approaching limits
  if (variant === 'warning' && isCloseToLimit && !isAtLimit) {
    return (
      <Alert className="border-amber-200 bg-amber-50">
        <AlertCircle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800">
          <div className="flex items-center justify-between">
            <div>
              <strong>Aproximando-se do limite:</strong> Restam apenas {remaining} cálculos hoje.
              {showTimeToReset && (
                <div className="text-sm mt-1">Reinicia em {timeUntilReset}</div>
              )}
            </div>
            {requiresUpgrade && userType !== 'pro' && (
              <Button size="sm" onClick={handleUpgrade} className="bg-amber-600 hover:bg-amber-700 ml-4">
                {userType === 'anonymous' ? 'Registar' : 'Upgrade'}
                <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            )}
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  // Default variant - comprehensive display
  return (
    <Card className={cn("border-l-4", 
      isAtLimit ? "border-l-red-500 border-red-200 bg-red-50" :
      isCloseToLimit ? "border-l-amber-500 border-amber-200 bg-amber-50" :
      "border-l-blue-500 border-blue-200 bg-blue-50",
      className
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-full",
              isAtLimit ? "bg-red-100" :
              isCloseToLimit ? "bg-amber-100" : "bg-blue-100"
            )}>
              {isAtLimit ? (
                <AlertCircle className="w-5 h-5 text-red-600" />
              ) : isCloseToLimit ? (
                <Timer className="w-5 h-5 text-amber-600" />
              ) : (
                <Target className="w-5 h-5 text-blue-600" />
              )}
            </div>
            
            <div>
              <CardTitle className="text-lg">
                {isAtLimit ? 'Limite Atingido' : 
                 isCloseToLimit ? 'Aproximando-se do Limite' : 
                 'Utilização Atual'}
              </CardTitle>
              <CardDescription>
                {currentUsage} de {dailyLimit === Infinity ? '∞' : dailyLimit} cálculos utilizados hoje
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <UserTypeBadge userType={userType} />
            {onDismiss && (
              <Button variant="ghost" size="sm" onClick={handleDismiss}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {showProgress && dailyLimit !== Infinity && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progresso do dia</span>
              <span className="font-mono">{Math.round(usagePercentage)}%</span>
            </div>
            <Progress 
              value={usagePercentage} 
              className={cn(
                "h-2",
                isAtLimit ? "[&>div]:bg-red-500" :
                isCloseToLimit ? "[&>div]:bg-amber-500" : "[&>div]:bg-blue-500"
              )}
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="text-center p-3 bg-white/60 rounded-lg">
            <div className="font-semibold text-gray-900">{remaining}</div>
            <div className="text-gray-600">Restantes</div>
          </div>
          
          {showTimeToReset && (
            <div className="text-center p-3 bg-white/60 rounded-lg">
              <div className="font-semibold text-gray-900">{timeUntilReset}</div>
              <div className="text-gray-600">até reiniciar</div>
            </div>
          )}
        </div>

        {requiresUpgrade && userType !== 'pro' && (
          <div className="space-y-3">
            <div className={cn("p-4 rounded-lg border",
              userType === 'anonymous' ? "border-green-200 bg-green-50" : "border-purple-200 bg-purple-50"
            )}>
              <div className="flex items-start gap-3">
                <div className={cn("p-2 rounded-full",
                  userType === 'anonymous' ? "bg-green-100" : "bg-purple-100"
                )}>
                  {userType === 'anonymous' ? (
                    <Gift className="w-5 h-5 text-green-600" />
                  ) : (
                    <Crown className="w-5 h-5 text-purple-600" />
                  )}
                </div>
                
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">
                    {userType === 'anonymous' ? 'Registo Gratuito Disponível!' : 'Upgrade para Pro'}
                  </h4>
                  <p className="text-sm mb-3">
                    {userType === 'anonymous' 
                      ? 'Dobre o seu limite diário para 10 cálculos sem custos.'
                      : 'Obtenha cálculos ilimitados, gestão de clientes e muito mais.'
                    }
                  </p>
                  
                  <ul className="text-sm space-y-1 mb-3">
                    {userType === 'anonymous' ? (
                      <>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-green-600" />
                          10 cálculos diários (dobro do atual)
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-green-600" />
                          Histórico de cálculos guardado
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-green-600" />
                          Sem custos ou compromissos
                        </li>
                      </>
                    ) : (
                      <>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-purple-600" />
                          Cálculos ilimitados
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-purple-600" />
                          Gestão completa de clientes
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-purple-600" />
                          Relatórios e exportação PDF
                        </li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            </div>

            <Button 
              onClick={handleUpgrade}
              className={cn("w-full",
                userType === 'anonymous' 
                  ? "bg-green-600 hover:bg-green-700" 
                  : "bg-purple-600 hover:bg-purple-700"
              )}
            >
              {userType === 'anonymous' ? (
                <>
                  <Star className="w-4 h-4 mr-2" />
                  Registar Gratuitamente
                </>
              ) : (
                <>
                  <Crown className="w-4 h-4 mr-2" />
                  Upgrade para Pro - €9.99/mês
                </>
              )}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Usage Limit Modal for blocking scenarios
export function UsageLimitModal({
  isOpen,
  onClose,
  usageInfo,
  checkoutUrl,
  resetTime,
  onUpgrade
}: UsageLimitModalProps) {
  const router = useRouter()

  if (!isOpen) return null

  const timeUntilReset = getTimeUntilReset(resetTime)
  const { userType, dailyLimit, currentUsage } = usageInfo

  const handleUpgrade = () => {
    if (checkoutUrl) {
      window.location.href = checkoutUrl
    } else if (onUpgrade) {
      onUpgrade()
    } else {
      router.push(userType === 'anonymous' ? '/auth/signup' : '/pricing')
    }
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => e.stopPropagation()} // Prevent clicking outside to close
    >
      <div className="w-full max-w-md mx-4">
        <UsageLimitBanner
          usageInfo={usageInfo}
          userType={userType}
          onUpgrade={handleUpgrade}
          variant="blocking"
          showProgress={false}
          showTimeToReset={false}
        />
      </div>
    </div>
  )
}

// User Type Badge Component
function UserTypeBadge({ userType }: { userType: UserType }) {
  const config = {
    anonymous: { label: 'Anónimo', icon: Zap, color: 'bg-gray-100 text-gray-700' },
    free: { label: 'Gratuito', icon: Zap, color: 'bg-blue-100 text-blue-700' },
    registered: { label: 'Registado', icon: Star, color: 'bg-green-100 text-green-700' },
    pro: { label: 'Pro', icon: Crown, color: 'bg-purple-100 text-purple-700' }
  }

  const { label, icon: Icon, color } = config[userType]

  return (
    <Badge variant="outline" className={cn("gap-1", color)}>
      <Icon className="w-3 h-3" />
      {label}
    </Badge>
  )
}

// Utility function to get time until reset
function getTimeUntilReset(resetTime: Date): string {
  const now = new Date()
  const diffMs = resetTime.getTime() - now.getTime()
  
  if (diffMs <= 0) {
    return 'agora'
  }

  const hours = Math.floor(diffMs / (60 * 60 * 1000))
  const minutes = Math.floor((diffMs % (60 * 60 * 1000)) / (60 * 1000))

  if (hours > 0) {
    return `${hours}h ${minutes}min`
  } else {
    return `${minutes} minutos`
  }
}

// Hook for using the usage limit modal
export function useUsageLimitModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [modalProps, setModalProps] = useState<Partial<UsageLimitModalProps>>({})

  const showUsageLimitModal = (props: Partial<UsageLimitModalProps>) => {
    setModalProps(props)
    setIsOpen(true)
  }

  const hideUsageLimitModal = () => {
    setIsOpen(false)
    setModalProps({})
  }

  const UsageLimitModalComponent = isOpen ? (
    <UsageLimitModal
      isOpen={isOpen}
      onClose={hideUsageLimitModal}
      usageInfo={modalProps.usageInfo!}
      {...(modalProps.checkoutUrl && { checkoutUrl: modalProps.checkoutUrl })}
      resetTime={modalProps.resetTime || new Date()}
      {...(modalProps.onUpgrade && { onUpgrade: modalProps.onUpgrade })}
    />
  ) : null

  return {
    showUsageLimitModal,
    hideUsageLimitModal,
    UsageLimitModal: UsageLimitModalComponent,
    isUsageLimitModalOpen: isOpen
  }
}