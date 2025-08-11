const Stripe = require('stripe');

// Load environment variables
require('dotenv').config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
});

async function setupStripeProducts() {
  try {
    console.log('🔐 Setting up Stripe products and prices...');

    // Create the product
    const product = await stripe.products.create({
      name: 'Real Estate Pro Tools - Pro Plan',
      description: 'Professional real estate calculation tools with unlimited calculations, client management, and advanced features for Portuguese market',
      url: 'https://realestateprotools.com',
      images: [], // Add product image URLs if you have them
      metadata: {
        app: 'real-estate-pro-tools',
        tier: 'pro',
        market: 'portugal',
      },
    });

    console.log('✅ Product created:', product.id);

    // Create monthly price
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
      },
    });

    console.log('✅ Monthly price created:', monthlyPrice.id);

    // Create annual price (optional for future use)
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
      },
    });

    console.log('✅ Annual price created:', annualPrice.id);

    // Output environment variables to set
    console.log('\n🔧 Add these to your .env file:');
    console.log(`STRIPE_PRO_MONTHLY_PRICE_ID=${monthlyPrice.id}`);
    console.log(`STRIPE_PRO_ANNUAL_PRICE_ID=${annualPrice.id}`);
    console.log(`STRIPE_PRODUCT_ID=${product.id}`);

    return {
      productId: product.id,
      monthlyPriceId: monthlyPrice.id,
      annualPriceId: annualPrice.id,
    };
  } catch (error) {
    console.error('❌ Error setting up Stripe products:', error.message);
    throw error;
  }
}

// Run the setup
if (require.main === module) {
  setupStripeProducts()
    .then((result) => {
      console.log('\n✅ Stripe setup complete!');
      console.log('Result:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Setup failed:', error);
      process.exit(1);
    });
}

module.exports = { setupStripeProducts };