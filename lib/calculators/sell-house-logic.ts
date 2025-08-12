import { SellHouseInput, BaseCalculationResult, CalculationBreakdown } from '@/types/calculator'
import { PORTUGUESE_REGIONS, MARKET_DATA } from './config'

/**
 * Portuguese Real Estate Selling Cost Calculator
 * 
 * Calculates all costs associated with selling a property in Portugal including:
 * - Real estate agent commissions
 * - Outstanding mortgage liquidation
 * - Capital gains tax (mais-valias)
 * - Legal fees and notary costs
 * - Early mortgage termination fees
 */

export interface SellHouseCalculationResult extends BaseCalculationResult {
  netProceeds: number                    // Amount received after all costs
  totalCosts: number                     // Sum of all selling costs
  capitalGainsTax: number               // Tax on capital gains
  mortgageLiquidation: number           // Outstanding mortgage amount
  agentCommission: number               // Real estate agent commission
  legalFees: number                     // Notary and legal costs
  otherCosts: number                    // Miscellaneous costs
  taxExemption: boolean                 // Whether capital gains tax applies
}

/**
 * Calculate real estate agent commission
 */
function calculateAgentCommission(
  propertyValue: number, 
  commissionRate: number
): { amount: number; description: string } {
  const amount = propertyValue * commissionRate
  const percentage = (commissionRate * 100).toFixed(1)
  
  return {
    amount,
    description: `Comissão de ${percentage}% sobre o valor de venda (€${propertyValue.toLocaleString('pt-PT')})`
  }
}

/**
 * Calculate capital gains tax (Imposto sobre Mais-valias)
 * Portuguese tax law: 28% on capital gains, with exemptions
 */
function calculateCapitalGainsTax(input: SellHouseInput): {
  tax: number
  gainAmount: number
  exemption: boolean
  description: string
} {
  if (!input.hasCapitalGains || !input.originalPurchasePrice) {
    return {
      tax: 0,
      gainAmount: 0,
      exemption: true,
      description: 'Sem mais-valias a declarar'
    }
  }

  const purchasePrice = input.originalPurchasePrice + (input.improvementCosts || 0)
  const gainAmount = Math.max(0, input.propertyValue - purchasePrice)
  
  if (gainAmount === 0) {
    return {
      tax: 0,
      gainAmount: 0,
      exemption: true,
      description: 'Sem ganhos de capital (valor de venda ≤ valor de compra + melhoramentos)'
    }
  }

  // Main residence exemption: no tax if owned for more than 3 years
  const currentYear = new Date().getFullYear()
  const ownershipYears = input.yearOfPurchase ? currentYear - input.yearOfPurchase : 0
  const mainResidenceExemption = input.isMainResidence && ownershipYears >= 3

  if (mainResidenceExemption) {
    return {
      tax: 0,
      gainAmount,
      exemption: true,
      description: `Isenção: habitação própria permanente há ${ownershipYears} anos (isento se > 3 anos)`
    }
  }

  // Calculate 28% tax on capital gains
  const tax = gainAmount * MARKET_DATA.taxRates.capitalGains
  
  return {
    tax,
    gainAmount,
    exemption: false,
    description: `28% sobre mais-valia de €${gainAmount.toLocaleString('pt-PT')} ${
      input.isMainResidence ? `(habitação própria há apenas ${ownershipYears} anos)` : '(não habitação própria)'
    }`
  }
}

/**
 * Calculate legal fees (notary, registration, documentation)
 */
function calculateLegalFees(propertyValue: number): {
  notaryFee: number
  registrationFee: number
  documentationFee: number
  total: number
} {
  // Notary fees vary by property value (typically €200-800)
  const notaryFee = Math.min(800, Math.max(200, propertyValue * 0.001))
  
  // Property registration fee (fixed)
  const registrationFee = MARKET_DATA.legalFees.registration
  
  // Documentation and administrative fees
  const documentationFee = 150
  
  return {
    notaryFee,
    registrationFee,
    documentationFee,
    total: notaryFee + registrationFee + documentationFee
  }
}

/**
 * Calculate mortgage liquidation costs
 */
function calculateMortgageLiquidation(input: SellHouseInput): {
  outstandingAmount: number
  earlyTerminationFee: number
  total: number
  description: string
} {
  if (!input.hasOutstandingMortgage || !input.outstandingMortgageAmount) {
    return {
      outstandingAmount: 0,
      earlyTerminationFee: 0,
      total: 0,
      description: 'Sem hipoteca em curso'
    }
  }

  const outstandingAmount = input.outstandingMortgageAmount
  
  // Early termination fee (typically 0.5% of outstanding amount, max €250 for variable rate)
  const isVariableRate = input.mortgageType !== 'fixed'
  const earlyTerminationFee = isVariableRate 
    ? Math.min(250, outstandingAmount * 0.005)  // Variable rate: max €250
    : outstandingAmount * 0.02                   // Fixed rate: 2% of outstanding amount

  return {
    outstandingAmount,
    earlyTerminationFee,
    total: outstandingAmount + earlyTerminationFee,
    description: `Liquidação antecipada: ${isVariableRate ? 'taxa variável (máx. €250)' : 'taxa fixa (2%)'}`
  }
}

/**
 * Get region-specific data and adjustments
 */
function getRegionAdjustments(location: string) {
  const region = PORTUGUESE_REGIONS.find(r => r.code === location)
  
  if (!region) {
    // Default to Lisboa if region not found
    return PORTUGUESE_REGIONS[0]
  }
  
  return region
}

/**
 * Main calculation function for house selling costs
 */
export function calculateSellHouseCosts(input: SellHouseInput): SellHouseCalculationResult {
  const region = getRegionAdjustments(input.location)
  
  // 1. Real estate agent commission
  const commissionRate = input.realEstateAgentCommission || MARKET_DATA.averageCommissionRates.selling.average
  const commission = calculateAgentCommission(input.propertyValue, commissionRate)
  
  // 2. Capital gains tax
  const capitalGains = calculateCapitalGainsTax(input)
  
  // 3. Legal fees
  const legalFees = calculateLegalFees(input.propertyValue)
  
  // 4. Mortgage liquidation
  const mortgageLiquidation = calculateMortgageLiquidation(input)
  
  // 5. Other costs (energy certificate, cleaning, minor repairs)
  const energyCertificateCost = 250  // Certificado energético
  const cleaningAndMinorRepairs = Math.max(500, input.propertyValue * 0.002) // 0.2% minimum €500
  const otherCosts = energyCertificateCost + cleaningAndMinorRepairs
  
  // Total costs calculation
  const totalCosts = commission.amount + 
                    capitalGains.tax + 
                    legalFees.total + 
                    mortgageLiquidation.total + 
                    otherCosts
  
  const netProceeds = Math.max(0, input.propertyValue - totalCosts)
  
  // Build detailed breakdown
  const breakdown: CalculationBreakdown[] = [
    {
      id: 'agent-commission',
      label: 'Comissão Imobiliária',
      value: commission.amount,
      description: commission.description,
      category: 'fee',
      required: true,
      isDeduction: true
    },
    {
      id: 'mortgage-liquidation',
      label: 'Liquidação de Hipoteca',
      value: mortgageLiquidation.outstandingAmount,
      description: `Montante em dívida do crédito habitação`,
      category: 'cost',
      required: input.hasOutstandingMortgage,
      isDeduction: true
    }
  ]

  // Add early termination fee if applicable
  if (mortgageLiquidation.earlyTerminationFee > 0) {
    breakdown.push({
      id: 'early-termination-fee',
      label: 'Taxa Liquidação Antecipada',
      value: mortgageLiquidation.earlyTerminationFee,
      description: mortgageLiquidation.description,
      category: 'fee',
      required: input.hasOutstandingMortgage,
      isDeduction: true
    })
  }

  // Add capital gains tax if applicable
  if (capitalGains.tax > 0) {
    breakdown.push({
      id: 'capital-gains-tax',
      label: 'Imposto sobre Mais-valias',
      value: capitalGains.tax,
      description: capitalGains.description,
      category: 'tax',
      required: !capitalGains.exemption,
      isDeduction: true
    })
  }

  // Legal fees breakdown
  breakdown.push(
    {
      id: 'notary-fee',
      label: 'Taxa de Notário',
      value: legalFees.notaryFee,
      description: 'Custos notariais para escritura de venda',
      category: 'fee',
      required: true,
      isDeduction: true
    },
    {
      id: 'registration-fee',
      label: 'Registo Predial',
      value: legalFees.registrationFee,
      description: 'Taxa de registo da transmissão no Conservatório',
      category: 'fee',
      required: true,
      isDeduction: true
    },
    {
      id: 'documentation-fee',
      label: 'Documentação',
      value: legalFees.documentationFee,
      description: 'Certidões e documentos necessários',
      category: 'cost',
      required: true,
      isDeduction: true
    },
    {
      id: 'energy-certificate',
      label: 'Certificado Energético',
      value: energyCertificateCost,
      description: 'Certificação energética obrigatória para venda',
      category: 'cost',
      required: true,
      isDeduction: true
    },
    {
      id: 'cleaning-repairs',
      label: 'Limpeza e Pequenos Arranjos',
      value: cleaningAndMinorRepairs,
      description: 'Preparação do imóvel para apresentação',
      category: 'other',
      required: false,
      isDeduction: true
    }
  )

  // Calculate key metrics for summary
  const costPercentage = (totalCosts / input.propertyValue)
  const netPercentage = (netProceeds / input.propertyValue)
  
  const keyMetrics = [
    {
      label: 'Valor de Venda',
      value: input.propertyValue,
      format: 'currency' as const
    },
    {
      label: 'Custos Totais',
      value: totalCosts,
      format: 'currency' as const
    },
    {
      label: '% de Custos',
      value: costPercentage,
      format: 'percentage' as const
    },
    {
      label: '% Líquido',
      value: netPercentage,
      format: 'percentage' as const
    }
  ]

  // Generate recommendations
  const recommendations: string[] = []
  
  if (costPercentage > 0.15) {
    recommendations.push('Custos elevados (>15%). Considere negociar a comissão imobiliária ou vender diretamente.')
  }
  
  if (capitalGains.tax > 0 && input.isMainResidence) {
    const ownershipYears = input.yearOfPurchase ? new Date().getFullYear() - input.yearOfPurchase : 0
    if (ownershipYears < 3) {
      recommendations.push(`Aguardar ${3 - ownershipYears} anos pode isentar €${capitalGains.tax.toLocaleString('pt-PT')} em impostos.`)
    }
  }
  
  if (mortgageLiquidation.earlyTerminationFee > 1000) {
    recommendations.push('Taxa de liquidação antecipada elevada. Verifique condições contratuais.')
  }
  
  if (commission.amount > input.propertyValue * 0.07) {
    recommendations.push('Comissão imobiliária acima da média (7%). Considere negociar ou comparar agências.')
  }

  recommendations.push('Consulte um profissional para validação dos cálculos fiscais.')
  recommendations.push('Considere o timing da venda para otimização fiscal.')

  return {
    totalAmount: totalCosts,
    netAmount: netProceeds,
    breakdown,
    summary: {
      title: 'Custos Totais de Venda',
      subtitle: `Valor líquido a receber: €${netProceeds.toLocaleString('pt-PT')}`,
      mainValue: totalCosts,
      mainValueLabel: 'Total de Custos',
      keyMetrics
    },
    recommendations,
    disclaimers: [
      'Valores são estimativas baseadas em dados médios de mercado',
      'Custos reais podem variar conforme acordos específicos',
      'Consulte um profissional para validação fiscal e legal',
      'Taxas e impostos baseados na legislação portuguesa vigente'
    ],
    calculatedAt: new Date(),
    inputs: input,
    
    // Extended results specific to sell house
    netProceeds,
    totalCosts,
    capitalGainsTax: capitalGains.tax,
    mortgageLiquidation: mortgageLiquidation.total,
    agentCommission: commission.amount,
    legalFees: legalFees.total,
    otherCosts,
    taxExemption: capitalGains.exemption
  }
}

/**
 * Validate sell house input data
 */
export function validateSellHouseInput(input: Partial<SellHouseInput>): {
  isValid: boolean
  errors: Record<string, string>
  warnings: string[]
} {
  const errors: Record<string, string> = {}
  const warnings: string[] = []

  // Required field validation
  if (!input.propertyValue || input.propertyValue <= 0) {
    errors.propertyValue = 'Valor da propriedade é obrigatório e deve ser maior que zero'
  }
  
  if (!input.location) {
    errors.location = 'Localização é obrigatória'
  }

  // Logical validation
  if (input.hasOutstandingMortgage && (!input.outstandingMortgageAmount || input.outstandingMortgageAmount <= 0)) {
    errors.outstandingMortgageAmount = 'Valor da hipoteca é obrigatório quando tem hipoteca em curso'
  }

  if (input.outstandingMortgageAmount && input.propertyValue && 
      input.outstandingMortgageAmount > input.propertyValue) {
    errors.outstandingMortgageAmount = 'Valor da hipoteca não pode ser superior ao valor da propriedade'
  }

  if (input.hasCapitalGains && (!input.originalPurchasePrice || input.originalPurchasePrice <= 0)) {
    errors.originalPurchasePrice = 'Preço de compra original é obrigatório para cálculo de mais-valias'
  }

  if (input.originalPurchasePrice && input.propertyValue && 
      input.originalPurchasePrice > input.propertyValue) {
    warnings.push('Preço de compra superior ao valor atual - confirme os valores introduzidos')
  }

  if (input.realEstateAgentCommission && 
      (input.realEstateAgentCommission < 0.02 || input.realEstateAgentCommission > 0.15)) {
    warnings.push('Comissão imobiliária fora do intervalo típico (2%-15%)')
  }

  // Market warnings
  if (input.propertyValue && input.propertyValue > 1000000) {
    warnings.push('Para propriedades de alto valor, considere consultoria especializada')
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    warnings
  }
}

/**
 * Get sample calculation for different property values
 */
export function getSampleCalculations() {
  const samples = [
    { value: 200000, location: 'lisboa', description: 'Apartamento T2 em Lisboa' },
    { value: 350000, location: 'porto', description: 'Moradia T3 no Porto' },
    { value: 150000, location: 'braga', description: 'Apartamento T2 em Braga' }
  ]

  return samples.map(sample => {
    const input: SellHouseInput = {
      propertyValue: sample.value,
      location: sample.location,
      hasOutstandingMortgage: false,
      hasCapitalGains: false,
      isMainResidence: true
    }

    const result = calculateSellHouseCosts(input)
    
    return {
      ...sample,
      totalCosts: result.totalCosts,
      netProceeds: result.netProceeds,
      costPercentage: (result.totalCosts / sample.value) * 100
    }
  })
}