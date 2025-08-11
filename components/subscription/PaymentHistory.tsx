'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  CreditCard, 
  Download, 
  Calendar,
  CheckCircle,
  XCircle,
  Clock 
} from 'lucide-react'
import { formatPrice } from '@/lib/payments/stripe'

interface PaymentRecord {
  id: string
  stripe_payment_intent_id: string
  amount: number
  currency: string
  status: string
  description: string
  created_at: string
}

interface PaymentHistoryProps {
  className?: string
}

export default function PaymentHistory({ className }: PaymentHistoryProps) {
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPaymentHistory()
  }, [])

  const fetchPaymentHistory = async () => {
    try {
      const response = await fetch('/api/payments/history')
      if (!response.ok) {
        throw new Error('Failed to fetch payment history')
      }
      const data = await response.json()
      setPayments(data.payments || [])
    } catch (error) {
      console.error('Error fetching payment history:', error)
      setError('Failed to load payment history')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'succeeded':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'succeeded':
        return 'bg-green-100 text-green-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-PT', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">{error}</p>
          <Button 
            onClick={fetchPaymentHistory} 
            variant="outline" 
            size="sm"
            className="mt-2"
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment History
        </CardTitle>
        <CardDescription>
          View your payment history and download receipts
        </CardDescription>
      </CardHeader>
      <CardContent>
        {payments.length === 0 ? (
          <div className="text-center py-8">
            <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No payment history found</p>
            <p className="text-sm text-gray-500 mt-1">
              Your payment records will appear here after your first transaction
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {getStatusIcon(payment.status)}
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{payment.description}</p>
                      <Badge 
                        variant="secondary" 
                        className={getStatusColor(payment.status)}
                      >
                        {payment.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(payment.created_at)}
                      </span>
                      <span>
                        ID: {payment.stripe_payment_intent_id}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-lg">
                    {formatPrice(payment.amount / 100, payment.currency)}
                  </p>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="mt-1 h-8"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Receipt
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}