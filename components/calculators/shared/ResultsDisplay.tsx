'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  TrendingUp, 
  TrendingDown, 
  Euro, 
  Calculator, 
  Download,
  Share2,
  Star,
  Crown,
  AlertTriangle,
  CheckCircle,
  Info,
  ArrowRight,
  PieChart,
  BarChart3,
  FileText
} from 'lucide-react'
import { BaseCalculationResult, CalculationBreakdown, UserType } from '@/types/calculator'
import { useAuth } from '@/lib/auth/context'
import { cn } from '@/lib/utils'

interface ResultsDisplayProps {
  result: BaseCalculationResult
  className?: string
  showConversionPrompts?: boolean
  onUpgrade?: () => void
  onShare?: () => void
  onSave?: () => void
  showDetailedBreakdown?: boolean
}

export function ResultsDisplay({
  result,
  className,
  showConversionPrompts = true,
  onUpgrade,
  onShare,
  onSave,
  showDetailedBreakdown = true
}: ResultsDisplayProps) {
  const router = useRouter()
  const { user, profile } = useAuth()
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)
  const [animateValues, setAnimateValues] = useState(false)

  const userType: UserType = user 
    ? (profile?.subscription_tier as UserType) || 'free'
    : 'anonymous'

  const isPro = userType === 'pro'
  const isRegistered = ['registered', 'pro'].includes(userType)

  // Animate values on mount
  useEffect(() => {
    const timer = setTimeout(() => setAnimateValues(true), 100)
    return () => clearTimeout(timer)
  }, [])

  // Show upgrade prompts after viewing results
  useEffect(() => {
    if (showConversionPrompts && !isPro) {
      const timer = setTimeout(() => setShowUpgradePrompt(true), 3000)
      return () => clearTimeout(timer)
    }
  }, [showConversionPrompts, isPro])

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatPercentage = (value: number): string => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 2
    }).format(value)
  }

  const getBreakdownByCategory = (breakdown: CalculationBreakdown[]) => {
    const categories = breakdown.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = []
      }
      acc[item.category]!.push(item)
      return acc
    }, {} as Record<string, CalculationBreakdown[]>)

    return categories
  }

  const getCategoryInfo = (category: string) => {
    const categoryMap = {
      fee: { label: 'Taxas e Comissões', icon: Euro, color: 'text-blue-600' },
      tax: { label: 'Impostos', icon: FileText, color: 'text-red-600' },
      cost: { label: 'Custos Operacionais', icon: Calculator, color: 'text-orange-600' },
      insurance: { label: 'Seguros', icon: CheckCircle, color: 'text-green-600' },
      other: { label: 'Outros', icon: Info, color: 'text-gray-600' }
    }
    
    return categoryMap[category as keyof typeof categoryMap] || categoryMap.other
  }

  const getImpactLevel = (value: number, total: number) => {
    const percentage = Math.abs(value) / total
    if (percentage > 0.1) return 'high'
    if (percentage > 0.05) return 'medium'
    return 'low'
  }

  const categorizedBreakdown = getBreakdownByCategory(result.breakdown)

  return (
    <div className={cn("space-y-6", className)}>
      {/* Main Result Card */}
      <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold text-green-900">
                {result.summary.title}
              </CardTitle>
              {result.summary.subtitle && (
                <CardDescription className="text-green-700 mt-1">
                  {result.summary.subtitle}
                </CardDescription>
              )}
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-green-900">
                {animateValues ? formatCurrency(result.summary.mainValue) : '€ 0'}
              </div>
              <div className="text-sm text-green-700">
                {result.summary.mainValueLabel}
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {result.summary.keyMetrics.map((metric, index) => (
              <div key={index} className="text-center p-3 bg-white/60 rounded-lg">
                <div className="text-lg font-semibold text-gray-900">
                  {metric.format === 'currency' 
                    ? formatCurrency(metric.value as number)
                    : metric.format === 'percentage'
                    ? formatPercentage(metric.value as number)
                    : metric.value
                  }
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {metric.label}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Breakdown */}
      {showDetailedBreakdown && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Detalhe dos Custos
              </CardTitle>
              {!isPro && (
                <Badge 
                  variant="outline" 
                  className="border-purple-200 text-purple-700 bg-purple-50 cursor-pointer hover:bg-purple-100"
                  onClick={onUpgrade}
                >
                  <Crown className="w-3 h-3 mr-1" />
                  Pro: Relatório Detalhado
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(categorizedBreakdown).map(([category, items]) => {
              const categoryInfo = getCategoryInfo(category)
              const categoryTotal = items.reduce((sum, item) => sum + Math.abs(item.value), 0)
              const CategoryIcon = categoryInfo.icon

              return (
                <div key={category} className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <CategoryIcon className={cn("w-4 h-4", categoryInfo.color)} />
                    {categoryInfo.label}
                    <span className="ml-auto font-mono">
                      {formatCurrency(categoryTotal)}
                    </span>
                  </div>
                  
                  <div className="space-y-2 pl-6">
                    {items.map((item) => {
                      const impact = getImpactLevel(item.value, result.totalAmount)
                      const isDeduction = item.isDeduction
                      
                      return (
                        <div key={item.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">
                                {item.label}
                              </span>
                              {impact === 'high' && (
                                <Badge variant="destructive" className="text-xs">
                                  Alto Impacto
                                </Badge>
                              )}
                              {!item.required && (
                                <Badge variant="outline" className="text-xs">
                                  Opcional
                                </Badge>
                              )}
                            </div>
                            {item.description && (
                              <p className="text-xs text-gray-600 mt-1">
                                {item.description}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <div className={cn(
                              "font-mono font-medium",
                              isDeduction ? "text-red-600" : "text-gray-900"
                            )}>
                              {isDeduction ? '-' : ''}{formatCurrency(Math.abs(item.value))}
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatPercentage(Math.abs(item.value) / result.totalAmount)}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {result.recommendations && result.recommendations.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Star className="w-5 h-5" />
              Recomendações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {result.recommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-blue-800">
                  <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  {recommendation}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3 justify-center">
        {onShare && (
          <Button variant="outline" onClick={onShare} className="flex items-center gap-2">
            <Share2 className="w-4 h-4" />
            Partilhar Resultado
          </Button>
        )}
        
        {onSave && isRegistered && (
          <Button variant="outline" onClick={onSave} className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Guardar Cálculo
          </Button>
        )}

        {!isPro && (
          <Button 
            onClick={onUpgrade || (() => router.push('/pricing'))}
            className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
          >
            <Crown className="w-4 h-4" />
            Upgrade para Funcionalidades Premium
            <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Conversion Prompts */}
      {showUpgradePrompt && !isPro && showConversionPrompts && (
        <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full">
                <Crown className="w-6 h-6 text-purple-600" />
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-purple-900">
                  Desbloqueie Todo o Potencial
                </h3>
                <p className="text-purple-700 max-w-md mx-auto">
                  Com o plano Pro tem acesso a relatórios detalhados, análises avançadas, 
                  gestão de clientes e muito mais.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto text-sm">
                <div className="text-center">
                  <PieChart className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <div className="font-medium">Análises Visuais</div>
                  <div className="text-gray-600">Gráficos interativos</div>
                </div>
                <div className="text-center">
                  <Download className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <div className="font-medium">Relatórios PDF</div>
                  <div className="text-gray-600">Exportar para clientes</div>
                </div>
              </div>

              <Button 
                onClick={onUpgrade || (() => router.push('/pricing'))}
                size="lg"
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                Começar Período de Teste Gratuito
              </Button>
              
              <div className="text-xs text-gray-500">
                7 dias grátis • Cancele a qualquer momento
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Disclaimers */}
      {result.disclaimers && result.disclaimers.length > 0 && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <div className="space-y-1">
              <div className="font-medium">Isenções de Responsabilidade:</div>
              <ul className="text-sm space-y-1 ml-4">
                {result.disclaimers.map((disclaimer, index) => (
                  <li key={index} className="list-disc">
                    {disclaimer}
                  </li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Calculation Metadata */}
      <div className="text-center text-xs text-gray-500">
        Calculado em {result.calculatedAt.toLocaleString('pt-PT')} • 
        Dados baseados na legislação portuguesa vigente
      </div>
    </div>
  )
}

// Compact version for use in lists or previews
export function CompactResultsDisplay({ 
  result, 
  onClick,
  className 
}: { 
  result: BaseCalculationResult
  onClick?: () => void
  className?: string 
}) {
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  return (
    <Card 
      className={cn(
        "cursor-pointer hover:shadow-md transition-shadow",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="pt-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-gray-900">{result.summary.title}</h3>
            <p className="text-sm text-gray-600">{result.summary.subtitle}</p>
            <p className="text-xs text-gray-500 mt-1">
              {result.calculatedAt.toLocaleDateString('pt-PT')}
            </p>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-green-600">
              {formatCurrency(result.summary.mainValue)}
            </div>
            <div className="text-xs text-gray-500">
              {result.summary.mainValueLabel}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}