require('dotenv').config();

async function processTestPayment() {
  console.log('🧪 Processing your test payment...\n');

  // You'll need to replace this with the actual checkout session ID from your test payment
  const sessionId = process.argv[2];
  
  if (!sessionId) {
    console.error('❌ Please provide the checkout session ID as an argument');
    console.log('Usage: node scripts/process-test-payment.js cs_test_xxxxxxxxxx');
    console.log('\n💡 To find your session ID:');
    console.log('1. Check your server logs from when you made the test payment');
    console.log('2. Look for "Created checkout session: cs_test_xxxxx"');
    console.log('3. Or check the Stripe Dashboard -> Payments -> Recent checkouts');
    process.exit(1);
  }

  try {
    console.log(`Processing session: ${sessionId}`);
    
    const response = await fetch('http://localhost:3000/api/test-webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionId })
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ SUCCESS! Payment processed successfully');
      console.log('📊 Results:');
      console.log('  - Session ID:', result.session.id);
      console.log('  - Customer ID:', result.session.customer);
      console.log('  - Subscription ID:', result.session.subscription);
      console.log('  - Amount:', (result.session.amount_total / 100).toFixed(2), 'EUR');
      console.log('\n🎉 Your user should now be upgraded to Pro tier!');
      console.log('\n🔍 Check your Supabase database:');
      console.log('  • profiles table should show subscription_tier = "pro"');
      console.log('  • payment_history table should have the payment record');
      console.log('  • subscription_events table should have the event record');
    } else {
      console.error('❌ ERROR:', result.error);
      if (result.details) {
        console.error('Details:', result.details);
      }
      if (result.session) {
        console.log('Session info:', result.session);
      }
    }
  } catch (error) {
    console.error('❌ Failed to process payment:', error.message);
    console.log('\n🔍 Troubleshooting:');
    console.log('  • Make sure your local server is running on port 3000');
    console.log('  • Verify the session ID is correct (starts with cs_test_)');
    console.log('  • Check that your Stripe keys are configured correctly');
  }
}

processTestPayment();