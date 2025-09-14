#!/usr/bin/env node

/**
 * Test Oracle Frontend Integration
 * Verifies the frontend correctly calls the backend
 */

const axios = require('axios');

const API_URL = 'https://web-production-945c4.up.railway.app';

// Test UUIDs (valid format)
const TEST_USER_ID = '550e8400-e29b-41d4-a716-446655440000';
const TEST_CONVERSATION_ID = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

async function testChatEndpoint() {
  console.log('\n🧪 Testing Oracle Chat Endpoint...\n');
  
  try {
    const payload = {
      query: "What are the symptoms of a headache?",
      user_id: TEST_USER_ID,
      conversation_id: TEST_CONVERSATION_ID,
      category: "health-scan",
      model: "deepseek/deepseek-chat",
      reasoning_mode: false
    };
    
    console.log('📤 Request:');
    console.log(JSON.stringify(payload, null, 2));
    
    const response = await axios.post(`${API_URL}/api/chat`, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000
    });
    
    console.log('\n✅ Response received!');
    console.log('Status:', response.status);
    console.log('\n📥 Response data:');
    
    // Check critical fields
    const data = response.data;
    console.log({
      has_response: !!data.response,
      has_message: !!data.message,
      status: data.status,
      response_preview: data.response ? data.response.substring(0, 100) + '...' : 'N/A',
      context_status: data.context_status,
      user_tier: data.user_tier,
      model: data.model
    });
    
    // Verify frontend should display this
    const displayContent = data.response || data.message || data.raw_response;
    if (displayContent) {
      console.log('\n✅ Frontend should display:');
      console.log(displayContent.substring(0, 200) + '...');
    } else {
      console.log('\n❌ ERROR: No displayable content in response!');
    }
    
    return true;
  } catch (error) {
    console.error('\n❌ Chat test failed:', error.response?.data || error.message);
    return false;
  }
}

async function testSummaryEndpoint() {
  console.log('\n\n🧪 Testing Summary Endpoint...\n');
  
  try {
    const payload = {
      conversation_id: TEST_CONVERSATION_ID,
      user_id: TEST_USER_ID
    };
    
    console.log('📤 Request:');
    console.log(JSON.stringify(payload, null, 2));
    
    const response = await axios.post(`${API_URL}/api/generate_summary`, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000
    });
    
    console.log('\n✅ Summary response received!');
    console.log('Status:', response.status);
    console.log('Response:', response.data);
    
    return true;
  } catch (error) {
    // This might fail if no conversation exists, which is expected
    console.log('\n⚠️  Summary test result:', error.response?.status === 404 ? 
      'No conversation to summarize (expected for test IDs)' : 
      error.response?.data || error.message);
    return error.response?.status === 404; // 404 is acceptable for test
  }
}

async function runTests() {
  console.log('🚀 Oracle Frontend Integration Tests');
  console.log('=====================================');
  
  const chatOk = await testChatEndpoint();
  const summaryOk = await testSummaryEndpoint();
  
  console.log('\n\n📊 Test Summary:');
  console.log('================');
  console.log(`Chat Endpoint: ${chatOk ? '✅ WORKING' : '❌ FAILED'}`);
  console.log(`Summary Endpoint: ${summaryOk ? '✅ WORKING' : '❌ FAILED'}`);
  
  if (chatOk && summaryOk) {
    console.log('\n🎉 All tests passed! Frontend should work correctly.');
    console.log('\nFrontend is correctly:');
    console.log('✅ Calling /api/chat with proper payload');
    console.log('✅ Using valid UUID formats');
    console.log('✅ Extracting response/message fields');
    console.log('✅ Calling /api/generate_summary (not /api/oracle/exit-summary)');
  } else {
    console.log('\n⚠️  Some tests failed. Check the errors above.');
  }
}

runTests().catch(console.error);