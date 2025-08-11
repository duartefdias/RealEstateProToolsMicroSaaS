'use client'

import React, { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { UsageLimit, UserType } from '@/types/calculator'
import { EnforcementResult } from '@/lib/usage/enforcement'
import { UsageLimitBanner } from './UsageLimitBanner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Zap, 
  Star, 
  Crown,
  TrendingUp,
  Target,
  Calendar
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Usage Statistics Display Component
interface UsageStatsProps {
  usageInfo: UsageLimit
  userType: UserType
  className?: string
}

export function UsageStats({ usageInfo, userType, className }: UsageStatsProps) {
  const { dailyLimit, currentUsage, resetTime } = usageInfo
  const usagePercentage = dailyLimit !== Infinity ? (currentUsage / dailyLimit) * 100 : 0
  const remaining = Math.max(0, dailyLimit - currentUsage)
  
  const timeUntilReset = getTimeUntilReset(resetTime)
  const isUnlimited = dailyLimit === Infinity

  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-4 gap-4", className)}>
      <div className="text-center p-4 bg-white rounded-lg border shadow-sm">
        <div className="flex items-center justify-center mb-2">
          <Target className="w-5 h-5 text-blue-600" />
        </div>
        <div className="text-2xl font-bold text-blue-600">
          {isUnlimited ? '∞' : remaining}
        </div>
        <div className="text-sm text-gray-600">Restantes hoje</div>
      </div>

      <div className="text-center p-4 bg-white rounded-lg border shadow-sm">
        <div className="flex items-center justify-center mb-2">
          <TrendingUp className="w-5 h-5 text-green-600" />
        </div>
        <div className="text-2xl font-bold text-green-600">{currentUsage}</div>
        <div className="text-sm text-gray-600">Utilizados</div>
      </div>

      <div className="text-center p-4 bg-white rounded-lg border shadow-sm">
        <div className="flex items-center justify-center mb-2">
          <Calendar className="w-5 h-5 text-purple-600" />
        </div>
        <div className="text-2xl font-bold text-purple-600">
          {isUnlimited ? '∞' : dailyLimit}
        </div>
        <div className="text-sm text-gray-600">Limite diário</div>
      </div>

      <div className="text-center p-4 bg-white rounded-lg border shadow-sm">
        <div className="flex items-center justify-center mb-2">
          <Clock className="w-5 h-5 text-amber-600" />
        </div>
        <div className="text-lg font-bold text-amber-600">{timeUntilReset}</div>
        <div className="text-sm text-gray-600">Até reiniciar</div>
      </div>
    </div>
  )
}

// Usage Progress Ring Component
interface UsageProgressRingProps {
  usage: number
  limit: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

export function UsageProgressRing({ 
  usage, 
  limit, 
  size = 'md', 
  showLabel = true, 
  className 
}: UsageProgressRingProps) {
  const percentage = limit !== Infinity ? (usage / limit) * 100 : 0
  const isAtLimit = usage >= limit
  const isCloseToLimit = percentage >= 80
  
  const sizeConfig = {
    sm: { ring: 60, stroke: 6, text: 'text-sm', inner: 'text-xs' },
    md: { ring: 80, stroke: 8, text: 'text-lg', inner: 'text-sm' },
    lg: { ring: 120, stroke: 10, text: 'text-2xl', inner: 'text-base' }
  }

  const config = sizeConfig[size]
  const radius = (config.ring - config.stroke) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDasharray = circumference
  const strokeDashoffset = limit !== Infinity ? circumference - (percentage / 100) * circumference : 0

  const strokeColor = isAtLimit ? '#ef4444' : isCloseToLimit ? '#f59e0b' : '#3b82f6'

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={config.ring} height={config.ring} className="transform -rotate-90">
        <circle
          cx={config.ring / 2}
          cy={config.ring / 2}
          r={radius}
          fill="transparent"
          stroke="#e5e7eb"
          strokeWidth={config.stroke}
        />
        <circle
          cx={config.ring / 2}
          cy={config.ring / 2}
          r={radius}
          fill="transparent"
          stroke={strokeColor}
          strokeWidth={config.stroke}
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-500"
        />
      </svg>
      
      {showLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("font-bold", config.text)} style={{ color: strokeColor }}>
            {limit !== Infinity ? Math.max(0, limit - usage) : '∞'}
          </span>
          <span className={cn("text-gray-500", config.inner)}>
            restantes
          </span>
        </div>
      )}
    </div>
  )
}

// Usage Warnings and Notifications
interface UsageNotificationProps {
  enforcementResult: EnforcementResult
  onUpgrade?: () => void
  onDismiss?: () => void
}

export function UsageNotification({ 
  enforcementResult, 
  onUpgrade, 
  onDismiss 
}: UsageNotificationProps) {
  const [dismissed, setDismissed] = useState(false)
  
  const { allowed, usageInfo, suggestedAction, reason } = enforcementResult

  useEffect(() => {
    // Auto-show toast notifications
    if (!allowed) {
      const message = getNotificationMessage(reason || 'limit_exceeded', usageInfo.userType)
      toast.error(message, {
        duration: 5000,
        ...(suggestedAction && onUpgrade && {
          action: {
            label: suggestedAction.type === 'upgrade' ? 'Upgrade' : 'Registar',
            onClick: onUpgrade
          }
        })
      })
    } else {
      // Show warning if approaching limit
      const { dailyLimit, currentUsage, userType } = usageInfo
      const percentage = (currentUsage / dailyLimit) * 100
      
      if (percentage >= 80 && percentage < 100 && userType !== 'pro') {
        const remaining = dailyLimit - currentUsage
        toast.warning(`Restam apenas ${remaining} cálculos hoje`, {
          duration: 3000,
          ...(onUpgrade && userType !== 'pro' && {
            action: {
              label: userType === 'anonymous' ? 'Registar' : 'Upgrade',
              onClick: onUpgrade
            }
          })
        })
      }
    }
  }, [allowed, reason, usageInfo, suggestedAction, onUpgrade])

  if (dismissed || allowed) return null

  return (
    <div className="p-4 border rounded-lg bg-red-50 border-red-200">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
        <div className="flex-1">
          <p className="text-red-800 font-medium">
            {getNotificationMessage(reason || 'limit_exceeded', usageInfo.userType)}
          </p>
          {suggestedAction && usageInfo.userType !== 'pro' && (
            <div className="mt-3 flex gap-2">
              <Button size="sm" onClick={onUpgrade} className="bg-red-600 hover:bg-red-700">
{suggestedAction.type === 'upgrade' ? 'Upgrade' : suggestedAction.type === 'register' ? 'Registar' : 'Aguardar'}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setDismissed(true)}>
                Dispensar
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Inline Usage Indicator (for calculator forms)
interface InlineUsageIndicatorProps {
  usageInfo: UsageLimit
  compact?: boolean
  className?: string
}

export function InlineUsageIndicator({ 
  usageInfo, 
  compact = false, 
  className 
}: InlineUsageIndicatorProps) {
  const { dailyLimit, currentUsage, userType } = usageInfo
  const remaining = Math.max(0, dailyLimit - currentUsage)
  const percentage = dailyLimit !== Infinity ? (currentUsage / dailyLimit) * 100 : 0
  const isCloseToLimit = percentage >= 80

  if (dailyLimit === Infinity) {
    return (
      <div className={cn("flex items-center gap-2 text-sm text-green-600", className)}>
        <Crown className="w-4 h-4" />
        <span className="font-medium">Cálculos ilimitados</span>
        <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50">
          Pro
        </Badge>
      </div>
    )
  }

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className={cn("w-2 h-2 rounded-full", 
          remaining === 0 ? "bg-red-500" : 
          isCloseToLimit ? "bg-amber-500" : "bg-green-500"
        )} />
        <span className="text-sm">
          {remaining} restantes
        </span>
      </div>
    )
  }

  return (
    <div className={cn("p-3 border rounded-lg", 
      remaining === 0 ? "border-red-200 bg-red-50" :
      isCloseToLimit ? "border-amber-200 bg-amber-50" : "border-green-200 bg-green-50",
      className
    )}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">Cálculos hoje</span>
        <span className="text-sm text-gray-600">{currentUsage}/{dailyLimit}</span>
      </div>
      
      <Progress 
        value={percentage} 
        className={cn("h-2 mb-2",
          remaining === 0 ? "[&>div]:bg-red-500" :
          isCloseToLimit ? "[&>div]:bg-amber-500" : "[&>div]:bg-green-500"
        )}
      />
      
      <div className="flex items-center justify-between text-xs">
        <span className={cn(
          remaining === 0 ? "text-red-600" :
          isCloseToLimit ? "text-amber-600" : "text-green-600"
        )}>
          {remaining} restantes
        </span>
        
        <UserTypeBadge userType={userType} size="sm" />
      </div>
    </div>
  )
}

// Success feedback for calculations
export function CalculationSuccessFeedback({ 
  usageInfo, 
  onViewResult, 
  onNewCalculation 
}: {
  usageInfo: UsageLimit
  onViewResult?: () => void
  onNewCalculation?: () => void
}) {
  const { currentUsage, dailyLimit } = usageInfo
  const remaining = Math.max(0, dailyLimit - currentUsage)

  return (
    <div className="text-center p-6 bg-green-50 border border-green-200 rounded-lg">
      <div className="w-12 h-12 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
        <CheckCircle className="w-6 h-6 text-green-600" />
      </div>
      
      <h3 className="text-lg font-semibold text-green-900 mb-2">
        Cálculo Concluído com Sucesso!
      </h3>
      
      <p className="text-green-700 mb-4">
        {dailyLimit !== Infinity 
          ? `Restam ${remaining} cálculos hoje`
          : 'Cálculos ilimitados com o plano Pro'
        }
      </p>
      
      <div className="flex gap-3 justify-center">
        {onViewResult && (
          <Button onClick={onViewResult} className="bg-green-600 hover:bg-green-700">
            Ver Resultado Detalhado
          </Button>
        )}
        {onNewCalculation && (
          <Button variant="outline" onClick={onNewCalculation}>
            Novo Cálculo
          </Button>
        )}
      </div>
    </div>
  )
}

// User Type Badge Component
function UserTypeBadge({ userType, size = 'default' }: { 
  userType: UserType
  size?: 'sm' | 'default' 
}) {
  const config = {
    anonymous: { label: 'Anónimo', icon: Zap, color: 'bg-gray-100 text-gray-700' },
    free: { label: 'Gratuito', icon: Zap, color: 'bg-blue-100 text-blue-700' },
    registered: { label: 'Registado', icon: Star, color: 'bg-green-100 text-green-700' },
    pro: { label: 'Pro', icon: Crown, color: 'bg-purple-100 text-purple-700' }
  }

  const { label, icon: Icon, color } = config[userType]
  const isSmall = size === 'sm'

  return (
    <Badge 
      variant="outline" 
      className={cn("gap-1", color, isSmall && "text-xs px-2 py-0.5")}
    >
      <Icon className={cn(isSmall ? "w-3 h-3" : "w-4 h-4")} />
      {label}
    </Badge>
  )
}

// Helper Functions
function getNotificationMessage(reason: string, userType: UserType): string {
  const messages = {
    daily_limit_exceeded: {
      anonymous: 'Limite de 5 cálculos diários atingido. Registe-se para duplicar o limite!',
      free: 'Limite de 5 cálculos diários atingido. Registe-se para aumentar para 10!',
      registered: 'Limite de 10 cálculos diários atingido. Faça upgrade para Pro para cálculos ilimitados!',
      pro: 'Contacte o suporte se está a ver esta mensagem.'
    },
    rate_limit_exceeded: {
      anonymous: 'Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.',
      free: 'Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.',
      registered: 'Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.',
      pro: 'Limite de velocidade temporário. Aguarde um momento.'
    },
    tier_access_denied: {
      anonymous: 'Esta funcionalidade requer registo. Crie uma conta gratuita!',
      free: 'Esta funcionalidade requer registo. Crie uma conta gratuita!',
      registered: 'Esta funcionalidade requer upgrade para Pro.',
      pro: 'Acesso negado. Contacte o suporte.'
    },
    enforcement_error: {
      anonymous: 'Erro temporário. Tente novamente em alguns minutos.',
      free: 'Erro temporário. Tente novamente em alguns minutos.',
      registered: 'Erro temporário. Tente novamente em alguns minutos.',
      pro: 'Erro temporário. Tente novamente em alguns minutos.'
    }
  }

  return messages[reason as keyof typeof messages]?.[userType] || 
         'Ocorreu um erro. Tente novamente mais tarde.'
}

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

