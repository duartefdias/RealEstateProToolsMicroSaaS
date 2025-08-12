# Production Deployment Guide - Real Estate Pro Tools

## Overview
This guide covers all manual steps required to deploy Real Estate Pro Tools to production using Vercel hosting.

## Prerequisites
- Vercel account with domain configured
- Supabase project (production instance)
- Stripe account with live mode enabled
- PostHog account
- Resend account for emails

## Environment Variables Setup

### Required Environment Variables for Vercel

Copy these variables to your Vercel project settings under "Environment Variables":

#### Supabase Configuration
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

#### Stripe Configuration (Live Mode)
```bash
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_from_stripe
STRIPE_PRO_MONTHLY_PRICE_ID=price_your_pro_monthly_price_id
STRIPE_PRO_YEARLY_PRICE_ID=price_your_pro_yearly_price_id
```

#### PostHog Analytics
```bash
NEXT_PUBLIC_POSTHOG_KEY=phc_your_posthog_project_key
NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com
```

#### Email Service (Resend)
```bash
RESEND_API_KEY=re_your_resend_api_key
```

#### Site Configuration
```bash
NEXT_PUBLIC_SITE_URL=https://your-production-domain.com
```

#### Optional - Google Analytics (if using)
```bash
NEXT_PUBLIC_GOOGLE_ANALYTICS=G-your_ga_measurement_id
```

## Supabase Production Setup

### 1. Database Migration
Run all migrations in your production Supabase project:

```sql
-- Execute each migration file in order:
-- 001_create_profiles_table.sql
-- 002_create_calculations_table.sql
-- 003_create_clients_table.sql
-- 004_create_tasks_table.sql
-- 005_create_page_views_table.sql
-- 006_create_payment_history_table.sql
-- 007_create_subscription_events_table.sql
-- 008_add_usage_functions.sql
```

### 2. Row Level Security (RLS) Policies
Enable RLS on all tables and create appropriate policies:

```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;

-- Create policies (examples)
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
-- Add similar policies for other tables
```

### 3. Supabase Auth Configuration
- Configure allowed redirect URLs in Supabase Auth settings
- Add your production domain to allowed origins
- Configure email templates for production

## Stripe Production Setup

### 1. Create Products and Prices
Create your subscription products in Stripe Dashboard (Live mode):

```javascript
// Pro Monthly Plan
{
  name: "Pro Plan",
  description: "Unlimited calculations and client management",
  billing_scheme: "per_unit",
  currency: "eur",
  recurring: {
    interval: "month"
  },
  unit_amount: 999 // €9.99 in cents
}
```

### 2. Webhook Configuration
1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://your-domain.com/api/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

### 3. Tax Configuration
Configure tax rates for Portugal (if applicable):
- VAT: 23% for Portuguese customers
- Enable automatic tax collection in Checkout

## PostHog Production Setup

### 1. Create Production Project
1. Create new project in PostHog for production
2. Copy the project API key
3. Configure feature flags if needed

### 2. Event Tracking Verification
Ensure these events are properly tracked:
- `calculator_used`
- `usage_limit_reached`  
- `signup_started`
- `subscription_upgraded`
- `payment_initiated`
- `payment_completed`

## Resend Email Setup

### 1. Domain Verification
1. Add and verify your domain in Resend
2. Configure DKIM records
3. Test email delivery

### 2. Email Templates
Set up transactional email templates for:
- Welcome emails
- Password reset
- Usage limit notifications
- Payment confirmations

## Vercel Deployment Configuration

### 1. Build & Output Settings
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm ci",
  "devCommand": "npm run dev"
}
```

### 2. Domain Configuration
1. Add custom domain in Vercel dashboard
2. Configure DNS records
3. Enable SSL certificate

### 3. Function Configuration
For API routes that may need longer execution time:

```javascript
// Add to specific API route files if needed
export const config = {
  maxDuration: 30 // seconds
}
```

## Security Configuration

### 1. CORS Settings
Ensure Supabase allows requests from your production domain only.

### 2. Rate Limiting
Consider implementing rate limiting for API endpoints:
- Calculator usage endpoints
- Authentication endpoints
- Payment endpoints

### 3. Environment Variable Security
- Never commit secrets to git
- Use Vercel's secure environment variable storage
- Rotate keys regularly

## Database Backup & Monitoring

### 1. Automated Backups
Enable automated backups in Supabase:
- Daily backups recommended
- Set retention period (30 days minimum)

### 2. Monitoring Setup
Set up monitoring for:
- Database performance
- API response times
- Error rates
- Payment processing

## Post-Deployment Verification

### 1. Core Functionality Tests
- [ ] User registration and login
- [ ] Calculator functionality
- [ ] Usage limits enforcement
- [ ] Payment flow (test with small amount)
- [ ] Email delivery
- [ ] Analytics tracking

### 2. Performance Tests
- [ ] Page load speeds
- [ ] API response times
- [ ] Database query performance

### 3. Security Tests
- [ ] Authentication flows
- [ ] Authorization checks
- [ ] Input validation
- [ ] Rate limiting

## Troubleshooting Common Issues

### PostHog Authentication Error
**Error:** `Neither apiKey nor config.authenticator provided`

**Solution:** Ensure PostHog environment variables are set:
```bash
NEXT_PUBLIC_POSTHOG_KEY=phc_your_key_here
NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com
```

### Stripe Webhook Failures
**Issue:** Webhooks not being received

**Solution:**
1. Verify webhook URL is accessible
2. Check webhook secret matches environment variable
3. Ensure endpoint accepts POST requests

### Supabase Connection Issues
**Issue:** Database connection failures

**Solution:**
1. Verify environment variables are correct
2. Check RLS policies allow required access
3. Ensure service role key has necessary permissions

### Build Failures
**Issue:** TypeScript or build errors

**Solution:**
1. Run `npm run build` locally first
2. Check all environment variables are set
3. Verify all dependencies are in package.json

## Maintenance Tasks

### Regular Tasks
- [ ] Monitor error logs weekly
- [ ] Review analytics data monthly
- [ ] Update dependencies quarterly
- [ ] Backup database monthly (automated)
- [ ] Review and rotate secrets annually

### Performance Optimization
- [ ] Monitor and optimize slow database queries
- [ ] Review and optimize bundle sizes
- [ ] Monitor and optimize API response times
- [ ] Set up CDN for static assets if needed

## Support & Emergency Contacts

### Key Services Status Pages
- Vercel: https://vercel-status.com
- Supabase: https://status.supabase.com
- Stripe: https://status.stripe.com
- PostHog: https://status.posthog.com

### Rollback Plan
1. Identify last working deployment
2. Revert to previous version in Vercel dashboard
3. Verify all services are working
4. Investigate and fix issues before redeploying

---

**Important:** Test all functionality thoroughly in a staging environment before deploying to production. Keep this guide updated as your infrastructure evolves.