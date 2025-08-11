const Stripe = require('stripe');
require('dotenv').config();

// Use the test key from your .env file
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
});

async function setupTestProducts() {
  try {
    console.log('🔐 Setting up TEST mode Stripe products...');

    // Create test product
    const product = await stripe.products.create({
      name: 'Real Estate Pro Tools - Pro Plan (TEST)',
      description: 'TEST MODE: Professional real estate calculation tools with unlimited calculations, client management, and advanced features for Portuguese market',
      metadata: {
        app: 'real-estate-pro-tools',
        tier: 'pro',
        market: 'portugal',
        mode: 'test',
      },
    });

    console.log('✅ Test Product created:', product.id);

    // Create monthly test price
    const monthlyPrice = await stripe.prices.create({
      product: product.id,
      unit_amount: 999, // €9.99 in cents
      currency: 'eur',
      recurring: {
        interval: 'month',
      },
      metadata: {
        tier: 'pro',
        billing_cycle: 'monthly',
        mode: 'test',
      },
    });

    console.log('✅ Test Monthly price created:', monthlyPrice.id);

    // Create annual test price
    const annualPrice = await stripe.prices.create({
      product: product.id,
      unit_amount: 9600, // €96.00 per year (20% discount)
      currency: 'eur',
      recurring: {
        interval: 'year',
      },
      metadata: {
        tier: 'pro',
        billing_cycle: 'annual',
        discount_percentage: '20',
        mode: 'test',
      },
    });

    console.log('✅ Test Annual price created:', annualPrice.id);

    console.log('\n🔧 Update your client-side configuration with these TEST price IDs:');
    console.log(`Monthly: ${monthlyPrice.id}`);
    console.log(`Annual: ${annualPrice.id}`);

    return {
      productId: product.id,
      monthlyPriceId: monthlyPrice.id,
      annualPriceId: annualPrice.id,
    };
  } catch (error) {
    console.error('❌ Error setting up test products:', error);
    throw error;
  }
}

setupTestProducts()
  .then((result) => {
    console.log('\n✅ Test Stripe setup complete!');
    console.log('Result:', result);
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Setup failed:', error);
    process.exit(1);
  });