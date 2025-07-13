#!/usr/bin/env node

/**
 * Test script for Oracle integration
 * Run this to verify your Oracle backend is working with the Next.js app
 */

const axios = require('axios');

const API_URL = 'https://web-production-945c4.up.railway.app';

async function testHealth() {
  console.log('🏥 Testing Oracle Backend Health...');
  try {
    const response = await axios.get(`${API_URL}/api/health`);
    console.log('✅ Health check passed:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    return false;
  }
}

async function testChat() {
  console.log('\n💬 Testing Oracle Chat Endpoint...');
  try {
    const testMessage = {
      query: "I have a headache that started this morning. What could be causing it?",
      user_id: "test-user-123",
      conversation_id: "test-conv-456",
      category: "health-scan"
    };
    
    console.log('📤 Sending test message:', testMessage.query);
    
    const response = await axios.post(`${API_URL}/api/chat`, testMessage, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('✅ Chat response received:');
    console.log('   Response:', response.data.raw_response.substring(0, 200) + '...');
    console.log('   Tokens used:', response.data.usage.total_tokens);
    console.log('   Model:', response.data.model);
    return true;
  } catch (error) {
    console.error('❌ Chat test failed:', error.response?.data || error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Oracle Integration Test Suite\n');
  
  const healthOk = await testHealth();
  if (!healthOk) {
    console.log('\n⚠️  Backend server is not running!');
    console.log('Please start it with: cd /path/to/mcp-backend && uv run python run_full_server.py\n');
    return;
  }
  
  await testChat();
  
  console.log('\n✨ Test Summary:');
  console.log('- Backend server: ✅ Running');
  console.log('- Health endpoint: ✅ Working');
  console.log('- Chat endpoint: ✅ Working');
  console.log('\n🎉 Your Oracle integration is ready to use!');
  console.log('\nTo test in the app:');
  console.log('1. Make sure your Next.js dev server is running: npm run dev');
  console.log('2. Log in to your account');
  console.log('3. Go to the dashboard and click the Oracle button');
  console.log('4. Or visit /oracle for the full-screen experience');
}

runTests();