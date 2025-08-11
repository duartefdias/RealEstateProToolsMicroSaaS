import { z } from 'zod'
import { 
  CalculationType, 
  BaseCalculatorInput,
  SellHouseInput,
  BuyHouseInput,
  MortgageInput,
  UserType
} from '@/types/calculator'
import { PORTUGUESE_REGIONS } from './config'

// Portuguese error messages for better UX
const ERROR_MESSAGES = {
  required: 'Este campo é obrigatório',
  invalid_type_string: 'Deve ser um texto válido',
  invalid_type_number: 'Deve ser um número válido',
  invalid_type_boolean: 'Deve ser verdadeiro ou falso',
  min_value: 'Valor mínimo: €{min}',
  max_value: 'Valor máximo: €{max}',
  min_percentage: 'Mínimo: {min}%',
  max_percentage: 'Máximo: {max}%',
  invalid_email: 'Email inválido',
  invalid_region: 'Região não suportada',
  future_year: 'Ano não pode ser no futuro',
  logical_error: 'Valores introduzidos não são lógicos'
} as const

// Custom error handling function
const customErrorMessage = (message: string, params: Record<string, any> = {}) => {
  return Object.entries(params).reduce(
    (msg, [key, value]) => msg.replace(`{${key}}`, String(value)),
    message
  )
}

// Base validation schemas with Portuguese error messages
export const PropertyValueSchema = z.number({
  message: ERROR_MESSAGES.invalid_type_number,
})
.min(10000, { 
  message: customErrorMessage(ERROR_MESSAGES.min_value, { min: '10,000' })
})
.max(50000000, { 
  message: customErrorMessage(ERROR_MESSAGES.max_value, { max: '50,000,000' })
})
.refine((val) => val >= 50000, {
  message: 'Propriedades com valor inferior a €50,000 podem não refletir o mercado real'
})
.refine((val) => val <= 10000000, {
  message: 'Para propriedades de luxo acima de €10M, consulte um profissional'
})

export const LocationSchema = z.string({
  message: ERROR_MESSAGES.invalid_type_string,
})
.refine((val) => PORTUGUESE_REGIONS.some(region => region.code === val), {
  message: ERROR_MESSAGES.invalid_region
})

export const PercentageSchema = (min = 0, max = 1, field = 'percentagem') => z.number({
  message: ERROR_MESSAGES.invalid_type_number,
})
.min(min, { 
  message: customErrorMessage(ERROR_MESSAGES.min_percentage, { min: (min * 100).toFixed(1) })
})
.max(max, { 
  message: customErrorMessage(ERROR_MESSAGES.max_percentage, { max: (max * 100).toFixed(1) })
})

export const CurrencySchema = (min = 0, max = 10000000) => z.number({
  message: ERROR_MESSAGES.invalid_type_number,
})
.min(min, { 
  message: customErrorMessage(ERROR_MESSAGES.min_value, { min: min.toLocaleString('pt-PT') })
})
.max(max, { 
  message: customErrorMessage(ERROR_MESSAGES.max_value, { max: max.toLocaleString('pt-PT') })
})

export const YearSchema = z.number({
  message: ERROR_MESSAGES.invalid_type_number,
})
.int('Ano deve ser um número inteiro')
.min(1900, { message: 'Ano mínimo: 1900' })
.max(new Date().getFullYear(), { 
  message: ERROR_MESSAGES.future_year 
})

// Base calculator input schema
export const BaseCalculatorInputSchema = z.object({
  propertyValue: PropertyValueSchema,
  location: LocationSchema,
}) satisfies z.ZodType<BaseCalculatorInput>

// Sell House Calculator validation schema
export const SellHouseInputSchema = BaseCalculatorInputSchema.extend({
  hasOutstandingMortgage: z.boolean({
    message: ERROR_MESSAGES.invalid_type_boolean,
  }),
  outstandingMortgageAmount: CurrencySchema(0, 5000000).optional(),
  mortgageType: z.enum(['variable', 'fixed'], {
    message: 'Tipo de crédito deve ser variável ou fixo',
  }).optional(),
  realEstateAgentCommission: PercentageSchema(0.02, 0.15, 'comissão').optional(),
  hasCapitalGains: z.boolean({
    message: ERROR_MESSAGES.invalid_type_boolean,
  }),
  originalPurchasePrice: CurrencySchema(1000, 10000000).optional(),
  improvementCosts: CurrencySchema(0, 1000000).optional(),
  yearOfPurchase: YearSchema.optional(),
  isMainResidence: z.boolean({
    message: ERROR_MESSAGES.invalid_type_boolean,
  }),
})
.refine((data) => {
  if (data.hasOutstandingMortgage && !data.outstandingMortgageAmount) {
    return false
  }
  return true
}, {
  message: 'Montante em dívida é obrigatório quando tem hipoteca em curso',
  path: ['outstandingMortgageAmount']
})
.refine((data) => {
  if (data.hasOutstandingMortgage && data.outstandingMortgageAmount && 
      data.outstandingMortgageAmount > data.propertyValue) {
    return false
  }
  return true
}, {
  message: 'Valor em dívida não pode ser superior ao valor do imóvel',
  path: ['outstandingMortgageAmount']
})
.refine((data) => {
  if (data.hasCapitalGains && !data.originalPurchasePrice) {
    return false
  }
  return true
}, {
  message: 'Preço de compra original é obrigatório para calcular mais-valias',
  path: ['originalPurchasePrice']
})
.refine((data) => {
  if (data.originalPurchasePrice && data.originalPurchasePrice > data.propertyValue) {
    return false
  }
  return true
}, {
  message: 'Preço de compra não pode ser superior ao valor atual',
  path: ['originalPurchasePrice']
}) satisfies z.ZodType<SellHouseInput>

// Buy House Calculator validation schema
export const BuyHouseInputSchema = BaseCalculatorInputSchema.extend({
  financingAmount: CurrencySchema(10000, 5000000).optional(),
  isFirstTimeBuyer: z.boolean({
    message: ERROR_MESSAGES.invalid_type_boolean,
  }),
  hasExistingProperty: z.boolean({
    message: ERROR_MESSAGES.invalid_type_boolean,
  }),
  intendedUse: z.enum(['main-residence', 'secondary', 'investment'], {
    message: 'Finalidade deve ser habitação própria, secundária ou investimento',
  }),
  propertyAge: z.number({
    invalid_type_error: ERROR_MESSAGES.invalid_type_number,
  }).int('Idade deve ser em anos completos').min(0).max(500).optional(),
  energyRating: z.enum(['A+', 'A', 'B', 'B-', 'C', 'D', 'E', 'F', 'G'], {
    message: 'Certificação energética inválida',
  }).optional(),
  includeInsurance: z.boolean({
    message: ERROR_MESSAGES.invalid_type_boolean,
  }),
})
.refine((data) => {
  if (data.financingAmount && data.financingAmount > data.propertyValue * 0.9) {
    return false
  }
  return true
}, {
  message: 'Montante de financiamento não pode exceder 90% do valor do imóvel',
  path: ['financingAmount']
})
.refine((data) => {
  if (data.isFirstTimeBuyer && data.hasExistingProperty) {
    return false
  }
  return true
}, {
  message: 'Não pode ser primeira habitação se já possui propriedades',
  path: ['isFirstTimeBuyer']
})
.refine((data) => {
  if (data.isFirstTimeBuyer && data.intendedUse !== 'main-residence') {
    return false
  }
  return true
}, {
  message: 'Primeira habitação deve ser para habitação própria permanente',
  path: ['intendedUse']
}) satisfies z.ZodType<BuyHouseInput>

// Mortgage Calculator validation schema
export const MortgageInputSchema = BaseCalculatorInputSchema.extend({
  loanAmount: CurrencySchema(10000, 5000000),
  interestRate: PercentageSchema(0.005, 0.15, 'taxa de juro'),
  loanTermYears: z.number({
    message: ERROR_MESSAGES.invalid_type_number,
  })
  .int('Prazo deve ser em anos completos')
  .min(5, { message: 'Prazo mínimo: 5 anos' })
  .max(50, { message: 'Prazo máximo: 50 anos' }),
  mortgageType: z.enum(['variable', 'fixed', 'mixed'], {
    message: 'Tipo de crédito deve ser variável, fixo ou misto',
  }),
  downPayment: CurrencySchema(0, 5000000),
  includeInsurance: z.boolean({
    message: ERROR_MESSAGES.invalid_type_boolean,
  }),
  monthlyIncome: CurrencySchema(500, 100000),
  monthlyExpenses: CurrencySchema(0, 50000),
})
.refine((data) => {
  if (data.loanAmount > data.propertyValue) {
    return false
  }
  return true
}, {
  message: 'Montante do empréstimo não pode exceder o valor do imóvel',
  path: ['loanAmount']
})
.refine((data) => {
  if (data.downPayment + data.loanAmount < data.propertyValue * 0.9) {
    return false
  }
  return true
}, {
  message: 'Entrada + empréstimo devem cobrir pelo menos 90% do valor do imóvel',
  path: ['downPayment']
})
.refine((data) => {
  if (data.monthlyExpenses >= data.monthlyIncome) {
    return false
  }
  return true
}, {
  message: 'Despesas mensais não podem ser iguais ou superiores aos rendimentos',
  path: ['monthlyExpenses']
})
.refine((data) => {
  // Calculate monthly payment (simplified formula)
  const monthlyRate = data.interestRate / 12
  const numPayments = data.loanTermYears * 12
  const monthlyPayment = data.loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                        (Math.pow(1 + monthlyRate, numPayments) - 1)
  
  const availableIncome = data.monthlyIncome - data.monthlyExpenses
  const maxAffordable = availableIncome * 0.35 // 35% rule
  
  return monthlyPayment <= maxAffordable
}, {
  message: 'Prestação mensal excede 35% do rendimento disponível - considere um montante menor ou prazo maior',
  path: ['loanAmount']
}) satisfies z.ZodType<MortgageInput>

// Usage context validation
export const UsageContextSchema = z.object({
  userId: z.string().uuid().optional(),
  sessionId: z.string().min(1, 'ID de sessão é obrigatório'),
  ipAddress: z.string().ip('Endereço IP inválido').optional(),
  userAgent: z.string().optional(),
  referrer: z.string().url('URL de referência inválida').optional(),
})

// User type validation
export const UserTypeSchema = z.enum(['anonymous', 'free', 'registered', 'pro'], {
  message: 'Tipo de utilizador inválido',
}) satisfies z.ZodType<UserType>

// Calculator type validation
export const CalculatorTypeSchema = z.enum([
  'sell-house', 
  'buy-house', 
  'switch-house', 
  'mortgage-simulator', 
  'rental-investment', 
  'property-flip'
], {
  message: 'Tipo de calculadora inválido',
}) satisfies z.ZodType<CalculationType>

// Combined validation schemas based on calculator type
export const getValidationSchema = (calculatorType: CalculationType) => {
  switch (calculatorType) {
    case 'sell-house':
      return SellHouseInputSchema
    case 'buy-house':
      return BuyHouseInputSchema
    case 'mortgage-simulator':
      return MortgageInputSchema
    default:
      return BaseCalculatorInputSchema
  }
}

// Validation result types
export type ValidationResult<T> = {
  success: true
  data: T
  errors: null
} | {
  success: false
  data: null
  errors: Record<string, string[]>
}

// Main validation function with proper error handling
export const validateCalculatorInput = <T>(
  data: unknown,
  calculatorType: CalculationType
): ValidationResult<T> => {
  try {
    const schema = getValidationSchema(calculatorType)
    const result = schema.safeParse(data)
    
    if (result.success) {
      return {
        success: true,
        data: result.data as T,
        errors: null
      }
    } else {
      // Transform Zod errors to field-specific error messages
      const errors: Record<string, string[]> = {}
      
      result.error.issues.forEach((issue) => {
        const path = issue.path.join('.')
        if (!errors[path]) {
          errors[path] = []
        }
        errors[path].push(issue.message)
      })
      
      return {
        success: false,
        data: null,
        errors
      }
    }
  } catch (error) {
    // Handle unexpected validation errors
    console.error('Validation error:', error)
    return {
      success: false,
      data: null,
      errors: {
        _root: ['Erro interno de validação. Tente novamente.']
      }
    }
  }
}

// Tier access validation
export const validateTierAccess = (
  requiredTier: 'free' | 'registered' | 'pro',
  userType: UserType
): { allowed: boolean; message?: string } => {
  const tierLevels = { 
    anonymous: -1,
    free: 0, 
    registered: 1, 
    pro: 2 
  }
  
  const userLevel = tierLevels[userType] ?? -1
  const requiredLevel = tierLevels[requiredTier] ?? 0
  
  if (userLevel >= requiredLevel) {
    return { allowed: true }
  }
  
  const messages = {
    registered: 'Esta funcionalidade requer registo gratuito.',
    pro: 'Esta funcionalidade requer subscrição Pro.'
  }
  
  return {
    allowed: false,
    message: messages[requiredTier] || 'Acesso negado.'
  }
}


// Custom validation functions for complex business logic
export const validateMortgageAffordability = (
  monthlyIncome: number,
  monthlyExpenses: number,
  loanAmount: number,
  interestRate: number,
  termYears: number
): { affordable: boolean; maxAffordable: number; monthlyPayment: number } => {
  const monthlyRate = interestRate / 12
  const numPayments = termYears * 12
  const monthlyPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                        (Math.pow(1 + monthlyRate, numPayments) - 1)
  
  const availableIncome = monthlyIncome - monthlyExpenses
  const maxAffordable = availableIncome * 0.35
  
  return {
    affordable: monthlyPayment <= maxAffordable,
    maxAffordable,
    monthlyPayment
  }
}

export const validateCapitalGainsLogic = (
  currentValue: number,
  originalPrice: number,
  purchaseYear: number,
  isMainResidence: boolean
): { hasGains: boolean; gainsAmount: number; exemptionApplies: boolean } => {
  const gainsAmount = currentValue - originalPrice
  const hasGains = gainsAmount > 0
  const yearsOwned = new Date().getFullYear() - purchaseYear
  
  // In Portugal, main residence is exempt from capital gains tax
  // if owned for more than 3 years
  const exemptionApplies = isMainResidence && yearsOwned >= 3
  
  return {
    hasGains,
    gainsAmount,
    exemptionApplies
  }
}