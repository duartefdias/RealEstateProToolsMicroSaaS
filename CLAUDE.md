# CLAUDE.md - Real Estate Pro Tools

## Project Overview

**Product Name:** Real Estate Pro Tools  
**Website:** www.realestateprotools.com  
**Tagline:** "Professional Real Estate Calculations & Client Management - Simplified"

**Core Value Proposition:**  
A comprehensive suite of real estate calculation tools and client management features designed for real estate professionals, investors, and homeowners. Provides accurate, localized calculations for the Portuguese market with plans for global expansion.

**Target Market:**
- **Primary:** Real estate agents and brokers in Portugal
- **Secondary:** Property investors and homeowners in Portugal  
- **Tertiary:** International real estate professionals (future expansion)

**Revenue Model:**
- Freemium with usage-based limitations
- Subscription tiers: Free (5 calcs/day) → Registered (10 calcs/day) → Pro (unlimited + client management)
- Target pricing: €9.99/month for Pro tier
- Payment processing: Stripe with secure checkout and subscription management

## Technical Architecture

### Stack Justification
- **Next.js 14+ (App Router):** SEO optimization, server-side rendering for better search rankings
- **TypeScript:** Type safety for complex financial calculations
- **Tailwind CSS + Shadcn/ui:** Rapid development with professional appearance
- **Supabase:** PostgreSQL for complex real estate data, built-in auth, RLS for multi-tenant security
- **Vercel:** Optimal Next.js hosting with edge functions for global performance
- **Resend:** Professional email delivery for user notifications and marketing
- **PostHog:** Complete product analytics, feature flags, A/B testing, and user behavior tracking

IMPORTANT: Always use context7 to get the latest documentation.

### Database Schema Overview

```sql
-- Users and Authentication (handled by Supabase Auth)
profiles (
  id UUID PRIMARY KEY REFERENCES auth.users,
  email TEXT,
  full_name TEXT,
  subscription_tier TEXT DEFAULT 'free',
  daily_calculations_used INTEGER DEFAULT 0,
  last_calculation_reset DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Usage Tracking
calculations (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  calculator_type TEXT NOT NULL,
  input_data JSONB,
  result_data JSONB,
  ip_address INET, -- For anonymous user tracking
  session_id TEXT, -- For anonymous user tracking
  created_at TIMESTAMP DEFAULT NOW()
);

-- Client Management (Pro feature)
clients (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  status TEXT DEFAULT 'lead', -- lead, active, inactive, closed
  stage TEXT DEFAULT 'initial_contact',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tasks Management
tasks (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  client_id UUID REFERENCES clients(id),
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  completed BOOLEAN DEFAULT FALSE,
  priority TEXT DEFAULT 'medium',
  created_at TIMESTAMP DEFAULT NOW()
);

-- SEO and Analytics
page_views (
  id UUID PRIMARY KEY,
  page_path TEXT,
  user_agent TEXT,
  ip_address INET,
  referrer TEXT,
  country TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Authentication Flow
- **Anonymous users:** Track by IP + session ID, enforce 5 calculations/day
- **Registered users:** Supabase Auth with email/password, Google OAuth optional
- **Session management:** Automatic token refresh, secure cookie storage
- **Role-based access:** Free, Registered, Pro tiers with progressive feature access

### API Design Principles
- **RESTful endpoints:** `/api/calculators/[type]`, `/api/clients`, `/api/usage`, `/api/payments`
- **Rate limiting:** Per-user and per-IP limits using Vercel edge functions
- **Error handling:** Standardized error responses with localized messages
- **Input validation:** Zod schemas for all calculator inputs and API requests

### Payment System Architecture (Stripe Integration)

#### Subscription Management
```typescript
// Stripe subscription tiers configuration
const subscriptionPlans = {
  free: {
    id: null,
    name: 'Free',
    daily_calculations: 5,
    features: ['Basic calculators', 'Portuguese localization'],
    price: 0
  },
  registered: {
    id: null,
    name: 'Registered',
    daily_calculations: 10,
    features: ['Basic calculators', 'Portuguese + English', 'Email support'],
    price: 0
  },
  pro: {
    id: 'price_pro_monthly', // Stripe price ID
    name: 'Pro',
    daily_calculations: Infinity,
    features: [
      'Unlimited calculations',
      'Client management',
      'Task tracking',
      'Advanced reporting',
      'Priority support',
      'Export functionality'
    ],
    price: 9.99,
    currency: 'EUR'
  }
};

// Stripe customer and subscription handling
interface StripeCustomer {
  stripe_customer_id: string;
  subscription_id?: string;
  subscription_status: 'active' | 'canceled' | 'past_due' | 'incomplete';
  current_period_start: Date;
  current_period_end: Date;
  cancel_at_period_end: boolean;
}
```

#### Payment Flow Implementation
```typescript
// 1. Checkout session creation
export async function createCheckoutSession(userId: string, priceId: string) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  
  const session = await stripe.checkout.sessions.create({
    customer_email: user.email,
    client_reference_id: userId,
    line_items: [{
      price: priceId,
      quantity: 1,
    }],
    mode: 'subscription',
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/pricing?canceled=true`,
    subscription_data: {
      metadata: {
        user_id: userId,
      },
    },
    allow_promotion_codes: true,
    billing_address_collection: 'required',
    tax_id_collection: {
      enabled: true, // For Portuguese VAT collection
    },
  });
  
  return session.url;
}

// 2. Webhook handling for subscription events
export async function handleStripeWebhook(event: Stripe.Event) {
  switch (event.type) {
    case 'checkout.session.completed':
      await handleSuccessfulPayment(event.data.object);
      break;
    case 'customer.subscription.updated':
      await handleSubscriptionUpdate(event.data.object);
      break;
    case 'customer.subscription.deleted':
      await handleSubscriptionCancellation(event.data.object);
      break;
    case 'invoice.payment_failed':
      await handleFailedPayment(event.data.object);
      break;
  }
}

// 3. Usage limit enforcement with Stripe integration
export async function enforceUsageLimitWithPayment(userId: string): Promise<{
  allowed: boolean;
  remaining: number;
  requiresUpgrade: boolean;
  checkoutUrl?: string;
}> {
  const profile = await getProfile(userId);
  const subscription = await getActiveSubscription(userId);
  
  if (subscription?.status === 'active' && subscription.plan === 'pro') {
    return { allowed: true, remaining: Infinity, requiresUpgrade: false };
  }
  
  const limit = subscription?.plan === 'registered' ? 10 : 5;
  const used = profile.daily_calculations_used;
  
  if (used >= limit) {
    const checkoutUrl = await createCheckoutSession(userId, 'price_pro_monthly');
    return {
      allowed: false,
      remaining: 0,
      requiresUpgrade: true,
      checkoutUrl
    };
  }
  
  return {
    allowed: true,
    remaining: limit - used,
    requiresUpgrade: false
  };
}
```

#### Database Schema Updates for Payments
```sql
-- Extend profiles table for Stripe integration
ALTER TABLE profiles ADD COLUMN stripe_customer_id TEXT;
ALTER TABLE profiles ADD COLUMN subscription_id TEXT;
ALTER TABLE profiles ADD COLUMN subscription_status TEXT;
ALTER TABLE profiles ADD COLUMN subscription_plan TEXT DEFAULT 'free';
ALTER TABLE profiles ADD COLUMN current_period_end TIMESTAMP;

-- Payment history tracking
CREATE TABLE payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  stripe_payment_intent_id TEXT,
  amount INTEGER, -- in cents
  currency TEXT DEFAULT 'EUR',
  status TEXT, -- succeeded, failed, canceled
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Subscription events log
CREATE TABLE subscription_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  stripe_subscription_id TEXT,
  event_type TEXT, -- created, updated, canceled, renewed
  old_status TEXT,
  new_status TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Frontend Payment Components
```tsx
// Blocking modal component for usage limits
const UsageLimitModal = ({ isOpen, onClose, checkoutUrl, resetTime }: {
  isOpen: boolean;
  onClose: () => void;
  checkoutUrl?: string;
  resetTime: Date;
}) => {
  const timeUntilReset = formatDistanceToNow(resetTime);
  
  return (
    <Dialog open={isOpen} onOpenChange={() => {}} modal>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Daily Calculation Limit Reached</DialogTitle>
          <DialogDescription>
            You've reached your daily calculation limit. Upgrade to Pro for unlimited calculations.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-amber-50 p-4 rounded-lg">
            <p className="text-sm text-amber-800">
              Your limit will reset in <strong>{timeUntilReset}</strong>
            </p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-semibold">Upgrade to Pro and get:</h4>
            <ul className="text-sm space-y-1">
              <li>✓ Unlimited calculations</li>
              <li>✓ Client management system</li>
              <li>✓ Advanced reporting</li>
              <li>✓ Priority support</li>
            </ul>
          </div>
        </div>
        
        <DialogFooter className="flex-col sm:flex-col space-y-2">
          {checkoutUrl && (
            <Button 
              onClick={() => window.location.href = checkoutUrl}
              className="w-full"
            >
              Upgrade to Pro - €9.99/month
            </Button>
          )}
          <Button 
            variant="outline" 
            onClick={onClose}
            className="w-full"
          >
            Wait for Reset ({timeUntilReset})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Subscription management component
const SubscriptionManager = ({ subscription }: { subscription: StripeCustomer }) => {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleCancelSubscription = async () => {
    setIsLoading(true);
    try {
      await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      // Refresh page or update state
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscription Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600">Current Plan</p>
            <p className="font-semibold">Pro Plan</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Next Billing Date</p>
            <p>{format(subscription.current_period_end, 'PPP')}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Status</p>
            <Badge variant={subscription.subscription_status === 'active' ? 'default' : 'destructive'}>
              {subscription.subscription_status}
            </Badge>
          </div>
          
          {subscription.subscription_status === 'active' && (
            <Button 
              variant="outline" 
              onClick={handleCancelSubscription}
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : 'Cancel Subscription'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
```

## Code Standards

### TypeScript Implementation
```typescript
// Strict configuration
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}

// Example interfaces
interface CalculatorInput {
  propertyValue: number;
  location: string;
  calculationType: 'sell' | 'buy' | 'switch' | 'mortgage' | 'rental' | 'flip';
}

interface CalculationResult {
  totalCost: number;
  breakdown: Record<string, number>;
  recommendations?: string[];
  disclaimers: string[];
}

// Usage tracking type
interface UsageLimit {
  daily_limit: number;
  current_usage: number;
  can_calculate: boolean;
  reset_time: Date;
}
```

### Component Architecture
```tsx
// Calculator components structure
/components
  /calculators
    /shared
      CalculatorLayout.tsx
      InputField.tsx
      ResultsDisplay.tsx
      UsageLimitBanner.tsx
    /sell-house
      SellHouseCalculator.tsx
      SellHouseInputs.tsx
      SellHouseResults.tsx
    /buy-house
      BuyHouseCalculator.tsx
    // ... other calculators
  /client-management
    ClientKanban.tsx
    TaskManager.tsx
  /common
    Header.tsx
    Footer.tsx
    LanguageSelector.tsx
    SubscriptionBanner.tsx
```

### State Management Strategy
- **Server state:** React Query for API calls, caching calculation results
- **Local state:** useState for form inputs, temporary UI state
- **Global state:** Zustand for user session, language preferences, usage limits
- **Persistent state:** localStorage for anonymous user session tracking

## Business Logic Implementation

### Calculator Implementation Priority

1. **House Selling Calculator** (highest SEO potential)
   - IMT (property transfer tax) calculations
   - Real estate agent commissions (typically 5-6% in Portugal)
   - Legal fees and notary costs
   - Capital gains tax considerations
   - Utility disconnection costs

2. **House Buying Calculator**
   - IMT calculations based on property value and location
   - Stamp duty (0.8% of property value)
   - Legal and notary fees
   - Property evaluation costs
   - Bank mortgage arrangement fees

3. **Mortgage Simulator**
   - Portuguese bank interest rates integration
   - TAEG (annual percentage rate) calculations
   - Insurance requirements (life, fire, multirisk)
   - Euribor rate considerations

### Usage Tracking System
```typescript
// Usage enforcement middleware
export async function enforceUsageLimit(
  userId: string | null,
  ipAddress: string,
  sessionId: string
): Promise<{ allowed: boolean; remaining: number }> {
  if (userId) {
    // Registered user logic
    const profile = await getProfile(userId);
    const today = new Date().toISOString().split('T')[0];
    
    if (profile.last_calculation_reset !== today) {
      await resetDailyUsage(userId);
    }
    
    const limit = profile.subscription_tier === 'pro' ? Infinity : 
                  profile.subscription_tier === 'registered' ? 10 : 5;
    
    return {
      allowed: profile.daily_calculations_used < limit,
      remaining: Math.max(0, limit - profile.daily_calculations_used)
    };
  } else {
    // Anonymous user logic
    const usage = await getAnonymousUsage(ipAddress, sessionId);
    return {
      allowed: usage < 5,
      remaining: Math.max(0, 5 - usage)
    };
  }
}
```

### SEO Optimization Strategy

#### URL Structure
```
/ (homepage - calculator catalog)
/calculators/sell-house
/calculators/buy-house  
/calculators/switch-house
/calculators/mortgage-simulator
/calculators/rental-investment
/calculators/property-flip
/client-management
/pricing
/about
/blog/[slug]
```

#### Meta Tags and Schema.org
```typescript
// SEO metadata for each calculator
export const calculatorSEO = {
  'sell-house': {
    title: 'Calculadora de Custos de Venda de Casa | Real Estate Pro Tools',
    description: 'Calcule todos os custos associados à venda da sua casa em Portugal. IMT, comissões, impostos e taxas legais.',
    keywords: 'venda casa portugal, custos venda imóvel, imt portugal, calculadora imobiliária',
    schema: {
      "@type": "WebApplication",
      "name": "Calculadora de Custos de Venda",
      "applicationCategory": "FinanceApplication",
      "operatingSystem": "Web"
    }
  }
  // ... other calculators
};
```

#### Content Strategy
- **Landing pages:** Detailed explanations of each calculation type
- **Blog content:** Portuguese real estate market insights, tax guides
- **FAQ sections:** Common questions about Portuguese property transactions
- **Local SEO:** Target Portuguese real estate keywords

### Localization Implementation

```typescript
// i18n configuration
// locales/pt.json
{
  "calculators": {
    "sell-house": {
      "title": "Calculadora de Custos de Venda",
      "propertyValue": "Valor do Imóvel",
      "location": "Localização",
      "results": {
        "totalCosts": "Custos Totais",
        "netProceeds": "Valor Líquido"
      }
    }
  },
  "usage": {
    "limitReached": "Limite diário atingido. Registe-se para mais cálculos.",
    "remaining": "Restam {{count}} cálculos hoje"
  }
}

// locales/en.json
{
  "calculators": {
    "sell-house": {
      "title": "House Selling Cost Calculator",
      "propertyValue": "Property Value",
      "location": "Location",
      "results": {
        "totalCosts": "Total Costs",
        "netProceeds": "Net Proceeds"
      }
    }
  }
}
```

## Performance Optimization

### Next.js Optimization
- **Static generation:** Pre-render calculator landing pages
- **Dynamic imports:** Code-split calculator components
- **Image optimization:** Compress and serve WebP format
- **Edge functions:** Usage tracking and rate limiting at edge

### Database Optimization
- **Indexes:** Create indexes on user_id, created_at, calculator_type
- **Connection pooling:** Use Supabase connection pooling
- **Query optimization:** Use RLS policies for automatic data filtering
- **Caching:** Cache calculation results for common inputs

### User Experience
- **Progressive enhancement:** Basic calculations work without JS
- **Optimistic updates:** Immediate feedback on form interactions
- **Loading states:** Skeleton screens during calculations
- **Error boundaries:** Graceful error handling with retry options

#### Usage Limit UX Flow
```typescript
// Complete user flow for usage limit enforcement
const CalculatorWrapper = ({ children }: { children: React.ReactNode }) => {
  const [showBlockingModal, setShowBlockingModal] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const { user, usageLimit } = useAuth();
  
  const handleCalculationAttempt = async () => {
    const usageCheck = await checkUsageLimit(user?.id);
    
    if (!usageCheck.allowed) {
      // Track blocking modal display
      posthog?.capture('blocking_modal_shown', {
        user_type: user ? 'registered' : 'anonymous',
        calculator_type: router.pathname.split('/')[2],
        calculations_used: usageCheck.used,
        time_until_reset: usageCheck.resetTime
      });
      
      setCheckoutUrl(usageCheck.checkoutUrl);
      setShowBlockingModal(true);
      return false;
    }
    
    return true;
  };
  
  return (
    <>
      {React.cloneElement(children, { onCalculate: handleCalculationAttempt })}
      <UsageLimitModal 
        isOpen={showBlockingModal}
        onClose={() => setShowBlockingModal(false)}
        checkoutUrl={checkoutUrl}
        resetTime={usageLimit?.resetTime}
      />
    </>
  );
};
```

#### Stripe Checkout Integration
- **Seamless redirect:** Direct integration with Stripe Checkout from blocking modal
- **Tax compliance:** Automatic VAT collection for Portuguese customers
- **Payment methods:** Credit cards, SEPA, local payment methods
- **Subscription management:** Built-in customer portal for plan changes
- **Failed payment handling:** Automatic retry logic and grace periods

## Conversion Optimization

### Landing Page Strategy
```tsx
// Homepage calculator catalog
const CalculatorGrid = () => (
  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
    {calculators.map(calc => (
      <CalculatorCard 
        key={calc.id}
        title={calc.title}
        description={calc.description}
        icon={calc.icon}
        href={calc.href}
        estimatedSavings="€2,000+"
        testimonialSnippet="Saved me hours of research"
      />
    ))}
  </div>
);
```

### Usage Limit Enforcement & Upgrade Prompts
- **Usage limit reached:** Blocking modal preventing further calculations until upgrade
- **After 3rd calculation:** Soft prompt highlighting registered user benefits
- **High-value results:** "Unlock detailed breakdown with Pro"
- **Client management:** Trial period with full features, then paywall

#### Blocking Popup Implementation
When users reach their daily calculation limit, they encounter a full-screen blocking modal that:
- Prevents access to calculator functionality
- Clearly explains the current tier limitations
- Displays upgrade options with immediate Stripe checkout
- Shows time until limit reset for current tier
- Cannot be dismissed without upgrading or waiting for reset

### Email Sequences
1. **Welcome series:** Calculator introductions, Portugal market insights
2. **Usage notifications:** Daily limit reminders, upgrade suggestions
3. **Value-driven content:** Monthly market reports, new calculator announcements
4. **Win-back campaigns:** Re-engage inactive users with new features

### PostHog Analytics Implementation

#### Event Tracking Strategy
```typescript
// User identification and properties
export const identifyUser = (userId: string, properties: any) => {
  const posthog = usePostHog();
  posthog?.identify(userId, {
    email: properties.email,
    subscription_tier: properties.subscription_tier,
    signup_date: properties.created_at,
    country: 'Portugal', // Default, can be detected
    preferred_language: properties.language || 'pt'
  });
};

// Page view tracking with calculator context
export const trackPageView = (page: string, properties: Record<string, any> = {}) => {
  const posthog = usePostHog();
  posthog?.capture('$pageview', {
    $current_url: window.location.href,
    page_type: page.includes('/calculators/') ? 'calculator' : 'marketing',
    calculator_type: page.includes('/calculators/') ? page.split('/')[2] : null,
    ...properties
  });
};

// Conversion tracking with cohort analysis
export const trackConversion = (eventName: string, value?: number, properties: Record<string, any> = {}) => {
  const posthog = usePostHog();
  posthog?.capture(eventName, {
    conversion_value: value,
    timestamp: new Date().toISOString(),
    user_segment: properties.subscription_tier || 'anonymous',
    ...properties
  });
};
```

#### Feature Flags for A/B Testing
```typescript
// Feature flags for conversion optimization
const featureFlags = {
  'calculator_results_design': ['control', 'enhanced_visuals', 'minimal_design'],
  'upgrade_prompt_timing': ['immediate', 'after_3_calcs', 'usage_limit'],
  'pricing_display': ['monthly_focus', 'annual_savings', 'value_comparison'],
  'onboarding_flow': ['single_step', 'progressive_disclosure', 'guided_tour'],
  'social_proof_placement': ['header', 'sidebar', 'results_page']
};

// Implementation in components
const CalculatorResults = ({ results }: { results: CalculationResult }) => {
  const designVariant = useFeatureFlag('calculator_results_design');
  
  switch (designVariant) {
    case 'enhanced_visuals':
      return <EnhancedResultsDisplay results={results} />;
    case 'minimal_design':
      return <MinimalResultsDisplay results={results} />;
    default:
      return <StandardResultsDisplay results={results} />;
  }
};
```

#### Cohort Analysis Setup
```typescript
// User segmentation for cohort analysis
export const updateUserSegment = (userId: string) => {
  const posthog = usePostHog();
  
  // Behavioral segments
  const segments = {
    'power_user': 'Makes 8+ calculations per month',
    'casual_user': 'Makes 1-3 calculations per month',
    'trial_user': 'Registered but <5 total calculations',
    'at_risk_churn': 'No activity in 14+ days',
    'high_value_prospect': 'Used 3+ different calculators'
  };
  
  posthog?.setPersonProperties({
    user_segment: determineSegment(userId),
    last_active: new Date().toISOString(),
    lifetime_calculations: getTotalCalculations(userId)
  });
};
```

## Design System

### Color Palette (Professional Real Estate Theme)
```css
:root {
  /* Real Estate Pro Tools Brand Colors - Blue Palette */
  --yale-blue: #134074;      /* Yale Blue - Primary brand */
  --berkeley-blue: #13315c;  /* Berkeley Blue - Secondary */
  --oxford-blue: #0b2545;    /* Oxford Blue - Dark accent */
  --powder-blue: #8da9c4;    /* Powder Blue - Light accent */
  --mint-cream: #eef4ed;     /* Mint Cream - Background accent */
  
  /* Status colors */
  --success: #10b981;        /* Green - positive results */
  --warning: #f59e0b;        /* Orange - usage warnings */
  --error: #ef4444;          /* Red - errors, limits */
}
```

### Typography
```css
/* Font stack: Professional and readable */
@import url('https://fonts.googleapis.com/css2?family=League+Spartan:wght@100..900&display=swap');

.font-primary { font-family: 'League Spartan', system-ui, sans-serif; }

/* Typography scale */
.text-display { font-size: 3.5rem; font-weight: 700; }
.text-h1 { font-size: 2.5rem; font-weight: 600; }
.text-h2 { font-size: 2rem; font-weight: 600; }
.text-body { font-size: 1rem; font-weight: 400; }
.text-small { font-size: 0.875rem; font-weight: 400; }
```

### UI Component Library Recommendation
**Primary choice: Shadcn/ui** (as specified in requirements)
- Customizable Tailwind-based components
- Excellent TypeScript support
- Professional design out of the box

**Alternative considerations:**
- **React Bits:** For additional specialized components
- **21st.dev:** For advanced interactive elements
- **Tailark:** For landing page sections

Use the context7 mcp to get docs from shadcn/ui, react bits, tailark, 21st.dev, etc.

## Development Workflow

### Project Structure
```
src/
├── app/                          # Next.js App Router
│   ├── (calculators)/
│   │   ├── calculators/
│   │   │   └── [type]/
│   │   │       └── page.tsx
│   │   └── layout.tsx
│   ├── client-management/
│   ├── api/
│   │   ├── calculators/
│   │   ├── usage/
│   │   └── auth/
│   └── globals.css
├── components/
├── lib/
│   ├── calculators/              # Business logic
│   ├── database/                 # Supabase client
│   ├── auth/                     # Authentication helpers
│   ├── analytics/                # PostHog configuration and tracking
│   └── utils/
├── hooks/
├── types/
└── locales/
```

### Environment Variables
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Email
RESEND_API_KEY=

# Analytics
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=
NEXT_PUBLIC_GOOGLE_ANALYTICS=
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=

# Payments (future)
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

### Analytics Events
```typescript
// PostHog tracking implementation
import { usePostHog } from 'posthog-js/react';

// Track key business metrics
const trackingEvents = {
  'calculator_used': { 
    calculator_type: string,
    user_type: 'anonymous' | 'registered' | 'pro',
    input_value_range: string,
    location: string,
    session_id: string
  },
  'usage_limit_reached': { 
    user_type: string,
    calculator_type: string,
    daily_usage: number,
    time_of_day: string
  },
  'signup_started': { 
    source: string,
    calculator_type: string,
    utm_source?: string,
    utm_medium?: string
  },
  'subscription_upgraded': { 
    from_tier: string,
    to_tier: string,
    trigger: 'usage_limit' | 'feature_gate' | 'direct',
    days_since_signup: number
  },
  'payment_initiated': {
    plan: string,
    amount: number,
    currency: string,
    checkout_session_id: string,
    trigger: 'blocking_modal' | 'pricing_page' | 'feature_gate'
  },
  'payment_completed': {
    plan: string,
    amount: number,
    currency: string,
    payment_method: string,
    subscription_id: string
  },
  'payment_failed': {
    plan: string,
    amount: number,
    currency: string,
    error_code: string,
    retry_attempt: number
  },
  'subscription_canceled': {
    plan: string,
    reason: string,
    days_active: number,
    total_revenue: number
  },
  'blocking_modal_shown': {
    user_type: string,
    calculator_type: string,
    calculations_used: number,
    time_until_reset: string
  },
  'calculation_completed': { 
    calculator_type: string,
    result_value_range: string,
    calculation_time_ms: number,
    input_complexity: 'simple' | 'complex'
  },
  'feature_flag_exposure': {
    flag_key: string,
    variant: string,
    user_type: string
  },
  'user_journey_milestone': {
    milestone: 'first_calculation' | 'email_signup' | 'second_visit' | 'payment_completed',
    days_since_first_visit: number,
    total_calculations: number
  }
};

// PostHog configuration with feature flags
export const posthogConfig = {
  api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  loaded: (posthog: any) => {
    if (process.env.NODE_ENV === 'development') posthog.debug();
  },
  capture_pageview: false, // We'll capture manually for better control
  capture_pageleave: true,
  enable_recording_console_log: true,
  session_recording: {
    maskAllInputs: false,
    maskInputOptions: {
      password: true,
      email: true
    }
  }
};

// A/B testing implementation
export const useFeatureFlag = (flagKey: string) => {
  const posthog = usePostHog();
  return posthog?.getFeatureFlag(flagKey);
};

// Conversion funnel tracking
export const trackConversionFunnel = (step: string, properties: Record<string, any>) => {
  const posthog = usePostHog();
  posthog?.capture('conversion_funnel', {
    step,
    timestamp: new Date().toISOString(),
    ...properties
  });
};
```

## Launch Strategy

### MVP Scope (Week 1-2)
1. House selling calculator with Portuguese tax calculations
2. Basic usage tracking (5 calculations/day for anonymous)
3. Email registration with increased limits
4. SEO-optimized landing pages
5. Portuguese and English localization

### Validation Metrics
- **Product-market fit indicators:**
  - Daily active users > 50 within first month
  - Email signup rate > 15% of daily users
  - Average time on calculator pages > 3 minutes
  - Return user rate > 30%

### Go-to-Market Channels
1. **SEO:** Target "calculadora imt portugal", "custos venda casa"
2. **Content marketing:** Portuguese real estate blogs and forums
3. **Real estate professional outreach:** Direct contact with agents
4. **Social media:** LinkedIn posts targeting real estate professionals

### Iteration Roadmap
**Month 1:** Core calculators + usage tracking  
**Month 2:** Client management features + subscription payments  
**Month 3:** Advanced calculators + mobile optimization  
**Month 4:** API integrations (bank rates, property data)  
**Month 6:** International expansion (Spanish market)

## Success Metrics

### Key Performance Indicators
- **User acquisition:** 1,000 monthly active users by month 3
- **Conversion rate:** 5% free-to-paid conversion rate
- **Revenue target:** €500 MRR by month 6
- **User engagement:** 3+ calculations per user session
- **SEO performance:** Top 3 rankings for primary keywords

### PostHog Analytics Dashboard
```typescript
// Key metrics to track in PostHog dashboards
const analyticsDashboards = {
  'Product Performance': [
    'Daily/Weekly/Monthly Active Users',
    'Calculator usage by type (funnel analysis)',
    'Session duration and depth',
    'Feature adoption rates',
    'User retention cohorts (Day 1, 7, 30 retention)'
  ],
  
  'Conversion Funnel': [
    'Landing page → Calculator usage',
    'Calculator usage → Email signup',
    'Email signup → Subscription',
    'Trial → Paid conversion',
    'Free tier → Premium upgrade'
  ],
  
  'Revenue Analytics': [
    'Customer Lifetime Value by acquisition channel',
    'Monthly Recurring Revenue growth',
    'Churn rate by user segment',
    'Average Revenue Per User (ARPU)',
    'Cost Per Acquisition by channel',
    'Blocking modal conversion rate',
    'Payment completion rate by trigger source',
    'Revenue attribution by calculator type'
  ],
  
  'User Behavior': [
    'Most popular calculator combinations',
    'Usage patterns by time of day/week',
    'Geographic distribution (Portugal regions)',
    'Language preference impact on conversion',
    'Mobile vs Desktop usage patterns'
  ]
};

// Custom PostHog insights
const customInsights = {
  'Calculator Completion Rate': 'Users who start vs complete calculations',
  'Cross-Calculator Usage': 'Users who try multiple calculator types',
  'Premium Feature Engagement': 'Usage of client management features',
  'Upgrade Trigger Analysis': 'What drives users to upgrade tiers',
  'Content Effectiveness': 'Blog/help content impact on conversions',
  'Blocking Modal Effectiveness': 'Modal display → checkout initiation → payment completion',
  'Payment Method Preferences': 'Credit card vs SEPA vs other payment methods',
  'Churn Prediction': 'Early indicators of subscription cancellation risk',
  'Revenue per Calculator': 'Which calculators drive the most subscriptions'
};
```

### A/B Testing Strategy
```typescript
// PostHog experiments to run
const experiments = [
  {
    name: 'pricing_page_optimization',
    hypothesis: 'Emphasizing annual savings increases subscription rate',
    variants: ['monthly_focus', 'annual_savings'],
    success_metric: 'subscription_started',
    duration: '4 weeks'
  },
  {
    name: 'calculator_onboarding',
    hypothesis: 'Progressive disclosure improves completion rates',
    variants: ['single_form', 'step_by_step'],
    success_metric: 'calculation_completed',
    duration: '2 weeks'
  },
  {
    name: 'upgrade_prompt_timing',
    hypothesis: 'Delayed upgrade prompts have higher conversion',
    variants: ['immediate', 'after_usage', 'limit_reached'],
    success_metric: 'subscription_conversion',
    duration: '6 weeks'
  }
];
```

### Technical Performance
- **Page load speed:** < 2 seconds LCP
- **Uptime:** 99.9% availability
- **Error rate:** < 0.1% calculation errors
- **Mobile optimization:** 90+ mobile PageSpeed score

Remember: Focus on delivering immediate value through accurate calculations while building towards sustainable recurring revenue through professional features and client management tools.