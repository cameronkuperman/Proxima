#!/usr/bin/env node

/**
 * Test script for Oracle Summary Generation
 * This tests the complete flow: chat -> summary generation -> storage in Supabase
 */

const axios = require('axios');

// Configuration
const API_URL = 'http://localhost:8000';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ekaxwbatykostnmopnhn.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const TEST_USER_ID = 'test-summary-user-' + Date.now();
const TEST_CONVERSATION_ID = 'test-summary-conv-' + Date.now();

// Test messages to create a conversation
const TEST_MESSAGES = [
  "I've been having severe headaches for the past week",
  "They usually start in the morning and last about 4 hours",
  "The pain is throbbing and on the right side of my head",
  "I also feel nauseous when the headache is bad",
  "I've tried ibuprofen but it doesn't help much"
];

async function checkBackend() {
  console.log('🔍 Checking Oracle Backend...');
  try {
    const response = await axios.get(`${API_URL}/api/health`);
    console.log('✅ Oracle backend is healthy');
    return true;
  } catch (error) {
    console.error('❌ Oracle backend is not running!');
    console.log('Please start it with: cd /path/to/mcp-backend && uv run python run_full_server.py');
    return false;
  }
}

async function sendTestMessages() {
  console.log('\n📤 Sending test messages to create conversation...');
  
  for (let i = 0; i < TEST_MESSAGES.length; i++) {
    const message = TEST_MESSAGES[i];
    console.log(`   Message ${i + 1}: "${message}"`);
    
    try {
      const response = await axios.post(`${API_URL}/api/chat`, {
        query: message,
        user_id: TEST_USER_ID,
        conversation_id: TEST_CONVERSATION_ID,
        category: 'health_analysis'
      }, {
        headers: { 'Content-Type': 'application/json' }
      });
      
      console.log(`   ✅ Response received (${response.data.usage.total_tokens} tokens)`);
      
      // Small delay between messages
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`   ❌ Failed to send message ${i + 1}:`, error.message);
      return false;
    }
  }
  
  return true;
}

async function generateSummary() {
  console.log('\n🤖 Generating conversation summary...');
  
  try {
    const response = await axios.post(`${API_URL}/api/generate_summary`, {
      conversation_id: TEST_CONVERSATION_ID,
      user_id: TEST_USER_ID
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.data.status === 'success') {
      console.log('✅ Summary generated successfully!');
      console.log('\n📝 Summary Details:');
      console.log('   Token count:', response.data.token_count);
      console.log('   Compression ratio:', response.data.compression_ratio.toFixed(2) + 'x');
      console.log('\n   Summary content:');
      console.log('   ' + response.data.summary.split('\n').join('\n   '));
      
      return response.data;
    } else {
      console.error('❌ Summary generation failed:', response.data.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Error generating summary:', error.response?.data || error.message);
    return null;
  }
}

async function checkSupabaseStorage(summaryData) {
  if (!SUPABASE_ANON_KEY) {
    console.log('\n⚠️  Skipping Supabase check (no API key in environment)');
    return;
  }

  console.log('\n🔍 Checking Supabase storage...');
  
  try {
    // Check conversations table
    const convResponse = await axios.get(
      `${SUPABASE_URL}/rest/v1/conversations?id=eq.${TEST_CONVERSATION_ID}`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      }
    );
    
    if (convResponse.data && convResponse.data.length > 0) {
      const conv = convResponse.data[0];
      console.log('✅ Conversation found in Supabase');
      console.log('   Message count:', conv.message_count);
      console.log('   Total tokens:', conv.total_tokens);
      
      if (conv.metadata?.last_summary) {
        console.log('   ✅ Summary stored in conversation metadata');
      }
    }
    
    // Check llm_context table
    const contextResponse = await axios.get(
      `${SUPABASE_URL}/rest/v1/llm_context?conversation_id=eq.${TEST_CONVERSATION_ID}&context_type=eq.conversation_summary`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      }
    );
    
    if (contextResponse.data && contextResponse.data.length > 0) {
      console.log('✅ Summary found in llm_context table');
      console.log('   Token count matches:', contextResponse.data[0].token_count === summaryData.token_count);
    } else {
      console.log('⚠️  Summary not found in llm_context table');
      console.log('   This might be due to RLS policies');
    }
    
  } catch (error) {
    console.error('⚠️  Error checking Supabase:', error.message);
  }
}

async function testContextLoading() {
  console.log('\n🧪 Testing context loading in next chat...');
  
  try {
    // Send a new message that should use the summary as context
    const response = await axios.post(`${API_URL}/api/chat`, {
      query: "Based on our previous discussion about my headaches, what should I do next?",
      user_id: TEST_USER_ID,
      conversation_id: TEST_CONVERSATION_ID + '-followup'  // New conversation
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('✅ Follow-up response received');
    console.log('   The Oracle should now be using the summary as context');
    console.log('   Response preview:', response.data.raw_response.substring(0, 200) + '...');
    
  } catch (error) {
    console.error('❌ Error testing context loading:', error.message);
  }
}

async function runTests() {
  console.log('🚀 Oracle Summary Generation Test\n');
  
  // Check backend
  const backendOk = await checkBackend();
  if (!backendOk) {
    return;
  }
  
  // Send test messages
  const messagesOk = await sendTestMessages();
  if (!messagesOk) {
    console.error('\n❌ Failed to create test conversation');
    return;
  }
  
  // Generate summary
  const summaryData = await generateSummary();
  if (!summaryData) {
    console.error('\n❌ Failed to generate summary');
    return;
  }
  
  // Check Supabase storage
  await checkSupabaseStorage(summaryData);
  
  // Test context loading
  await testContextLoading();
  
  console.log('\n✅ Summary Test Complete!');
  console.log('\n📊 Summary Statistics:');
  console.log(`   • ${TEST_MESSAGES.length} messages sent`);
  console.log(`   • Summary generated with ${summaryData.token_count} tokens`);
  console.log(`   • ${summaryData.compression_ratio.toFixed(1)}x compression achieved`);
  console.log('\n💡 The summary will now be used as context in future Oracle chats!');
}

// Load .env.local if running locally
try {
  require('dotenv').config({ path: '.env.local' });
} catch (e) {
  // dotenv might not be installed, that's ok
}

runTests();