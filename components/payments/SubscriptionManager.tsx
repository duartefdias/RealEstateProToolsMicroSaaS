'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { pt } from 'date-fns/locale'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { 
  CreditCard, 
  Calendar, 
  User, 
  AlertCircle, 
  CheckCircle, 
  ExternalLink,
  Settings,
  TrendingUp,
  DollarSign
} from 'lucide-react'
import { SubscriptionManagement } from '@/types/payment'

interface SubscriptionManagerProps {
  subscription: SubscriptionManagement | null
  onRefresh?: () => void
}

export function SubscriptionManager({ subscription, onRefresh }: SubscriptionManagerProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const handleCustomerPortal = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/payments/customer-portal', {
        method: 'POST'
      })
      
      if (response.ok) {
        const { url } = await response.json()
        window.location.href = url
      } else {
        console.error('Failed to create customer portal session')
      }
    } catch (error) {
      console.error('Error accessing customer portal:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelSubscription = async () => {
    setIsProcessing(true)
    try {
      const response = await fetch('/api/payments/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: cancelReason })
      })

      if (response.ok) {
        setShowCancelDialog(false)
        setCancelReason('')
        onRefresh?.()
      } else {
        console.error('Failed to cancel subscription')
      }
    } catch (error) {
      console.error('Error canceling subscription:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReactivateSubscription = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/payments/reactivate-subscription', {
        method: 'POST'
      })

      if (response.ok) {
        onRefresh?.()
      } else {
        console.error('Failed to reactivate subscription')
      }
    } catch (error) {
      console.error('Error reactivating subscription:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!subscription) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-gray-500">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>Erro ao carregar informações da subscrição</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Ativo</Badge>
      case 'canceled':
        return <Badge variant="destructive">Cancelado</Badge>
      case 'past_due':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Em Atraso</Badge>
      case 'incomplete':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Incompleto</Badge>
      default:
        return <Badge variant="secondary">Desconhecido</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Subscription Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Detalhes da Subscrição
              </CardTitle>
              <CardDescription>
                Gerencie o seu plano e faturação
              </CardDescription>
            </div>
            {subscription.subscription && getStatusBadge(subscription.subscription.status)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Plano Atual</p>
                <p className="font-semibold text-lg">Plano Pro</p>
              </div>
              
              {subscription.subscription && (
                <div>
                  <p className="text-sm text-gray-600">Próxima Cobrança</p>
                  <p className="font-medium flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {format(subscription.nextBillingDate!, 'dd/MM/yyyy', { locale: pt })}
                  </p>
                </div>
              )}
              
              {subscription.customer && (
                <div>
                  <p className="text-sm text-gray-600">Cliente</p>
                  <p className="font-medium flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {subscription.customer.email}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Cálculos Hoje</p>
                <div className="flex items-center gap-2">
                  <div className="text-lg font-semibold">
                    {subscription.currentUsage.calculationsUsed} / {' '}
                    {subscription.currentUsage.calculationsLimit === Infinity 
                      ? '∞' 
                      : subscription.currentUsage.calculationsLimit
                    }
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {subscription.currentUsage.calculationsLimit === Infinity 
                      ? 'Ilimitado'
                      : `${subscription.currentUsage.calculationsLimit - subscription.currentUsage.calculationsUsed} restantes`
                    }
                  </Badge>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Reinicialização</p>
                <p className="text-sm text-gray-500">
                  {format(subscription.currentUsage.resetDate, "dd/MM/yyyy 'às' HH:mm", { locale: pt })}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Ações da Conta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={handleCustomerPortal}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              {isLoading ? 'Carregando...' : 'Gerir Faturação'}
            </Button>

            {subscription.canReactivate && (
              <Button 
                variant="outline"
                onClick={handleReactivateSubscription}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Reativar Subscrição
              </Button>
            )}

            {subscription.canCancel && (
              <Button 
                variant="outline"
                onClick={() => setShowCancelDialog(true)}
                className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
              >
                <AlertCircle className="w-4 h-4" />
                Cancelar Subscrição
              </Button>
            )}
          </div>

          {subscription.subscription?.cancelAtPeriodEnd && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">
                    Subscrição Agendada para Cancelamento
                  </p>
                  <p className="text-sm text-yellow-700">
                    A sua subscrição será cancelada em{' '}
                    {subscription.nextBillingDate && 
                      format(subscription.nextBillingDate, 'dd/MM/yyyy', { locale: pt })
                    }. Pode reativar a qualquer momento antes desta data.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment History */}
      {subscription.paymentHistory && subscription.paymentHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Histórico de Pagamentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {subscription.paymentHistory.slice(0, 5).map((payment) => (
                <div key={payment.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="font-medium">{payment.description}</p>
                    <p className="text-sm text-gray-500">
                      {format(new Date(payment.createdAt), 'dd/MM/yyyy HH:mm', { locale: pt })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      €{(payment.amount / 100).toFixed(2)}
                    </p>
                    <Badge 
                      variant={payment.status === 'succeeded' ? 'default' : 'destructive'}
                      className="text-xs"
                    >
                      {payment.status === 'succeeded' ? 'Pago' : 'Falhou'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cancel Subscription Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar Subscrição</DialogTitle>
            <DialogDescription>
              Tem certeza que pretende cancelar a sua subscrição? Esta ação irá cancelar 
              a subscrição no final do período atual de faturação.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="cancel-reason">Motivo do cancelamento (opcional)</Label>
              <Textarea
                id="cancel-reason"
                placeholder="Diga-nos porque está a cancelar..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="mt-2"
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowCancelDialog(false)}
              disabled={isProcessing}
            >
              Manter Subscrição
            </Button>
            <Button 
              variant="destructive"
              onClick={handleCancelSubscription}
              disabled={isProcessing}
            >
              {isProcessing ? 'Processando...' : 'Cancelar Subscrição'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}