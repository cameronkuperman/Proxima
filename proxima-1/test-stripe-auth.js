// Test script to create a user and test Stripe checkout
const { createClient } = require('@supabase/supabase-js');

// Read environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testStripeIntegration() {
  console.log('=================================');
  console.log('STRIPE INTEGRATION TEST');
  console.log('=================================\n');

  const testEmail = 'stripe-test@example.com';
  const testPassword = 'StripeTest123!';

  try {
    // Step 1: Try to sign up a new user
    console.log('1. Creating test user...');
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Stripe Test User'
        }
      }
    });

    if (signUpError && signUpError.message !== 'User already registered') {
      console.error('Sign up error:', signUpError.message);
    } else if (signUpData?.user) {
      console.log('✓ User created:', signUpData.user.email);
    }

    // Step 2: Sign in
    console.log('\n2. Signing in...');
    const { data: signInData, error: signInError } = await supabase.auth.signIn({
      email: testEmail,
      password: testPassword,
    });

    if (signInError) {
      // Try the newer signInWithPassword method
      const { data: signInData2, error: signInError2 } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      });

      if (signInError2) {
        console.error('Sign in error:', signInError2.message);
        process.exit(1);
      }

      console.log('✓ Signed in successfully');
      console.log('User ID:', signInData2.user.id);
      console.log('Session:', signInData2.session ? 'Active' : 'None');

      // Get the session token
      if (signInData2.session) {
        const accessToken = signInData2.session.access_token;
        
        console.log('\n3. Testing checkout endpoint with authentication...');
        console.log('Access token (first 20 chars):', accessToken.substring(0, 20) + '...');
        
        // Test checkout with fetch
        const response = await fetch('http://localhost:3000/api/stripe/create-checkout-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
            'Cookie': `sb-access-token=${accessToken}; sb-refresh-token=${signInData2.session.refresh_token}`
          },
          body: JSON.stringify({
            tier: 'basic',
            billingCycle: 'monthly'
          })
        });

        const responseData = await response.json();
        console.log('\nCheckout Response Status:', response.status);
        console.log('Checkout Response:', JSON.stringify(responseData, null, 2));

        if (response.ok && responseData.url) {
          console.log('\n✓ SUCCESS! Checkout URL:', responseData.url);
          console.log('\nNext steps:');
          console.log('1. Open the URL above in a browser');
          console.log('2. Use test card: 4242 4242 4242 4242');
          console.log('3. Complete the checkout');
          console.log('4. Check webhook logs for subscription creation');
        }
      }
    } else {
      console.log('✓ Signed in successfully (legacy)');
      console.log('User:', signInData.user.email);
    }

  } catch (error) {
    console.error('Test failed:', error);
  }

  // Clean up
  await supabase.auth.signOut();
  console.log('\n✓ Test complete, signed out');
}

// Run the test
testStripeIntegration().catch(console.error);