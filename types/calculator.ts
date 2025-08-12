export type CalculationType = 
  | 'sell-house'
  | 'buy-house' 
  | 'switch-house' 
  | 'mortgage-simulator' 
  | 'rental-investment' 
  | 'property-flip';

export type CalculationStatus = 
  | 'idle'
  | 'calculating'
  | 'success'
  | 'error'
  | 'blocked';

export type UserType = 'anonymous' | 'free' | 'registered' | 'pro';

// Base interfaces for all calculators
export interface BaseCalculatorInput {
  propertyValue: number;
  location: string;
}

export interface BaseCalculationResult {
  totalAmount: number;
  netAmount?: number;
  breakdown: CalculationBreakdown[];
  summary: CalculationSummary;
  recommendations?: string[];
  disclaimers: string[];
  calculatedAt: Date;
  inputs: Record<string, any>;
}

export interface CalculationBreakdown {
  id: string;
  label: string;
  value: number;
  description?: string;
  isDeduction?: boolean;
  category: 'fee' | 'tax' | 'cost' | 'insurance' | 'other';
  required: boolean;
}

export interface CalculationSummary {
  title: string;
  subtitle?: string;
  mainValue: number;
  mainValueLabel: string;
  keyMetrics: Array<{
    label: string;
    value: number | string;
    format: 'currency' | 'percentage' | 'text';
  }>;
}

// Calculator configuration and metadata
export interface CalculatorConfig {
  id: CalculationType;
  name: string;
  description: string;
  icon: string;
  route: string;
  category: 'buying' | 'selling' | 'investment' | 'financing';
  difficulty: 'basic' | 'intermediate' | 'advanced';
  estimatedTime: number; // in minutes
  requiredFields: string[];
  optionalFields: string[];
  availableRegions: string[];
  seoKeywords: string[];
  tier: 'free' | 'registered' | 'pro';
}

// Input validation and UI configuration
export interface CalculatorFieldConfig {
  id: string;
  type: 'currency' | 'percentage' | 'text' | 'select' | 'number' | 'date' | 'boolean';
  label: string;
  placeholder?: string;
  helpText?: string;
  required: boolean;
  validation: {
    min?: number;
    max?: number;
    pattern?: string;
    customValidator?: (value: any) => string | null;
  };
  defaultValue?: any;
  options?: Array<{ value: string; label: string }>;
  conditional?: {
    field: string;
    value: any;
    operator: 'equals' | 'greaterThan' | 'lessThan';
  };
  tier: 'free' | 'registered' | 'pro';
}

// Usage tracking and limits
export interface UsageLimit {
  dailyLimit: number;
  currentUsage: number;
  canCalculate: boolean;
  resetTime: Date;
  userType: UserType;
  requiresUpgrade: boolean;
  upgradeUrl?: string;
}

export interface UsageContext {
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  referrer?: string;
}

// Calculator operation interfaces
export interface CalculatorState<TInput = any, TResult = any> {
  status: CalculationStatus;
  inputs: Partial<TInput>;
  result: TResult | null;
  errors: Record<string, string>;
  warnings: string[];
  isValid: boolean;
  usageInfo: UsageLimit | null;
}

export interface CalculatorOperations<TInput = any, TResult = any> {
  calculate: (inputs: TInput) => Promise<TResult>;
  validate: (inputs: Partial<TInput>) => Record<string, string>;
  reset: () => void;
  saveProgress: () => void;
  loadProgress: () => Partial<TInput> | null;
}

// Specific calculator input interfaces
export interface SellHouseInput extends BaseCalculatorInput {
  hasOutstandingMortgage: boolean;
  outstandingMortgageAmount?: number;
  mortgageType?: 'variable' | 'fixed';
  realEstateAgentCommission?: number;
  hasCapitalGains: boolean;
  originalPurchasePrice?: number;
  improvementCosts?: number;
  yearOfPurchase?: number;
  isMainResidence: boolean;
}

export interface BuyHouseInput extends BaseCalculatorInput {
  financingAmount?: number;
  isFirstTimeBuyer: boolean;
  hasExistingProperty: boolean;
  intendedUse: 'main-residence' | 'secondary' | 'investment';
  propertyAge?: number;
  energyRating?: string;
  includeInsurance: boolean;
}

export interface MortgageInput extends BaseCalculatorInput {
  loanAmount: number;
  interestRate: number;
  loanTermYears: number;
  mortgageType: 'variable' | 'fixed' | 'mixed';
  downPayment: number;
  includeInsurance: boolean;
  monthlyIncome: number;
  monthlyExpenses: number;
}

// Portuguese market specific data
export interface PortugueseRegion {
  code: string;
  name: string;
  imtRates: {
    residential: number[];
    commercial: number;
  };
  stampDutyRate: number;
  averagePropertyPrice: number;
  popularAreas: string[];
}

export interface MarketData {
  euriborRates: {
    rate3m: number;
    rate6m: number;
    rate12m: number;
    lastUpdated: Date;
  };
  averageCommissionRates: {
    selling: { min: number; max: number; average: number };
    buying: { min: number; max: number; average: number };
  };
  legalFees: {
    notary: { min: number; max: number };
    lawyer: { min: number; max: number };
    registration: number;
  };
  taxRates: {
    imt: number[];
    stampDuty: number;
    capitalGains: number;
    vat: number;
  };
  regions: PortugueseRegion[];
}

// Error handling
export class CalculatorError extends Error {
  code: string;
  field?: string;
  
  constructor(message: string, code: string, field?: string) {
    super(message);
    this.name = 'CalculatorError';
    this.code = code;
    if (field !== undefined) {
      this.field = field;
    }
  }
}

// Conversion optimization types
export interface ConversionTrigger {
  type: 'usage_warning' | 'limit_reached' | 'feature_gate' | 'result_enhancement';
  message: string;
  ctaText: string;
  ctaUrl: string;
  priority: 'low' | 'medium' | 'high';
  showCondition: (state: CalculatorState, usageInfo: UsageLimit) => boolean;
}

export interface CalculatorAnalytics {
  calculationId: string;
  calculatorType: CalculationType;
  userId?: string;
  sessionId: string;
  inputs: Record<string, any>;
  result?: Record<string, any>;
  duration: number;
  conversionTriggers: string[];
  userInteractions: Array<{
    action: string;
    timestamp: Date;
    element?: string;
  }>;
}

// Export legacy interfaces for backward compatibility
export interface CalculatorInput extends BaseCalculatorInput {
  calculationType: CalculationType;
}

export interface CalculationResult extends BaseCalculationResult {
  totalCost: number;
}