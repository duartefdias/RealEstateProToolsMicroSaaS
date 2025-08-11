# Stripe Local Testing Guide

This guide explains how to test the complete payment flow in local development when Stripe webhooks cannot reach your localhost server.

## Overview

When developing locally, Stripe webhooks cannot reach your `localhost:3000` server directly. This means successful payments won't automatically update your Supabase database. We've created a manual processing method to simulate webhook behavior for testing.

## Method 1: Manual Payment Processing (Recommended for Local Development)

### Step 1: Make a Test Payment

1. **Start your development server**:
   ```bash
   npm run dev
   ```

2. **Navigate to the pricing page**: `http://localhost:3000/pricing`

3. **Click "Upgrade to Pro"** while logged in

4. **Complete the checkout** using Stripe test cards:
   - **Successful payment**: `4242 4242 4242 4242`
   - **Expiry**: Any future date (e.g., `12/34`)
   - **CVC**: Any 3 digits (e.g., `123`)
   - **ZIP**: Any valid ZIP code

### Step 2: Find Your Checkout Session ID

After successful payment, check your **server console logs** for a message like:
```
🔐 Created checkout session: cs_test_a1b2c3d4e5f6g7h8 for user: abc123def456
```

**Alternative ways to find the session ID:**
- Check the **Stripe Dashboard** → **Payments** → **Recent sessions**
- Look at the **success URL** in your browser (may contain session_id parameter)
- Check your browser's **Network tab** during checkout

### Step 3: Process the Payment Manually

Run the processing script with your checkout session ID:

```bash
node scripts/process-test-payment.js cs_test_a1b2c3d4e5f6g7h8
```

**Expected successful output:**
```
🧪 Processing your test payment...

Processing session: cs_test_a1b2c3d4e5f6g7h8
✅ SUCCESS! Payment processed successfully
📊 Results:
  - Session ID: cs_test_a1b2c3d4e5f6g7h8
  - Customer ID: cus_test_xyz123
  - Subscription ID: sub_test_abc456
  - Amount: 9.99 EUR

🎉 Your user should now be upgraded to Pro tier!

🔍 Check your Supabase database:
  • profiles table should show subscription_tier = "pro"
  • payment_history table should have the payment record
  • subscription_events table should have the event record
```

## Expected Results in Supabase

After successful processing, verify the following changes in your Supabase database:

### 1. profiles table
The user's profile should be updated with:
```sql
-- Example updated record
{
  "id": "abc123def456",
  "email": "user@example.com",
  "subscription_tier": "pro",           -- ✅ Updated from "free"
  "stripe_customer_id": "cus_test_xyz123",
  "subscription_id": "sub_test_abc456",
  "subscription_status": "active",
  "subscription_plan": "pro",
  "current_period_end": null,
  -- ... other fields
}
```

### 2. payment_history table
A new payment record should be created:
```sql
-- Example payment record
{
  "id": "uuid-generated",
  "user_id": "abc123def456",
  "stripe_payment_intent_id": "pi_test_123456",
  "amount": 999,                        -- €9.99 in cents
  "currency": "EUR",
  "status": "succeeded",
  "description": "Pro subscription - Monthly",
  "created_at": "2024-01-15T10:30:00Z"
}
```

### 3. subscription_events table
A subscription event should be logged:
```sql
-- Example event record
{
  "id": "uuid-generated",
  "user_id": "abc123def456",
  "stripe_subscription_id": "sub_test_abc456",
  "event_type": "checkout_completed",
  "old_status": null,
  "new_status": "active",
  "metadata": {
    "checkout_session_id": "cs_test_a1b2c3d4e5f6g7h8",
    "amount": 999,
    "currency": "eur",
    "customer_id": "cus_test_xyz123"
  },
  "created_at": "2024-01-15T10:30:00Z"
}
```

## Expected Results in Stripe Dashboard

### Test Mode Stripe Dashboard

1. **Payments Section**:
   - Should show a successful €9.99 payment
   - Status: `Succeeded`
   - Customer: Shows customer email/name
   - Description: Related to your Pro subscription

2. **Customers Section**:
   - New customer record created
   - Customer ID matches `stripe_customer_id` in Supabase
   - Associated with the subscription

3. **Subscriptions Section**:
   - Active subscription for €9.99/month
   - Status: `Active`
   - Next invoice date: ~1 month from creation
   - Associated with the Pro plan price ID

4. **Products Section**:
   - Should show "Real Estate Pro Tools - Pro Plan (TEST)"
   - Price: €9.99/month
   - Status: Active

## Troubleshooting

### Common Issues

#### 1. "Session not found" error
```bash
❌ ERROR: No such checkout session: cs_test_xxxxx
```
**Solutions:**
- Verify the session ID is correct and starts with `cs_test_`
- Check that you're using the correct Stripe keys (test mode)
- Ensure the session was created recently (sessions expire)

#### 2. "User not found" error
```bash
❌ ERROR: Profile not found
```
**Solutions:**
- Ensure you were logged in when making the payment
- Check that the `client_reference_id` was set correctly during checkout
- Verify your Supabase auth is working properly

#### 3. Database connection errors
```bash
❌ Failed to process payment: Connection terminated due to connection timeout
```
**Solutions:**
- Check your Supabase connection settings in `.env`
- Verify `SUPABASE_SERVICE_ROLE_KEY` is correct
- Ensure your Supabase project is active and accessible

#### 4. Server not running
```bash
❌ Failed to process payment: fetch failed
```
**Solutions:**
- Ensure your Next.js server is running on `localhost:3000`
- Check that the test webhook endpoint is accessible
- Verify no other process is using port 3000

### Debugging Steps

1. **Check Server Logs**: Look for detailed error messages in your console
2. **Verify Environment Variables**: Ensure all Stripe and Supabase keys are correct
3. **Test Database Connection**: Run the setup script to verify connectivity
4. **Check Stripe Dashboard**: Confirm the payment exists and is successful
5. **Inspect Network Requests**: Use browser dev tools to check API calls

## Database Queries for Verification

Use these SQL queries in Supabase to verify the payment was processed correctly:

```sql
-- Check user's subscription status
SELECT 
  id, 
  email, 
  subscription_tier, 
  subscription_status,
  stripe_customer_id,
  subscription_id
FROM profiles 
WHERE email = 'your-test-email@example.com';

-- Check payment history
SELECT 
  amount, 
  currency, 
  status, 
  description, 
  created_at
FROM payment_history 
WHERE user_id = 'your-user-id'
ORDER BY created_at DESC;

-- Check subscription events
SELECT 
  event_type, 
  old_status, 
  new_status, 
  metadata, 
  created_at
FROM subscription_events 
WHERE user_id = 'your-user-id'
ORDER BY created_at DESC;
```

## Next Steps

Once you've verified local testing works:

1. **Set up Stripe CLI** for automatic webhook forwarding (see main Stripe setup docs)
2. **Deploy to production** where webhooks will work automatically
3. **Configure production webhooks** in the Stripe Dashboard
4. **Test the full flow** in production environment

## Security Notes

- The manual processing endpoint (`/api/test-webhook`) should **only be used in development**
- Never expose this endpoint in production
- Always verify payments in the Stripe Dashboard before processing
- Use test mode keys for all local development

---

**Need Help?** 
- Check the main [Stripe Setup Guide](./stripe-setup.md)
- Review server logs for detailed error messages
- Test individual components (auth, database, Stripe API) separately