const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupPaymentTables() {
  console.log('🗄️  Setting up database tables...');
  
  try {
    // Add subscription columns to profiles
    console.log('Adding subscription columns to profiles...');
    await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE profiles 
        ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
        ADD COLUMN IF NOT EXISTS subscription_id TEXT,
        ADD COLUMN IF NOT EXISTS subscription_status TEXT,
        ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'free',
        ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMP;
      `
    });

    // Create payment_history table
    console.log('Creating payment_history table...');
    const { error: paymentError } = await supabase
      .from('payment_history')
      .select('id')
      .limit(1);
      
    if (paymentError && paymentError.code === 'PGRST116') {
      // Table doesn't exist, create it
      await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE payment_history (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
            stripe_payment_intent_id TEXT,
            amount INTEGER,
            currency TEXT DEFAULT 'EUR',
            status TEXT,
            description TEXT,
            created_at TIMESTAMP DEFAULT NOW()
          );
          
          ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;
          
          CREATE POLICY "Users can view their own payment history" ON payment_history
            FOR SELECT USING (auth.uid() = user_id);
            
          CREATE INDEX idx_payment_history_user_id ON payment_history(user_id);
        `
      });
      console.log('✅ payment_history table created');
    } else {
      console.log('✅ payment_history table already exists');
    }

    // Create subscription_events table
    console.log('Creating subscription_events table...');
    const { error: eventsError } = await supabase
      .from('subscription_events')
      .select('id')
      .limit(1);
      
    if (eventsError && eventsError.code === 'PGRST116') {
      await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE subscription_events (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
            stripe_subscription_id TEXT,
            event_type TEXT,
            old_status TEXT,
            new_status TEXT,
            metadata JSONB,
            created_at TIMESTAMP DEFAULT NOW()
          );
          
          ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;
          
          CREATE POLICY "Users can view their own subscription events" ON subscription_events
            FOR SELECT USING (auth.uid() = user_id);
            
          CREATE INDEX idx_subscription_events_user_id ON subscription_events(user_id);
          CREATE INDEX idx_subscription_events_stripe_subscription_id ON subscription_events(stripe_subscription_id);
        `
      });
      console.log('✅ subscription_events table created');
    } else {
      console.log('✅ subscription_events table already exists');
    }

    console.log('✅ Database setup complete!');
    return true;
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    return false;
  }
}

async function testDatabaseConnection() {
  console.log('🔌 Testing database connection...');
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email')
      .limit(1);

    if (error) {
      console.error('❌ Database connection failed:', error);
      return false;
    }

    console.log('✅ Database connection successful');
    console.log(`Found ${data.length} profile(s) in database`);
    return true;
  } catch (error) {
    console.error('❌ Database connection error:', error);
    return false;
  }
}

function checkEnvironmentVariables() {
  console.log('🔍 Checking environment variables...');
  
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'STRIPE_PRO_MONTHLY_PRICE_ID'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ Missing environment variables:', missing);
    return false;
  }
  
  console.log('✅ All required environment variables are set');
  return true;
}

function showWebhookSetupInstructions() {
  console.log('\n🔗 WEBHOOK SETUP INSTRUCTIONS:');
  console.log('1. Go to https://dashboard.stripe.com/webhooks');
  console.log('2. Click "Add endpoint"');
  console.log('3. Use this endpoint URL: http://localhost:3000/api/webhooks/stripe');
  console.log('   (or your deployed URL + /api/webhooks/stripe)');
  console.log('4. Select these events:');
  console.log('   - checkout.session.completed');
  console.log('   - customer.subscription.created');
  console.log('   - customer.subscription.updated');
  console.log('   - customer.subscription.deleted');
  console.log('   - invoice.payment_succeeded');
  console.log('   - invoice.payment_failed');
  console.log('5. Copy the webhook signing secret and update STRIPE_WEBHOOK_SECRET in .env');
  console.log('\n💡 For local testing with Stripe CLI:');
  console.log('   stripe listen --forward-to localhost:3000/api/webhooks/stripe');
}

async function main() {
  console.log('🚀 Setting up complete payment flow...\n');
  
  // Check environment
  if (!checkEnvironmentVariables()) {
    process.exit(1);
  }
  
  // Test database connection
  if (!await testDatabaseConnection()) {
    process.exit(1);
  }
  
  // Setup database tables
  if (!await setupPaymentTables()) {
    process.exit(1);
  }
  
  // Show webhook setup instructions
  showWebhookSetupInstructions();
  
  console.log('\n✅ Setup complete! Your payment flow should now work end-to-end.');
  console.log('\n🔍 To debug webhook issues:');
  console.log('1. Check your server logs when making a test payment');
  console.log('2. Verify webhook URL is accessible from Stripe');
  console.log('3. Make sure webhook secret matches between Stripe and .env');
  
  process.exit(0);
}

main().catch(error => {
  console.error('Setup failed:', error);
  process.exit(1);
});