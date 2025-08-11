'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Zap, Star, Crown } from 'lucide-react'
import { subscriptionTiers } from '@/lib/payments/stripe'

interface PricingPlansProps {
  currentTier?: string
  userId?: string
  onUpgrade?: (tier: string) => void
}

export function PricingPlans({ currentTier = 'free', userId, onUpgrade }: PricingPlansProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null)

  const handleUpgrade = async (tierKey: string) => {
    const tier = subscriptionTiers[tierKey]
    if (!tier || !tier.stripePriceId || !userId) return

    setIsLoading(tierKey)
    
    try {
      const response = await fetch('/api/payments/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: tier.stripePriceId,
          successUrl: `${window.location.origin}/dashboard?upgrade=success`,
          cancelUrl: `${window.location.origin}/pricing?upgrade=canceled`
        }),
      })

      if (response.ok) {
        const { url } = await response.json()
        window.location.href = url
      } else {
        console.error('Failed to create checkout session')
        setIsLoading(null)
      }
    } catch (error) {
      console.error('Error creating checkout session:', error)
      setIsLoading(null)
    }
  }

  const handleSignUp = () => {
    window.location.href = '/auth/signup'
  }

  const getTierIcon = (tierKey: string) => {
    switch (tierKey) {
      case 'free':
        return <Zap className="w-6 h-6 text-blue-600" />
      case 'registered':
        return <Star className="w-6 h-6 text-green-600" />
      case 'pro':
        return <Crown className="w-6 h-6 text-purple-600" />
      default:
        return <Zap className="w-6 h-6 text-gray-600" />
    }
  }

  const getTierColor = (tierKey: string) => {
    switch (tierKey) {
      case 'free':
        return 'border-blue-200'
      case 'registered':
        return 'border-green-200'
      case 'pro':
        return 'border-purple-200 ring-2 ring-purple-500'
      default:
        return 'border-gray-200'
    }
  }

  const isCurrentTier = (tierKey: string) => tierKey === currentTier

  const plans = [
    {
      key: 'free',
      ...subscriptionTiers.free,
      popular: false,
      description: 'Perfeito para começar',
    },
    {
      key: 'registered',
      ...subscriptionTiers.registered,
      popular: false,
      description: 'Mais cálculos por dia',
    },
    {
      key: 'pro',
      ...subscriptionTiers.pro,
      popular: true,
      description: 'Para profissionais imobiliários',
    },
  ]

  return (
    <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
      {plans.map((plan) => (
        <Card 
          key={plan.key} 
          className={`relative ${getTierColor(plan.key)} ${plan.popular ? 'scale-105' : ''}`}
        >
          {plan.popular && (
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-purple-600 text-white hover:bg-purple-600">
                Mais Popular
              </Badge>
            </div>
          )}
          
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-4">
              {getTierIcon(plan.key)}
            </div>
            <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
            <CardDescription className="text-sm text-gray-600">
              {plan.description}
            </CardDescription>
            
            <div className="mt-4">
              <div className="flex items-baseline justify-center gap-1">
                {plan.price === 0 ? (
                  <span className="text-3xl font-bold text-green-600">Grátis</span>
                ) : (
                  <>
                    <span className="text-3xl font-bold">€{plan.price}</span>
                    <span className="text-gray-600">/{plan.interval === 'month' ? 'mês' : 'ano'}</span>
                  </>
                )}
              </div>
              {plan.key === 'pro' && plan.price && (
                <p className="text-sm text-gray-500 mt-1">
                  Apenas €{(plan.price / 30).toFixed(2)} por dia
                </p>
              )}
            </div>
          </CardHeader>

          <CardContent className="pt-4">
            <div className="space-y-3 mb-6">
              {plan.features?.map((feature, index) => (
                <div key={index} className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{feature}</span>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              {isCurrentTier(plan.key) ? (
                <Button 
                  className="w-full" 
                  variant="outline"
                  disabled
                >
                  Plano Atual
                </Button>
              ) : plan.key === 'registered' && currentTier === 'free' ? (
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  onClick={handleSignUp}
                >
                  Registar Gratuitamente
                </Button>
              ) : plan.key === 'pro' && currentTier !== 'pro' ? (
                <Button 
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  onClick={() => handleUpgrade(plan.key)}
                  disabled={isLoading === plan.key || !userId}
                >
                  {isLoading === plan.key ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processando...
                    </div>
                  ) : (
                    'Upgrade para Pro'
                  )}
                </Button>
              ) : (
                <Button 
                  className="w-full" 
                  variant="outline"
                  disabled
                >
                  {currentTier === 'pro' ? 'Downgrade não disponível' : 'Não disponível'}
                </Button>
              )}
              
              {plan.key === 'pro' && (
                <div className="text-center">
                  <p className="text-xs text-gray-500">
                    Cancele a qualquer momento • Sem compromisso
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// Compact version for usage warnings
export function CompactPricingCard({ 
  currentTier = 'free', 
  onUpgrade 
}: { 
  currentTier?: string
  onUpgrade?: () => void 
}) {
  const [isLoading, setIsLoading] = useState(false)
  
  const proTier = subscriptionTiers.pro

  const handleUpgrade = async () => {
    if (!proTier || !proTier.stripePriceId) return
    
    setIsLoading(true)
    onUpgrade?.()
  }

  if (currentTier === 'pro') return null

  return (
    <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Crown className="w-8 h-8 text-purple-600" />
            <div>
              <h3 className="font-semibold text-purple-900">Upgrade para Pro</h3>
              <p className="text-sm text-purple-700">Cálculos ilimitados + muito mais</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-purple-900">€{proTier?.price}</div>
            <div className="text-xs text-purple-600">/mês</div>
          </div>
        </div>
        
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-green-500" />
            <span>Cálculos ilimitados</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-green-500" />
            <span>Gestão de clientes</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-green-500" />
            <span>Relatórios avançados</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-green-500" />
            <span>Suporte prioritário</span>
          </div>
        </div>

        <Button 
          className="w-full mt-4 bg-purple-600 hover:bg-purple-700 text-white"
          onClick={handleUpgrade}
          disabled={isLoading}
        >
          {isLoading ? 'Processando...' : 'Fazer Upgrade Agora'}
        </Button>
      </CardContent>
    </Card>
  )
}