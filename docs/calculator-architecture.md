# Calculator Architecture & Usage Tracking

## Overview

This document describes the architecture of the calculator system in Real Estate Pro Tools, including layout components, usage tracking logic, and tier-based access control.

## Core Architecture

### 1. Component Hierarchy

```
CalculatorLayout (Layout & UI)
├── CalculatorWrapper (Usage Tracking & Enforcement)
│   ├── InputFields (Form Components)
│   └── ResultsDisplay (Results & Conversion)
└── UsageLimitBanner (Usage Feedback & Modals)
```

### 2. Data Flow

```
User Input → Validation → Usage Check → Calculation → Results → Tracking
     ↓            ↓           ↓             ↓          ↓         ↓
Field Config   Zod Schema  Enforcement   Business    Display   Analytics
```

## Component Documentation

### CalculatorLayout Component

**Location:** `/components/calculators/shared/CalculatorLayout.tsx`

**Purpose:** Main layout component that provides the visual structure and user experience for all calculators.

#### Key Features:
- **Header Section**: Calculator info, difficulty badge, tier requirements
- **Progress Tracking**: Multi-step calculator support with progress bar  
- **Usage Display**: Real-time usage limits and remaining calculations
- **Tier Access Control**: Automatic blocking for insufficient tier access
- **Sidebar**: Tips, related calculators, and conversion prompts
- **Responsive Design**: Mobile-first approach with adaptive layouts

#### Props Interface:
```typescript
interface CalculatorLayoutProps {
  config: CalculatorConfig           // Calculator metadata & configuration
  children: React.ReactNode          // Input forms and calculator content
  status?: CalculationStatus         // idle | calculating | success | error
  progress?: number                  // 0-100 for multi-step calculators
  usageInfo?: UsageLimit | null      // Current usage status
  onCalculate?: () => Promise<void>  // Calculate button handler
  showUpgradePrompts?: boolean       // Enable conversion optimization
  className?: string                 // Custom styling
}
```

#### Usage Patterns:
```typescript
// Basic usage
<CalculatorLayout config={sellHouseConfig}>
  <SellHouseInputForm />
</CalculatorLayout>

// With usage tracking
<CalculatorLayout 
  config={mortgageConfig}
  usageInfo={usageLimit}
  onCalculate={handleCalculate}
>
  <MortgageSimulatorForm />
</CalculatorLayout>
```

### CalculatorWrapper Component

**Location:** `/components/calculators/shared/CalculatorWrapper.tsx`

**Purpose:** Handles usage tracking, enforcement, and conversion optimization.

#### Key Features:
- **Usage Enforcement**: Blocks calculations when limits reached
- **Tracking Integration**: Records calculation attempts and completions
- **Conversion Optimization**: Shows upgrade prompts after 3rd calculation
- **Session Management**: Anonymous user session tracking
- **Modal Management**: Blocking modals for upgrade prompts

#### Usage Flow:
1. **Pre-calculation**: Check user limits and tier access
2. **During calculation**: Track attempt and increment usage
3. **Post-calculation**: Update usage counters and show conversion prompts
4. **Error handling**: Graceful degradation with retry options

### InputField Components

**Location:** `/components/calculators/shared/InputFields.tsx`

**Purpose:** Reusable, type-safe form inputs with Portuguese localization.

#### Available Field Types:
- **CurrencyField**: Euro formatting with market insights
- **PercentageField**: Percentage inputs with validation
- **SelectField**: Dropdown with region-specific descriptions
- **BooleanField**: Enhanced checkboxes with help text
- **TextField**: Basic text inputs with pattern validation
- **NumberField**: Numeric inputs with step controls

#### Field Configuration:
```typescript
interface CalculatorFieldConfig {
  id: string                    // Unique field identifier
  type: 'currency' | 'percentage' | 'text' | 'select' | 'number' | 'boolean'
  label: string                 // Display label in Portuguese
  placeholder?: string          // Input placeholder text
  helpText?: string            // Contextual help information
  required: boolean            // Whether field is mandatory
  validation: ValidationRules  // Zod-based validation rules
  defaultValue?: any           // Default field value
  options?: SelectOption[]     // Options for select fields
  conditional?: ConditionalRule // Show/hide based on other fields
  tier: 'free' | 'registered' | 'pro' // Required access tier
}
```

#### Market Insights Feature:
Currency fields automatically show market context:
- Property values display market positioning
- Regional data integration
- Real-time feedback on user inputs

### ResultsDisplay Component

**Location:** `/components/calculators/shared/ResultsDisplay.tsx`

**Purpose:** Professional results display with conversion optimization.

#### Key Features:
- **Main Result Card**: Prominent display of primary calculation result
- **Categorized Breakdown**: Costs organized by type (taxes, fees, etc.)
- **Impact Analysis**: Visual indicators for high-impact costs
- **Recommendations**: Contextual advice based on calculation results
- **Action Buttons**: Share, save, and upgrade prompts
- **Conversion Prompts**: Pro feature teasers and upgrade CTAs

#### Result Structure:
```typescript
interface BaseCalculationResult {
  totalAmount: number           // Main calculation result
  netAmount?: number           // Net amount after deductions
  breakdown: CalculationBreakdown[]  // Detailed cost breakdown
  summary: CalculationSummary   // Key metrics for display
  recommendations?: string[]    // Contextual recommendations
  disclaimers: string[]        // Legal disclaimers
  calculatedAt: Date           // Timestamp for tracking
  inputs: Record<string, any>  // Original input values
}
```

## Usage Tracking System

### 1. Tracking Architecture

```
User Action → Session Check → Tier Limits → Rate Limits → Database → Analytics
     ↓             ↓            ↓            ↓           ↓         ↓
  Input Data   Anonymous ID   Daily Quota  Per-minute  Storage  PostHog
```

### 2. Usage Enforcement Logic

**Location:** `/lib/usage/enforcement.ts`

#### Tier-Based Limits:
```typescript
const DAILY_LIMITS = {
  anonymous: 5,      // 5 calculations per day (IP + session based)
  free: 5,          // Same as anonymous but with account
  registered: 10,    // 10 calculations per day
  pro: Infinity     // Unlimited calculations
}

const RATE_LIMITS = {
  perMinute: { anonymous: 3, free: 3, registered: 5, pro: 10 },
  perHour: { anonymous: 10, free: 10, registered: 20, pro: 100 }
}
```

#### Enforcement Flow:
```typescript
async function enforceUsageLimit(context: UsageContext): Promise<EnforcementResult> {
  // 1. Check tier access for calculator
  const tierAccess = validateTierAccess(calculator.tier, user.type)
  if (!tierAccess.allowed) return blockForTierUpgrade()
  
  // 2. Check daily limits
  const dailyUsage = await getDailyUsage(context)
  if (dailyUsage >= getDailyLimit(user.type)) return blockForDailyLimit()
  
  // 3. Check rate limits
  const rateCheck = await checkRateLimit(context)
  if (!rateCheck.allowed) return blockForRateLimit()
  
  // 4. Allow calculation and track usage
  return { allowed: true, usageInfo: getCurrentUsage(context) }
}
```

### 3. Session Tracking

**Location:** `/lib/usage/session-tracking.ts`

#### Anonymous User Tracking:
- **Session ID**: Generated client-side, persisted in localStorage
- **IP Address**: Server-side tracking for rate limiting
- **Fingerprinting**: Browser fingerprinting for duplicate detection
- **Cross-session**: Link anonymous sessions to registered accounts

#### Registered User Tracking:
- **User ID**: Primary identifier from Supabase Auth
- **Profile Integration**: Subscription tier and limits
- **Usage History**: Persistent calculation history
- **Analytics**: Detailed user journey tracking

### 4. Database Schema

**Tables Used:**
```sql
-- Daily usage tracking
profiles (
  id UUID,
  subscription_tier TEXT,
  daily_calculations_used INTEGER DEFAULT 0,
  last_calculation_reset DATE DEFAULT CURRENT_DATE
)

-- Detailed calculation history
calculations (
  id UUID,
  user_id UUID REFERENCES profiles(id),
  calculator_type TEXT,
  input_data JSONB,
  result_data JSONB,
  ip_address INET,       -- For anonymous tracking
  session_id TEXT,       -- For anonymous session persistence
  created_at TIMESTAMP
)

-- Usage limits and enforcement
usage_sessions (
  session_id TEXT,
  ip_address INET,
  user_id UUID,
  daily_count INTEGER DEFAULT 0,
  last_reset DATE,
  rate_limit_count INTEGER DEFAULT 0,
  rate_limit_window TIMESTAMP
)
```

## Conversion Optimization

### 1. Upgrade Trigger Points

#### After 3rd Calculation:
```typescript
// In CalculatorWrapper
useEffect(() => {
  if (calculationCount >= 3 && userType !== 'pro') {
    setTimeout(() => setShowUpgradeCard(true), 2000)
  }
}, [calculationCount, userType])
```

#### Usage Limit Reached:
```typescript
// Blocking modal with Stripe checkout integration
const showUpgradeModal = (usageInfo: UsageLimit) => {
  if (usageInfo.checkoutUrl) {
    showUsageLimitModal({
      usageInfo,
      checkoutUrl: usageInfo.checkoutUrl,
      resetTime: usageInfo.resetTime
    })
  }
}
```

#### Results Display:
```typescript
// Premium feature teasers in results
{!isPro && (
  <Badge 
    onClick={onUpgrade}
    className="border-purple-200 text-purple-700 bg-purple-50"
  >
    <Crown className="w-3 h-3 mr-1" />
    Pro: Relatório Detalhado
  </Badge>
)}
```

### 2. Conversion Tracking

**PostHog Events:**
```typescript
// Usage limit hit
posthog.capture('blocking_modal_shown', {
  user_type: userType,
  calculator_type: calculatorType,
  calculations_used: usageInfo.used,
  time_until_reset: timeUntilReset
})

// Upgrade initiated
posthog.capture('upgrade_initiated', {
  trigger: 'usage_limit',
  user_type: userType,
  calculator_type: calculatorType,
  pricing_page_referrer: window.location.href
})
```

## Implementation Guidelines

### 1. Adding New Calculators

1. **Define Configuration:**
```typescript
// In lib/calculators/config.ts
export const CALCULATOR_CONFIGS = {
  'new-calculator': {
    id: 'new-calculator',
    name: 'New Calculator Name',
    description: 'Calculator description',
    icon: '🏠',
    route: '/calculators/new-calculator',
    category: 'buying',
    difficulty: 'basic',
    estimatedTime: 5,
    tier: 'free' // or 'registered' | 'pro'
  }
}
```

2. **Create Validation Schema:**
```typescript
// In lib/calculators/validation.ts
export const NewCalculatorInputSchema = BaseCalculatorInputSchema.extend({
  customField: CurrencySchema(0, 1000000),
  // ... other fields
})
```

3. **Build Calculator Component:**
```typescript
// In components/calculators/new-calculator/
export function NewCalculatorComponent() {
  return (
    <CalculatorWrapper
      title="New Calculator"
      calculatorType="new-calculator"
    >
      <CalculatorLayout config={CALCULATOR_CONFIGS['new-calculator']}>
        {/* Input forms */}
        <ResultsDisplay result={calculationResult} />
      </CalculatorLayout>
    </CalculatorWrapper>
  )
}
```

### 2. Customizing Usage Limits

```typescript
// In lib/usage/enforcement.ts
const CUSTOM_LIMITS = {
  'premium-calculator': {
    anonymous: 2,    // Reduced limit for premium calculators
    registered: 5,
    pro: Infinity
  }
}
```

### 3. Adding New Field Types

```typescript
// In components/calculators/shared/InputFields.tsx
export function DateField({ config, value, onChange, error, disabled }: BaseFieldProps) {
  return (
    <FieldWrapper config={config} value={value} onChange={onChange} error={error} disabled={disabled}>
      <Input
        type="date"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        // ... other props
      />
    </FieldWrapper>
  )
}
```

## Performance Considerations

### 1. Usage Tracking Optimization

- **Rate Limiting**: Prevent abuse with per-minute limits
- **Database Indexing**: Indexes on user_id, created_at, calculator_type
- **Caching**: Redis cache for usage counters
- **Async Processing**: Background processing for analytics

### 2. Component Optimization

- **Lazy Loading**: Dynamic imports for calculator components
- **Memoization**: React.memo for expensive calculations
- **Virtualization**: Large result lists with react-virtual
- **Code Splitting**: Separate bundles per calculator type

### 3. Analytics Efficiency

- **Batched Events**: Group PostHog events for better performance
- **Client-side Filtering**: Reduce unnecessary tracking calls
- **Debounced Tracking**: Prevent duplicate events
- **Error Boundaries**: Graceful failure handling

## Troubleshooting

### Common Issues

1. **Usage Limits Not Enforcing:**
   - Check user authentication state
   - Verify database usage counters
   - Confirm rate limit windows

2. **Calculations Not Tracking:**
   - Validate usage context creation
   - Check database permissions
   - Verify PostHog configuration

3. **Conversion Modals Not Showing:**
   - Confirm user tier detection
   - Check modal state management
   - Verify Stripe integration

### Debug Tools

```typescript
// Enable debug logging
localStorage.setItem('calculator-debug', 'true')

// Check usage state
console.log('Usage Info:', usageInfo)
console.log('User Type:', userType)
console.log('Calculation Count:', calculationCount)
```

## Security Considerations

1. **Input Validation**: All inputs validated with Zod schemas
2. **Rate Limiting**: Prevent abuse with multiple enforcement layers
3. **Authentication**: Secure user identification and session management
4. **Data Sanitization**: Clean user inputs before database storage
5. **Access Control**: Tier-based feature access with server-side validation

This architecture ensures scalable, secure, and user-friendly calculator functionality while optimizing for conversion and user experience.