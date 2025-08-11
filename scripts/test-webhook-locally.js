require('dotenv').config();

const testWebhookEndpoint = async () => {
  console.log('🧪 Testing webhook endpoint locally...');
  
  // Create a mock Stripe event
  const mockEvent = {
    id: 'evt_test_123',
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_test_123',
        mode: 'subscription',
        customer: 'cus_test_123',
        subscription: 'sub_test_123',
        client_reference_id: 'user_test_123',
        amount_total: 999,
        currency: 'eur',
        payment_intent: 'pi_test_123',
        metadata: {
          userId: 'user_test_123'
        }
      }
    }
  };

  try {
    const response = await fetch('http://localhost:3000/api/webhooks/stripe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 'test_signature' // This will fail verification, but we can test the endpoint
      },
      body: JSON.stringify(mockEvent)
    });

    console.log('Response status:', response.status);
    const responseText = await response.text();
    console.log('Response body:', responseText);
    
    if (response.status === 400 && responseText.includes('signature')) {
      console.log('✅ Webhook endpoint is accessible and signature verification is working');
      return true;
    } else {
      console.log('❌ Unexpected response from webhook endpoint');
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing webhook endpoint:', error.message);
    return false;
  }
};

const main = async () => {
  console.log('🔍 Webhook Testing and Setup Guide\n');
  
  // Test if local server is running
  console.log('1. Testing if local server is running...');
  await testWebhookEndpoint();
  
  console.log('\n📋 Next Steps for Complete Webhook Setup:');
  console.log('\n🔧 OPTION 1: Local Development with Stripe CLI (Recommended)');
  console.log('   1. Install Stripe CLI: https://stripe.com/docs/stripe-cli');
  console.log('   2. Run: stripe login');
  console.log('   3. Run: stripe listen --forward-to localhost:3000/api/webhooks/stripe');
  console.log('   4. Copy the webhook signing secret from CLI output');
  console.log('   5. Update STRIPE_WEBHOOK_SECRET in your .env file');
  console.log('   6. Make a test payment - you should see webhook events in CLI');
  
  console.log('\n🌐 OPTION 2: Production Webhook Setup');
  console.log('   1. Deploy your app to production (Vercel, etc.)');
  console.log('   2. Go to https://dashboard.stripe.com/webhooks');
  console.log('   3. Add endpoint: https://your-domain.com/api/webhooks/stripe');
  console.log('   4. Select events: checkout.session.completed, customer.subscription.*');
  console.log('   5. Copy signing secret to production environment');
  
  console.log('\n🔍 Debugging Tips:');
  console.log('   • Check server logs during test payments');
  console.log('   • Verify STRIPE_WEBHOOK_SECRET matches exactly');
  console.log('   • Ensure your server is accessible from Stripe');
  console.log('   • Use `stripe events resend evt_xxx` to replay events');
  
  console.log('\n💡 Current Webhook Secret:', process.env.STRIPE_WEBHOOK_SECRET ? '✅ Set' : '❌ Missing');
};

main();