export type CalculationType = 
  | 'sell' 
  | 'buy' 
  | 'switch' 
  | 'mortgage' 
  | 'rental' 
  | 'flip';

export interface CalculatorInput {
  propertyValue: number;
  location: string;
  calculationType: CalculationType;
}

export interface CalculationResult {
  totalCost: number;
  breakdown: Record<string, number>;
  recommendations?: string[];
  disclaimers: string[];
}

export interface UsageLimit {
  daily_limit: number;
  current_usage: number;
  can_calculate: boolean;
  reset_time: Date;
}