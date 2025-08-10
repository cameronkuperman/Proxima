// Test script to manually check what's wrong with the webhook
// Run this with: node test-webhook.js

const testWebhook = async () => {
  // This is a simplified webhook payload based on your Stripe event
  const payload = {
    id: 'evt_test_webhook',
    object: 'event',
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_test_123',
        object: 'checkout.session',
        client_reference_id: '7fbd24c7-3853-4bd1-9c94-1f41387ee472',
        customer: 'cus_test123',
        customer_email: 'test@example.com',
        mode: 'subscription',
        payment_status: 'paid',
        status: 'complete',
        subscription: 'sub_test123',
        metadata: {
          user_id: '7fbd24c7-3853-4bd1-9c94-1f41387ee472',
          tier: 'basic',
          billing_cycle: 'monthly'
        }
      }
    }
  };

  try {
    const response = await fetch('https://www.seimeo.com/api/stripe/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 'test_signature'
      },
      body: JSON.stringify(payload)
    });

    const text = await response.text();
    console.log('Status:', response.status);
    console.log('Response:', text);
    
    if (!response.ok) {
      console.error('Webhook failed with status:', response.status);
    }
  } catch (error) {
    console.error('Error calling webhook:', error);
  }
};

testWebhook();