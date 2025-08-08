'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { pt } from 'date-fns/locale'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, Clock, CreditCard, Zap } from 'lucide-react'

interface UsageLimitModalProps {
  isOpen: boolean
  onClose: () => void
  userType: 'anonymous' | 'free' | 'registered' | 'pro'
  checkoutUrl?: string
  resetTime: Date
  remaining: number
  used: number
  limit: number
}

export function UsageLimitModal({
  isOpen,
  onClose,
  userType,
  checkoutUrl,
  resetTime,
  remaining,
  used,
  limit
}: UsageLimitModalProps) {
  const [isUpgrading, setIsUpgrading] = useState(false)
  
  const timeUntilReset = formatDistanceToNow(resetTime, { 
    locale: pt,
    addSuffix: false 
  })

  const handleUpgrade = async () => {
    if (!checkoutUrl) return
    
    setIsUpgrading(true)
    window.location.href = checkoutUrl
  }

  const getModalContent = () => {
    switch (userType) {
      case 'anonymous':
        return {
          title: 'Limite Diário Atingido',
          description: 'Atingiu o limite de 5 cálculos por dia para utilizadores não registados.',
          action: 'Registe-se Gratuitamente',
          actionUrl: '/auth/signup',
          benefits: [
            '10 cálculos por dia',
            'Histórico de cálculos',
            'Suporte por email'
          ]
        }
      case 'free':
        return {
          title: 'Limite Diário Atingido',
          description: 'Atingiu o limite de 5 cálculos por dia do plano gratuito.',
          action: 'Upgrade para Pro',
          actionUrl: checkoutUrl,
          benefits: [
            'Cálculos ilimitados',
            'Gestão de clientes',
            'Relatórios avançados',
            'Suporte prioritário'
          ]
        }
      case 'registered':
        return {
          title: 'Limite Diário Atingido',
          description: 'Atingiu o limite de 10 cálculos por dia do plano registado.',
          action: 'Upgrade para Pro',
          actionUrl: checkoutUrl,
          benefits: [
            'Cálculos ilimitados',
            'Gestão de clientes',
            'Relatórios avançados',
            'Exportar para PDF/Excel',
            'Suporte prioritário'
          ]
        }
      default:
        return {
          title: 'Erro',
          description: 'Ocorreu um erro inesperado.',
          action: 'Fechar',
          actionUrl: null,
          benefits: []
        }
    }
  }

  const modalContent = getModalContent()

  return (
    <Dialog open={isOpen} onOpenChange={() => {}} modal>
      <DialogContent 
        className="sm:max-w-md max-w-[95vw] mx-auto p-0"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="p-6">
          <DialogHeader className="text-center space-y-3">
            <div className="mx-auto w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
              <Zap className="w-6 h-6 text-amber-600" />
            </div>
            <DialogTitle className="text-xl font-semibold text-gray-900">
              {modalContent.title}
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              {modalContent.description}
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-6 space-y-4">
            {/* Usage Summary */}
            <Card className="bg-gray-50 border-gray-200">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Cálculos hoje:</span>
                  <Badge variant="secondary" className="bg-gray-200">
                    {used}/{limit === Infinity ? '∞' : limit}
                  </Badge>
                </div>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-amber-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${limit === Infinity ? 0 : (used / limit) * 100}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Reset Time */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 text-blue-800">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">
                  Limite reposto em {timeUntilReset}
                </span>
              </div>
            </div>
            
            {/* Benefits */}
            {modalContent.benefits.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">
                    {userType === 'anonymous' ? 'Registe-se e obtenha:' : 'Upgrade para Pro e obtenha:'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {modalContent.benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{benefit}</span>
                    </div>
                  ))}
                  {userType !== 'anonymous' && (
                    <div className="pt-2 border-t border-gray-200 mt-3">
                      <div className="text-center">
                        <span className="text-2xl font-bold text-green-600">€9.99</span>
                        <span className="text-sm text-gray-600">/mês</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
        
        <DialogFooter className="flex-col sm:flex-col space-y-2 p-6 pt-0">
          {modalContent.actionUrl && (
            <Button 
              onClick={modalContent.actionUrl.startsWith('http') ? handleUpgrade : () => window.location.href = modalContent.actionUrl!}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isUpgrading}
            >
              {isUpgrading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Redirecionando...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {userType === 'anonymous' ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <CreditCard className="w-4 h-4" />
                  )}
                  {modalContent.action}
                </div>
              )}
            </Button>
          )}
          
          <Button 
            variant="outline" 
            onClick={onClose}
            className="w-full"
            disabled={isUpgrading}
          >
            Aguardar Reset ({timeUntilReset})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Hook to use the modal
export function useUsageLimitModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [modalData, setModalData] = useState<Omit<UsageLimitModalProps, 'isOpen' | 'onClose'> | null>(null)

  const showModal = (data: Omit<UsageLimitModalProps, 'isOpen' | 'onClose'>) => {
    setModalData(data)
    setIsOpen(true)
  }

  const hideModal = () => {
    setIsOpen(false)
    setTimeout(() => setModalData(null), 300) // Wait for animation
  }

  const UsageLimitModalComponent = modalData ? (
    <UsageLimitModal
      {...modalData}
      isOpen={isOpen}
      onClose={hideModal}
    />
  ) : null

  return {
    showUsageLimitModal: showModal,
    hideUsageLimitModal: hideModal,
    UsageLimitModal: UsageLimitModalComponent,
    isUsageLimitModalOpen: isOpen
  }
}