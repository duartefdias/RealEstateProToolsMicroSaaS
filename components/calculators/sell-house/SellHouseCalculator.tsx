'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { FieldRenderer } from '../shared/FieldRenderer'
import { ResultsDisplay } from '../shared/ResultsDisplay'
import { COMMON_FIELD_CONFIGS } from '@/lib/calculators/config'
import { calculateSellHouseCosts, validateSellHouseInput } from '@/lib/calculators/sell-house-logic'
import { SellHouseInput, BaseCalculationResult, CalculatorFieldConfig } from '@/types/calculator'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calculator, TrendingUp, Home, AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useCalculatorContext } from '@/contexts/CalculatorContext'

export function SellHouseCalculator() {
  const { user, profile } = useAuth()
  const router = useRouter()
  const { onCalculate: contextOnCalculate } = useCalculatorContext()
  
  // Form state
  const [inputs, setInputs] = useState<Partial<SellHouseInput>>({
    location: '',
    hasOutstandingMortgage: false,
    realEstateAgentCommission: 0.06, // 6% default
    hasCapitalGains: false,
    isMainResidence: true
  })
  
  // UI state
  const [result, setResult] = useState<BaseCalculationResult | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [validationWarnings, setValidationWarnings] = useState<string[]>([])
  const [isCalculating, setIsCalculating] = useState(false)
  const [showResults, setShowResults] = useState(false)
  
  
  // Field configurations for the form
  const fieldConfigs: CalculatorFieldConfig[] = [
    COMMON_FIELD_CONFIGS.propertyValue!,
    COMMON_FIELD_CONFIGS.location!,
    COMMON_FIELD_CONFIGS.realEstateAgentCommission!,
    COMMON_FIELD_CONFIGS.hasOutstandingMortgage!,
    COMMON_FIELD_CONFIGS.outstandingMortgageAmount!,
    {
      id: 'mortgageType',
      type: 'select',
      label: 'Tipo de Crédito',
      helpText: 'Tipo de taxa de juro (afeta custos de liquidação antecipada)',
      required: false,
      options: [
        { value: 'variable', label: 'Taxa Variável (Euribor + spread)' },
        { value: 'fixed', label: 'Taxa Fixa' },
        { value: 'mixed', label: 'Taxa Mista' }
      ],
      validation: {},
      defaultValue: 'variable',
      conditional: {
        field: 'hasOutstandingMortgage',
        value: true,
        operator: 'equals'
      },
      tier: 'free'
    },
    {
      id: 'hasCapitalGains',
      type: 'boolean',
      label: 'Tem ganhos de capital?',
      helpText: 'Se o valor de venda é superior ao preço de compra original',
      required: false,
      validation: {},
      tier: 'free'
    },
    {
      id: 'originalPurchasePrice',
      type: 'currency',
      label: 'Preço de Compra Original',
      placeholder: '€ 180,000',
      helpText: 'Valor pelo qual comprou o imóvel (para cálculo de mais-valias)',
      required: false,
      validation: {
        min: 0,
        max: 10000000
      },
      conditional: {
        field: 'hasCapitalGains',
        value: true,
        operator: 'equals'
      },
      tier: 'free'
    },
    {
      id: 'yearOfPurchase',
      type: 'number',
      label: 'Ano de Compra',
      placeholder: '2018',
      helpText: 'Ano em que adquiriu o imóvel (para isenção de 3 anos)',
      required: false,
      validation: {
        min: 1990,
        max: new Date().getFullYear()
      },
      conditional: {
        field: 'hasCapitalGains',
        value: true,
        operator: 'equals'
      },
      tier: 'free'
    },
    {
      id: 'improvementCosts',
      type: 'currency',
      label: 'Custos de Melhoramentos',
      placeholder: '€ 15,000',
      helpText: 'Valor investido em melhorias (deduzível nas mais-valias)',
      required: false,
      validation: {
        min: 0,
        max: 1000000
      },
      conditional: {
        field: 'hasCapitalGains',
        value: true,
        operator: 'equals'
      },
      tier: 'free'
    },
    {
      id: 'isMainResidence',
      type: 'boolean',
      label: 'É habitação própria permanente?',
      helpText: 'Habitação própria permanente pode estar isenta de impostos sobre mais-valias',
      required: false,
      validation: {},
      defaultValue: true,
      conditional: {
        field: 'hasCapitalGains',
        value: true,
        operator: 'equals'
      },
      tier: 'free'
    }
  ]
  
  // Handle input changes
  const handleInputChange = (fieldId: string, value: any) => {
    setInputs(prev => ({
      ...prev,
      [fieldId]: value
    }))
    
    // Clear validation error for this field
    if (validationErrors[fieldId]) {
      setValidationErrors(prev => ({
        ...prev,
        [fieldId]: ''
      }))
    }
    
    // Clear results when inputs change
    if (showResults) {
      setShowResults(false)
      setResult(null)
    }
  }
  
  // Handle calculation - this will be called by CalculatorWrapper
  const handleCalculate = async () => {
    console.log('🧮 [SellHouseCalculator] handleCalculate called')
    
    try {
      setIsCalculating(true)
      
      // Validate inputs
      console.log('🧮 [SellHouseCalculator] Validating inputs:', inputs)
      const validation = validateSellHouseInput(inputs)
      
      if (!validation.isValid) {
        console.log('❌ [SellHouseCalculator] Validation failed:', validation.errors)
        setValidationErrors(validation.errors)
        setValidationWarnings(validation.warnings)
        return
      }
      
      console.log('✅ [SellHouseCalculator] Validation passed, performing calculation...')
      setValidationErrors({})
      setValidationWarnings(validation.warnings)
      
      // Perform calculation
      const calculationResult = calculateSellHouseCosts(inputs as SellHouseInput)
      console.log('✅ [SellHouseCalculator] Calculation completed:', calculationResult)
      setResult(calculationResult)
      setShowResults(true)
      
      // Track calculation in database only if not using wrapper context
      if (!contextOnCalculate) {
        console.log('📊 [SellHouseCalculator] Tracking calculation in database...')
        try {
          const response = await fetch('/api/usage/increment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              calculatorType: 'sell-house',
              userId: user?.id,
              inputData: inputs
            })
          })
          
          const responseData = await response.json()
          console.log('📊 [SellHouseCalculator] Usage tracking response:', responseData)
          
          if (!response.ok) {
            console.error('❌ [SellHouseCalculator] Failed to track calculation:', responseData)
          } else {
            console.log('✅ [SellHouseCalculator] Calculation tracked successfully')
          }
        } catch (trackingError) {
          console.error('❌ [SellHouseCalculator] Error tracking calculation:', trackingError)
        }
      } else {
        console.log('📊 [SellHouseCalculator] Skipping usage tracking - wrapper will handle it')
      }
      
      // Track calculation completion in PostHog
      if (typeof window !== 'undefined' && (window as any).posthog) {
        (window as any).posthog.capture('calculation_completed', {
          calculator_type: 'sell-house',
          property_value: inputs.propertyValue,
          location: inputs.location,
          has_mortgage: inputs.hasOutstandingMortgage,
          has_capital_gains: inputs.hasCapitalGains,
          user_type: user ? 'registered' : 'anonymous'
        })
      }
      
    } catch (error) {
      console.error('❌ [SellHouseCalculator] Calculation error:', error)
      setValidationErrors({
        general: 'Erro no cálculo. Tente novamente ou contacte o suporte.'
      })
    } finally {
      setIsCalculating(false)
    }
  }

  // Handle button click - use context function if available
  const handleCalculateButtonClick = async () => {
    console.log('🔘 [SellHouseCalculator] Calculate button clicked')
    console.log('🔘 [SellHouseCalculator] Context onCalculate available:', !!contextOnCalculate)
    
    if (contextOnCalculate) {
      console.log('🔘 [SellHouseCalculator] Using context onCalculate (wrapper will handle usage tracking)')
      await contextOnCalculate()
    } else {
      console.log('🔘 [SellHouseCalculator] No context onCalculate, calling handleCalculate directly')
      await handleCalculate()
    }
  }

  
  // Reset form
  const handleReset = () => {
    setInputs({
      location: '',
      hasOutstandingMortgage: false,
      realEstateAgentCommission: 0.06,
      hasCapitalGains: false,
      isMainResidence: true
    })
    setResult(null)
    setShowResults(false)
    setValidationErrors({})
    setValidationWarnings([])
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Input Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Calculator className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Dados do Imóvel</CardTitle>
                    <CardDescription>
                      Introduza os dados da propriedade para calcular custos de venda
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Validation warnings */}
                {validationWarnings.length > 0 && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <ul className="list-disc list-inside space-y-1">
                        {validationWarnings.map((warning, index) => (
                          <li key={index}>{warning}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
                
                {/* General error */}
                {validationErrors.general && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{validationErrors.general}</AlertDescription>
                  </Alert>
                )}
                
                {/* Input Fields */}
                <FieldRenderer
                  configs={fieldConfigs}
                  values={inputs}
                  onChange={handleInputChange}
                  errors={validationErrors}
                  disabled={isCalculating}
                  onUpgrade={() => router.push('/pricing')}
                />
                
                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    onClick={handleCalculateButtonClick}
                    disabled={isCalculating || !inputs.propertyValue || !inputs.location}
                    className="flex-1"
                  >
                    {isCalculating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Calculando...
                      </>
                    ) : (
                      <>
                        <Calculator className="w-4 h-4 mr-2" />
                        Calcular Custos
                      </>
                    )}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={handleReset}
                    disabled={isCalculating}
                  >
                    Limpar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <Home className="w-5 h-5 mr-2 text-blue-600" />
                  Custos Típicos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Comissão imobiliária:</span>
                  <span className="font-medium">5-7%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Custos legais:</span>
                  <span className="font-medium">€500-1.000</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Mais-valias:</span>
                  <span className="font-medium">0-28%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Outros custos:</span>
                  <span className="font-medium">€750-1.500</span>
                </div>
              </CardContent>
            </Card>
            
            {/* Tips */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                  Dicas para Poupar
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                  <p>Compare comissões de diferentes imobiliárias</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                  <p>Se é habitação própria há +3 anos, não paga mais-valias</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                  <p>Guarde recibos de melhoramentos para deduzir</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                  <p>Considere venda direta para economizar comissão</p>
                </div>
              </CardContent>
            </Card>
            
            {/* Pro Features Teaser */}
            {!user || (user && !['pro'].includes(profile?.subscription_tier || 'free')) && (
              <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center text-purple-700">
                    <Badge variant="secondary" className="mr-2 bg-purple-100 text-purple-700">
                      PRO
                    </Badge>
                    Funcionalidades Premium
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex items-center text-purple-600">
                    <span className="mr-2">✓</span>
                    <span>Cálculos ilimitados</span>
                  </div>
                  <div className="flex items-center text-purple-600">
                    <span className="mr-2">✓</span>
                    <span>Relatórios detalhados PDF</span>
                  </div>
                  <div className="flex items-center text-purple-600">
                    <span className="mr-2">✓</span>
                    <span>Comparação de cenários</span>
                  </div>
                  <div className="flex items-center text-purple-600">
                    <span className="mr-2">✓</span>
                    <span>Gestão de clientes</span>
                  </div>
                  
                  <Button 
                    className="w-full mt-3 bg-purple-600 hover:bg-purple-700"
                    onClick={() => router.push('/pricing')}
                  >
                    Atualizar para Pro - €9,99/mês
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
        
        {/* Results Display */}
        {showResults && result && (
          <div className="mt-8">
            <ResultsDisplay 
              result={result} 
              onUpgrade={() => router.push('/pricing')}
            />
          </div>
        )}
    </div>
  )
}