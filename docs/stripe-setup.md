# Stripe Payment Setup Guide

This guide outlines the manual setup required in Stripe Dashboard before implementing the payment integration in the Real Estate Pro Tools application.

## Overview

The Real Estate Pro Tools application uses Stripe for subscription-based payments with three tiers:
- **Free Tier**: 5 calculations per day, no payment required
- **Registered Tier**: 10 calculations per day, no payment required (email registration)
- **Pro Tier**: Unlimited calculations + client management tools, €9.99/month

## 1. Stripe Account Setup

### 1.1 Create Stripe Account
1. Visit [stripe.com](https://stripe.com) and create a new account
2. Complete business verification (required for live payments) - [Verification Guide](https://stripe.com/docs/connect/identity-verification-api)
3. Set up your business details in [Account Settings](https://dashboard.stripe.com/settings/account):
   - Business name: "Real Estate Pro Tools" or your legal entity name
   - Business type: Software/SaaS
   - Location: Portugal (or your business location)
   - Industry: Real Estate Software

### 1.2 Enable Required Features
1. Navigate to [Settings > Business settings](https://dashboard.stripe.com/settings/account)
2. Enable the following features:
   - [Subscriptions](https://dashboard.stripe.com/test/subscriptions) - [Setup Guide](https://stripe.com/docs/billing/subscriptions)
   - [Customer Portal](https://dashboard.stripe.com/settings/billing/portal) - [Portal Guide](https://stripe.com/docs/billing/subscriptions/customer-portal)
   - [Billing](https://dashboard.stripe.com/settings/billing) - [Billing Documentation](https://stripe.com/docs/billing)
   - [Invoices](https://dashboard.stripe.com/invoices) - [Invoice Guide](https://stripe.com/docs/invoicing)
   - [Tax collection](https://dashboard.stripe.com/settings/tax) (for Portuguese VAT) - [Tax Guide](https://stripe.com/docs/tax)

## 2. Product and Pricing Configuration

### 2.1 Create Pro Subscription Product
1. Go to [**Products**](https://dashboard.stripe.com/products) in Stripe Dashboard
2. Click **+ Add product** - [Product Creation Guide](https://stripe.com/docs/products-prices/how-products-and-prices-work)
3. Configure the Pro subscription:

```
Product Information:
- Name: "Real Estate Pro Tools - Pro Plan"
- Description: "Unlimited calculator usage, client management tools, advanced reporting, and priority support"
- Statement descriptor: "REALESTATEPRO" (appears on customer's bank statement)

Pricing:
- Model: "Recurring"
- Price: €9.99 EUR
- Billing period: Monthly
- Usage type: "Licensed" (flat fee)
- Price ID: Copy this for environment variables (e.g., price_1ABC123...)
```

4. **Important**: Note down the Price ID - you'll need this for environment variables - [Price ID Guide](https://stripe.com/docs/products-prices/how-products-and-prices-work#what-is-a-price)

### 2.2 Create Additional Products (Future Features)
For future expansions, create these additional products:

#### Pro Annual Plan
```
- Name: "Real Estate Pro Tools - Pro Annual"
- Price: €99.99 EUR (2 months free)
- Billing period: Yearly
- Price ID: Note down for future use
```

#### Client Management Add-on (Future)
```
- Name: "Client Management Advanced"
- Description: "Advanced CRM features, email automation, document management"
- Price: €4.99 EUR/month
- Billing period: Monthly
```

## 3. Customer Portal Configuration

### 3.1 Enable Customer Portal
1. Go to [**Settings > Customer portal**](https://dashboard.stripe.com/settings/billing/portal) - [Portal Setup Guide](https://stripe.com/docs/billing/subscriptions/customer-portal)
2. Enable the portal with these settings:

```
Business information:
- Business name: Real Estate Pro Tools
- Support email: support@realestateprotools.com
- Support phone: (optional)
- Terms of service URL: https://realestateprotools.com/terms
- Privacy policy URL: https://realestateprotools.com/privacy

Customer information:
☑ Allow customers to update email addresses
☑ Allow customers to update billing addresses
☑ Allow customers to update shipping addresses
☐ Allow customers to update phone numbers
☑ Allow customers to update tax IDs

Invoice history:
☑ Allow customers to view invoice history
☑ Allow customers to download invoices

Subscriptions:
☑ Allow customers to cancel subscriptions
☑ Allow customers to pause subscriptions
☑ Allow customers to switch plans
☑ Allow customers to update payment methods
☑ Allow customers to add promotional codes

Cancellation behavior:
○ Cancel immediately
● Cancel at period end (recommended)
☑ Provide cancellation reasons
☑ Ask for cancellation feedback
```

### 3.2 Custom Branding
1. Upload your logo (recommended size: 240x60px)
2. Set brand colors to match your application theme:
   - Primary color: `#134074` (Yale Blue from design system)
   - Accent color: `#8da9c4` (Powder Blue)

## 4. Webhook Endpoints Configuration

### 4.1 Create Webhook Endpoint
1. Go to [**Developers > Webhooks**](https://dashboard.stripe.com/webhooks) - [Webhook Guide](https://stripe.com/docs/webhooks)
2. Click **+ Add endpoint** - [Endpoint Setup Guide](https://stripe.com/docs/webhooks/quickstart)
3. Configure the endpoint:

```
Endpoint URL: https://realestateprotools.com/api/webhooks/stripe
(Replace with your actual domain)

For development: https://yourdomain.ngrok.io/api/webhooks/stripe

Listen to: Events on your account

Select events to listen to:
☑ checkout.session.completed
☑ customer.subscription.created
☑ customer.subscription.updated
☑ customer.subscription.deleted
☑ customer.subscription.paused
☑ invoice.payment_succeeded
☑ invoice.payment_failed
☑ invoice.payment_action_required
☑ customer.created
☑ customer.updated
☑ customer.deleted
```

4. **Important**: Copy the **Signing secret** - you'll need this for webhook verification - [Webhook Signatures](https://stripe.com/docs/webhooks/signatures)

### 4.2 Test Mode Webhook (Development)
Create a separate webhook endpoint for test mode with the same configuration but using your development URL.

## 5. Tax Configuration (Portuguese VAT)

### 5.1 Enable Tax Collection
1. Go to [**Settings > Tax**](https://dashboard.stripe.com/settings/tax) - [Tax Setup Guide](https://stripe.com/docs/tax/set-up-tax)
2. Enable tax collection for Portugal - [European Tax Guide](https://stripe.com/docs/tax/eu-tax):

```
Tax registration:
- Country: Portugal
- Tax ID: Your Portuguese VAT number (NIF)
- Tax type: VAT

Tax behavior:
☑ Automatically collect tax when required
☑ Include tax in prices (tax-inclusive pricing)
☑ Show tax breakdown on invoices
```

### 5.2 Tax Rates
Configure Portuguese VAT rates:
- Standard rate: 23% (mainland Portugal)
- Reduced rate: 6% (if applicable to your service classification)
- Location: Automatic based on customer billing address

## 6. Environment Variables Setup

After completing the Stripe Dashboard setup, you'll need these environment variables:

### 6.1 Required Environment Variables

Create these in your `.env.local` file:

```bash
# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... # Test key, replace with pk_live_... for production
STRIPE_SECRET_KEY=sk_test_... # Test key, replace with sk_live_... for production
STRIPE_WEBHOOK_SECRET=whsec_... # From webhook endpoint configuration

# Product and Price IDs
STRIPE_PRO_MONTHLY_PRICE_ID=price_1ABC123... # From Pro plan configuration
STRIPE_PRO_ANNUAL_PRICE_ID=price_1XYZ789... # From Pro annual plan (future)

# Customer Portal
STRIPE_CUSTOMER_PORTAL_RETURN_URL=https://realestateprotools.com/dashboard

# Currency and Region
STRIPE_CURRENCY=eur
STRIPE_COUNTRY=PT
```

### 6.2 Production vs Test Mode
- Use **test mode** keys during development
- Switch to **live mode** keys only in production
- Never commit secret keys to version control
- Use different webhook endpoints for test and live modes

## 7. Testing Setup

### 7.1 Test Cards
Use these test cards for development - [Complete Test Card List](https://stripe.com/docs/testing#cards):

```bash
# Successful payments
4242424242424242 (Visa)
5555555555554444 (Mastercard)

# Failed payments
4000000000000002 (Card declined)
4000000000000341 (Charge disputed)

# 3D Secure authentication
4000002500003155 (Requires authentication)

# Expiry: Any future date (e.g., 12/30)
# CVC: Any 3-digit number (e.g., 123)
# ZIP: Any valid postal code
```

### 7.2 Subscription Testing
1. Create test subscriptions using test cards - [Testing Subscriptions](https://stripe.com/docs/billing/subscriptions/test-clocks)
2. Test webhook events in [Stripe Dashboard](https://dashboard.stripe.com/test/webhooks) - [Webhook Testing](https://stripe.com/docs/webhooks/test)
3. Verify customer portal functionality - [Portal Testing Guide](https://stripe.com/docs/billing/subscriptions/customer-portal#test-the-customer-portal)
4. Test subscription cancellation and reactivation

## 8. Security Considerations

### 8.1 Webhook Security
- Always verify webhook signatures using the signing secret - [Signature Verification](https://stripe.com/docs/webhooks/signatures)
- Use HTTPS endpoints only - [Webhook Security Guide](https://stripe.com/docs/webhooks/best-practices)
- Implement proper error handling and logging
- Set up monitoring for failed webhook deliveries - [Webhook Monitoring](https://stripe.com/docs/webhooks/best-practices#monitoring)

### 8.2 Key Management
- Store all keys as environment variables - [API Key Best Practices](https://stripe.com/docs/keys#best-practices)
- Never expose secret keys in client-side code
- Rotate keys periodically (annually recommended) - [Key Rotation Guide](https://stripe.com/docs/keys#api-key-rotation)
- Monitor key usage in [Stripe Dashboard](https://dashboard.stripe.com/apikeys)

### 8.3 PCI Compliance
- Use Stripe Elements or Checkout for card collection (PCI compliant) - [PCI Compliance Guide](https://stripe.com/docs/security)
- Never store card details on your servers - [Sensitive Data Guidelines](https://stripe.com/docs/security/guide#validating-pci-compliance)
- Implement proper logging without sensitive data

## 9. Monitoring and Alerts

### 9.1 Stripe Dashboard Monitoring
Set up alerts for in [Settings > Notifications](https://dashboard.stripe.com/settings/notifications):
- Failed payments - [Payment Alerts Guide](https://stripe.com/docs/radar/rules#email-notifications)
- Subscription cancellations
- Webhook delivery failures - [Webhook Alerts](https://stripe.com/docs/webhooks/best-practices#monitoring)
- Unusual payment patterns - [Radar Rules](https://stripe.com/docs/radar/rules)

### 9.2 Application Monitoring
- Monitor subscription sync between Stripe and Supabase
- Track usage limit enforcement accuracy
- Log payment flow errors for debugging

## 10. Go-Live Checklist

Before enabling live payments - [Launch Checklist](https://stripe.com/docs/development/checklist):

- [ ] Complete Stripe account verification - [Account Verification](https://stripe.com/docs/connect/identity-verification-api)
- [ ] Test all payment flows in test mode - [Testing Guide](https://stripe.com/docs/testing)
- [ ] Verify webhook endpoints are working - [Webhook Testing](https://stripe.com/docs/webhooks/test)
- [ ] Test customer portal functionality - [Portal Testing](https://stripe.com/docs/billing/subscriptions/customer-portal#test-the-customer-portal)
- [ ] Configure proper error handling
- [ ] Set up monitoring and alerts - [Monitoring Guide](https://stripe.com/docs/webhooks/best-practices#monitoring)
- [ ] Review terms of service and privacy policy
- [ ] Test tax calculation for Portuguese customers - [Tax Testing](https://stripe.com/docs/tax/testing)
- [ ] Verify subscription sync with Supabase
- [ ] Test usage limit enforcement after payments

## 11. Support and Documentation

### 11.1 Stripe Resources
- [Stripe Documentation](https://stripe.com/docs)
- [Subscription Billing Guide](https://stripe.com/docs/billing/subscriptions)
- [Customer Portal Guide](https://stripe.com/docs/billing/subscriptions/customer-portal)
- [Webhook Guide](https://stripe.com/docs/webhooks)

### 11.2 Testing Resources
- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [Test Card Numbers](https://stripe.com/docs/testing#cards)
- [Webhook Testing](https://stripe.com/docs/webhooks/test)

This setup provides a solid foundation for the subscription-based payment system in Real Estate Pro Tools, with proper security, monitoring, and user experience considerations.