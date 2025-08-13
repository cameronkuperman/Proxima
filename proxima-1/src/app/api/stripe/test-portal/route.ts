import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function GET(req: NextRequest) {
  console.log('=== TEST STRIPE PORTAL ===');
  
  try {
    // Test 1: Check if Stripe is initialized
    console.log('Stripe initialized:', !!stripe);
    
    // Test 2: Try to retrieve portal configuration
    try {
      const configs = await stripe().billingPortal.configurations.list({ limit: 1 });
      console.log('Portal configurations found:', configs.data.length);
      
      if (configs.data.length === 0) {
        // Try to create a default configuration
        console.log('No portal config found, creating default...');
        const config = await stripe().billingPortal.configurations.create({
          business_profile: {
            headline: 'Manage your Seimeo subscription',
          },
          features: {
            customer_update: {
              enabled: true,
              allowed_updates: ['email', 'tax_id'],
            },
            invoice_history: {
              enabled: true,
            },
            payment_method_update: {
              enabled: true,
            },
            subscription_cancel: {
              enabled: false, // Disabled - we handle cancellation in our app with custom feedback
            },
            subscription_update: {
              enabled: true,
              default_allowed_updates: ['price', 'quantity'],
              proration_behavior: 'always_invoice',
              products: [
                {
                  product: process.env.STRIPE_PRODUCT_ID!, // You'll need to add this env var
                  prices: [
                    process.env.STRIPE_PRICE_BASIC_MONTHLY!,
                    process.env.STRIPE_PRICE_PRO_MONTHLY!,
                    process.env.STRIPE_PRICE_BUSINESS_MONTHLY!,
                  ].filter(Boolean),
                },
              ] as any[],
            },
          },
        });
        
        console.log('Created portal configuration:', config.id);
      }
    } catch (configError: any) {
      console.error('Portal config error:', configError.message);
    }
    
    // Test 3: Try to create a test session
    const testCustomerId = 'cus_SqCxOR1Uc7BEAR'; // Your actual customer ID from the data
    
    try {
      const session = await stripe().billingPortal.sessions.create({
        customer: testCustomerId,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription`,
      });
      
      console.log('Test session created successfully:', session.url);
      
      return NextResponse.json({
        success: true,
        message: 'Portal is working',
        portal_url: session.url,
        test_customer: testCustomerId,
      });
      
    } catch (sessionError: any) {
      console.error('Session creation error:', sessionError);
      
      return NextResponse.json({
        success: false,
        message: 'Failed to create portal session',
        error: sessionError.message,
        type: sessionError.type,
        statusCode: sessionError.statusCode,
        test_customer: testCustomerId,
      });
    }
    
  } catch (error: any) {
    console.error('Test portal error:', error);
    return NextResponse.json(
      { 
        error: error.message,
        details: error.type,
      },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';