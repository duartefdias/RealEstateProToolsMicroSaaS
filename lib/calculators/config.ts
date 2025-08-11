import { CalculatorConfig, CalculatorFieldConfig, PortugueseRegion, MarketData } from '@/types/calculator'

// Portuguese regions with IMT rates and market data
export const PORTUGUESE_REGIONS: PortugueseRegion[] = [
  {
    code: 'lisboa',
    name: 'Lisboa',
    imtRates: {
      residential: [0, 0.02, 0.05, 0.07, 0.08], // Based on property value brackets
      commercial: 0.065
    },
    stampDutyRate: 0.008,
    averagePropertyPrice: 4500, // per m²
    popularAreas: ['Chiado', 'Príncipe Real', 'Santos', 'Alcântara', 'Parque das Nações']
  },
  {
    code: 'porto',
    name: 'Porto',
    imtRates: {
      residential: [0, 0.02, 0.05, 0.07, 0.08],
      commercial: 0.065
    },
    stampDutyRate: 0.008,
    averagePropertyPrice: 2800,
    popularAreas: ['Cedofeita', 'Foz do Douro', 'Campanhã', 'Paranhos', 'Ramalde']
  },
  {
    code: 'braga',
    name: 'Braga',
    imtRates: {
      residential: [0, 0.02, 0.05, 0.07, 0.08],
      commercial: 0.065
    },
    stampDutyRate: 0.008,
    averagePropertyPrice: 1400,
    popularAreas: ['Centro Histórico', 'São Victor', 'Maximinos', 'Nogueiró']
  },
  {
    code: 'aveiro',
    name: 'Aveiro',
    imtRates: {
      residential: [0, 0.02, 0.05, 0.07, 0.08],
      commercial: 0.065
    },
    stampDutyRate: 0.008,
    averagePropertyPrice: 1600,
    popularAreas: ['Centro', 'Glória', 'São Bernardo', 'Vera Cruz']
  },
  {
    code: 'coimbra',
    name: 'Coimbra',
    imtRates: {
      residential: [0, 0.02, 0.05, 0.07, 0.08],
      commercial: 0.065
    },
    stampDutyRate: 0.008,
    averagePropertyPrice: 1800,
    popularAreas: ['Baixa', 'Alta', 'Solum', 'Santo António dos Olivais']
  },
  {
    code: 'setubal',
    name: 'Setúbal',
    imtRates: {
      residential: [0, 0.02, 0.05, 0.07, 0.08],
      commercial: 0.065
    },
    stampDutyRate: 0.008,
    averagePropertyPrice: 2200,
    popularAreas: ['Centro', 'São Sebastião', 'São Julião', 'Arrabalde']
  },
  {
    code: 'faro',
    name: 'Faro / Algarve',
    imtRates: {
      residential: [0, 0.02, 0.05, 0.07, 0.08],
      commercial: 0.065
    },
    stampDutyRate: 0.008,
    averagePropertyPrice: 3200,
    popularAreas: ['Vilamoura', 'Albufeira', 'Lagos', 'Tavira', 'Sagres']
  }
]

// Current market data (should be updated regularly from external sources)
export const MARKET_DATA: MarketData = {
  euriborRates: {
    rate3m: 0.035,
    rate6m: 0.038,
    rate12m: 0.041,
    lastUpdated: new Date('2025-01-15')
  },
  averageCommissionRates: {
    selling: { min: 0.05, max: 0.07, average: 0.06 },
    buying: { min: 0.02, max: 0.04, average: 0.03 }
  },
  legalFees: {
    notary: { min: 200, max: 800 },
    lawyer: { min: 500, max: 2000 },
    registration: 250
  },
  taxRates: {
    imt: [0, 0.02, 0.05, 0.07, 0.08], // Progressive rates based on property value
    stampDuty: 0.008,
    capitalGains: 0.28,
    vat: 0.23
  },
  regions: PORTUGUESE_REGIONS
}

// Calculator configurations
export const CALCULATOR_CONFIGS: Record<string, CalculatorConfig> = {
  'sell-house': {
    id: 'sell-house',
    name: 'Calculadora de Venda de Casa',
    description: 'Calcule todos os custos associados à venda do seu imóvel, incluindo comissões, impostos e liquidação de hipoteca.',
    icon: '🏠',
    route: '/calculators/sell-house',
    category: 'selling',
    difficulty: 'basic',
    estimatedTime: 5,
    requiredFields: ['propertyValue', 'location'],
    optionalFields: ['hasOutstandingMortgage', 'realEstateAgentCommission', 'hasCapitalGains'],
    availableRegions: PORTUGUESE_REGIONS.map(r => r.code),
    seoKeywords: ['venda casa', 'custos venda imóvel', 'comissão imobiliária', 'liquidação hipoteca'],
    tier: 'free'
  },
  'buy-house': {
    id: 'buy-house',
    name: 'Calculadora de Compra de Casa',
    description: 'Descubra todos os custos de compra de imóvel, incluindo IMT, impostos, seguros e taxas legais.',
    icon: '🔑',
    route: '/calculators/buy-house',
    category: 'buying',
    difficulty: 'intermediate',
    estimatedTime: 7,
    requiredFields: ['propertyValue', 'location', 'isFirstTimeBuyer'],
    optionalFields: ['financingAmount', 'intendedUse', 'includeInsurance'],
    availableRegions: PORTUGUESE_REGIONS.map(r => r.code),
    seoKeywords: ['compra casa', 'custos compra imóvel', 'IMT portugal', 'imposto selo'],
    tier: 'free'
  },
  'mortgage-simulator': {
    id: 'mortgage-simulator',
    name: 'Simulador de Crédito Habitação',
    description: 'Simule o seu crédito habitação com taxas Euribor atualizadas e compare cenários de financiamento.',
    icon: '🏦',
    route: '/calculators/mortgage-simulator',
    category: 'financing',
    difficulty: 'intermediate',
    estimatedTime: 10,
    requiredFields: ['propertyValue', 'loanAmount', 'interestRate', 'loanTermYears'],
    optionalFields: ['monthlyIncome', 'monthlyExpenses', 'includeInsurance'],
    availableRegions: PORTUGUESE_REGIONS.map(r => r.code),
    seoKeywords: ['crédito habitação', 'simulador hipoteca', 'euribor', 'taxa juro'],
    tier: 'registered'
  },
  'switch-house': {
    id: 'switch-house',
    name: 'Calculadora de Troca de Casa',
    description: 'Compare cenários de venda e compra simultânea, incluindo crédito ponte e timing otimizado.',
    icon: '🔄',
    route: '/calculators/switch-house',
    category: 'buying',
    difficulty: 'advanced',
    estimatedTime: 15,
    requiredFields: ['propertyValue', 'location', 'newPropertyValue'],
    optionalFields: ['bridgeLoanNeeded', 'timingPreference'],
    availableRegions: PORTUGUESE_REGIONS.map(r => r.code),
    seoKeywords: ['troca casa', 'venda compra simultânea', 'crédito ponte'],
    tier: 'pro'
  },
  'rental-investment': {
    id: 'rental-investment',
    name: 'Calculadora de Investimento Imobiliário',
    description: 'Analise a rentabilidade do seu investimento imobiliário com yield, ROI e cenários fiscais.',
    icon: '📊',
    route: '/calculators/rental-investment',
    category: 'investment',
    difficulty: 'advanced',
    estimatedTime: 12,
    requiredFields: ['propertyValue', 'location', 'monthlyRent'],
    optionalFields: ['managementFees', 'vacancyRate', 'improvementCosts'],
    availableRegions: PORTUGUESE_REGIONS.map(r => r.code),
    seoKeywords: ['investimento imobiliário', 'yield rental', 'ROI propriedade'],
    tier: 'pro'
  },
  'property-flip': {
    id: 'property-flip',
    name: 'Calculadora de Flip Imobiliário',
    description: 'Calcule a viabilidade de compra, renovação e revenda de propriedades para lucro.',
    icon: '🔨',
    route: '/calculators/property-flip',
    category: 'investment',
    difficulty: 'advanced',
    estimatedTime: 15,
    requiredFields: ['propertyValue', 'location', 'renovationCosts', 'targetSalePrice'],
    optionalFields: ['holdingCosts', 'financeNeeded', 'timingMonths'],
    availableRegions: PORTUGUESE_REGIONS.map(r => r.code),
    seoKeywords: ['flip imobiliário', 'renovação casa', 'investimento reabilitação'],
    tier: 'pro'
  }
}

// Common field configurations for reuse across calculators
export const COMMON_FIELD_CONFIGS: Record<string, CalculatorFieldConfig> = {
  propertyValue: {
    id: 'propertyValue',
    type: 'currency',
    label: 'Valor do Imóvel',
    placeholder: '€ 250,000',
    helpText: 'Valor de mercado atual ou preço de venda esperado',
    required: true,
    validation: {
      min: 10000,
      max: 10000000,
      customValidator: (value) => {
        if (value < 50000) return 'Valores muito baixos podem não refletir o mercado real'
        return null
      }
    },
    tier: 'free'
  },
  location: {
    id: 'location',
    type: 'select',
    label: 'Localização',
    placeholder: 'Selecione uma região',
    helpText: 'Região do imóvel (afeta taxas IMT e custos médios)',
    required: true,
    options: PORTUGUESE_REGIONS.map(region => ({
      value: region.code,
      label: region.name
    })),
    validation: {},
    tier: 'free'
  },
  realEstateAgentCommission: {
    id: 'realEstateAgentCommission',
    type: 'percentage',
    label: 'Comissão Imobiliária',
    placeholder: '6%',
    helpText: 'Comissão da agência imobiliária (geralmente entre 5% e 7%)',
    required: false,
    validation: {
      min: 0.02,
      max: 0.15
    },
    defaultValue: 0.06,
    tier: 'free'
  },
  hasOutstandingMortgage: {
    id: 'hasOutstandingMortgage',
    type: 'boolean',
    label: 'Tem hipoteca em curso?',
    helpText: 'Se tem crédito habitação pendente sobre o imóvel',
    required: false,
    validation: {},
    tier: 'free'
  },
  outstandingMortgageAmount: {
    id: 'outstandingMortgageAmount',
    type: 'currency',
    label: 'Valor em Dívida',
    placeholder: '€ 150,000',
    helpText: 'Montante ainda em dívida do crédito habitação',
    required: false,
    validation: {
      min: 0,
      max: 5000000
    },
    conditional: {
      field: 'hasOutstandingMortgage',
      value: true,
      operator: 'equals'
    },
    tier: 'free'
  },
  isFirstTimeBuyer: {
    id: 'isFirstTimeBuyer',
    type: 'boolean',
    label: 'Primeira habitação?',
    helpText: 'Se é a primeira vez que compra habitação própria permanente',
    required: true,
    validation: {},
    tier: 'free'
  },
  mortgageType: {
    id: 'mortgageType',
    type: 'select',
    label: 'Tipo de Crédito',
    helpText: 'Tipo de taxa de juro do crédito habitação',
    required: false,
    options: [
      { value: 'variable', label: 'Taxa Variável' },
      { value: 'fixed', label: 'Taxa Fixa' },
      { value: 'mixed', label: 'Taxa Mista' }
    ],
    validation: {},
    defaultValue: 'variable',
    tier: 'registered'
  },
  loanAmount: {
    id: 'loanAmount',
    type: 'currency',
    label: 'Montante do Empréstimo',
    placeholder: '€ 200,000',
    helpText: 'Valor total do crédito habitação',
    required: true,
    validation: {
      min: 10000,
      max: 5000000
    },
    tier: 'registered'
  },
  interestRate: {
    id: 'interestRate',
    type: 'percentage',
    label: 'Taxa de Juro',
    placeholder: '4.5%',
    helpText: 'Taxa de juro anual (ex: Euribor + spread)',
    required: true,
    validation: {
      min: 0.005,
      max: 0.15
    },
    defaultValue: 0.045,
    tier: 'registered'
  },
  loanTermYears: {
    id: 'loanTermYears',
    type: 'number',
    label: 'Prazo (anos)',
    placeholder: '30',
    helpText: 'Duração do empréstimo em anos',
    required: true,
    validation: {
      min: 5,
      max: 50
    },
    defaultValue: 30,
    tier: 'registered'
  }
}

// Helper functions
export function getCalculatorConfig(id: string): CalculatorConfig | undefined {
  return CALCULATOR_CONFIGS[id]
}

export function getRegionByCode(code: string): PortugueseRegion | undefined {
  return PORTUGUESE_REGIONS.find(region => region.code === code)
}

export function getFieldConfig(id: string): CalculatorFieldConfig | undefined {
  return COMMON_FIELD_CONFIGS[id]
}

export function getCalculatorsByTier(tier: 'free' | 'registered' | 'pro'): CalculatorConfig[] {
  return Object.values(CALCULATOR_CONFIGS).filter(config => 
    config.tier === 'free' || 
    (tier === 'registered' && ['free', 'registered'].includes(config.tier)) ||
    (tier === 'pro' && ['free', 'registered', 'pro'].includes(config.tier))
  )
}

export function getCalculatorsByCategory(category: CalculatorConfig['category']): CalculatorConfig[] {
  return Object.values(CALCULATOR_CONFIGS).filter(config => config.category === category)
}