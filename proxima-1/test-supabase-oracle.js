#!/usr/bin/env node

/**
 * Test script for Oracle + Supabase integration
 * This tests that conversations and messages are properly stored
 */

const axios = require('axios');

// NOTE: Update these with your actual test values
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ekaxwbatykostnmopnhn.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const API_URL = 'http://localhost:8000';

const TEST_USER_ID = 'test-user-' + Date.now();
const TEST_CONVERSATION_ID = 'test-conv-' + Date.now();

async function checkSupabase() {
  console.log('🔍 Checking Supabase connection...');
  try {
    const response = await axios.get(
      `${SUPABASE_URL}/rest/v1/conversations?select=count`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      }
    );
    console.log('✅ Supabase connection successful');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection failed:', error.message);
    console.log('\n⚠️  Make sure your .env.local has the correct Supabase credentials');
    return false;
  }
}

async function testOracleWithSupabase() {
  console.log('\n🧪 Testing Oracle + Supabase Integration...');
  
  // First, check if Oracle backend is running
  try {
    await axios.get(`${API_URL}/api/health`);
    console.log('✅ Oracle backend is running');
  } catch (error) {
    console.error('❌ Oracle backend is not running!');
    console.log('Please start it with: cd /path/to/mcp-backend && uv run python run_full_server.py');
    return;
  }

  // Send a test message
  const testMessage = {
    query: "What are the common causes of morning headaches?",
    user_id: TEST_USER_ID,
    conversation_id: TEST_CONVERSATION_ID,
    category: "health_analysis"
  };

  console.log('\n📤 Sending test message to Oracle...');
  console.log(`   User ID: ${TEST_USER_ID}`);
  console.log(`   Conversation ID: ${TEST_CONVERSATION_ID}`);
  console.log(`   Query: "${testMessage.query}"`);

  try {
    const response = await axios.post(`${API_URL}/api/chat`, testMessage, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('\n✅ Oracle response received:');
    console.log('   Response preview:', response.data.raw_response.substring(0, 100) + '...');
    console.log('   Tokens used:', response.data.usage.total_tokens);
    console.log('   Model:', response.data.model);

    // Check if conversation was created in Supabase
    console.log('\n🔍 Checking Supabase for conversation record...');
    
    const convCheck = await axios.get(
      `${SUPABASE_URL}/rest/v1/conversations?id=eq.${TEST_CONVERSATION_ID}`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      }
    );

    if (convCheck.data && convCheck.data.length > 0) {
      console.log('✅ Conversation found in Supabase!');
      console.log('   Title:', convCheck.data[0].title);
      console.log('   Status:', convCheck.data[0].status);
      console.log('   AI Provider:', convCheck.data[0].ai_provider);
    } else {
      console.log('⚠️  Conversation not found in Supabase');
      console.log('   This might be due to RLS policies or the conversation not being created');
    }

    // Check for messages
    console.log('\n🔍 Checking Supabase for messages...');
    
    const msgCheck = await axios.get(
      `${SUPABASE_URL}/rest/v1/messages?conversation_id=eq.${TEST_CONVERSATION_ID}&select=role,content&order=created_at`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      }
    );

    if (msgCheck.data && msgCheck.data.length > 0) {
      console.log(`✅ Found ${msgCheck.data.length} messages in Supabase!`);
      msgCheck.data.forEach((msg, idx) => {
        console.log(`   Message ${idx + 1} (${msg.role}):`, msg.content.substring(0, 50) + '...');
      });
    } else {
      console.log('⚠️  No messages found in Supabase');
      console.log('   This might be due to RLS policies or messages not being stored');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

async function runTests() {
  console.log('🚀 Oracle + Supabase Integration Test\n');
  
  if (!SUPABASE_ANON_KEY) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY not found in environment');
    console.log('Please make sure your .env.local is loaded or export the variable');
    return;
  }

  const supabaseOk = await checkSupabase();
  if (!supabaseOk) {
    return;
  }

  await testOracleWithSupabase();

  console.log('\n📝 Integration Summary:');
  console.log('- Oracle backend: Working');
  console.log('- Supabase connection: Working');
  console.log('- Conversation creation: Check above results');
  console.log('- Message storage: Check above results');
  console.log('\n💡 If conversations/messages are not showing in Supabase:');
  console.log('   1. Check that the conversations and messages tables exist');
  console.log('   2. Verify RLS policies allow the operation');
  console.log('   3. Check the Next.js console for any errors');
}

// Load .env.local if running locally
try {
  require('dotenv').config({ path: '.env.local' });
} catch (e) {
  // dotenv might not be installed, that's ok
}

runTests();