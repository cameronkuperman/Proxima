// Run this in browser console to debug Ask Me More

async function debugAskMore(sessionId) {
  const API_URL = process.env.NEXT_PUBLIC_ORACLE_API_URL || 'https://web-production-945c4.up.railway.app';
  
  console.log('🔍 Testing Ask Me More for session:', sessionId);
  
  // Test 1: Try the actual ask-more endpoint
  console.log('\n📡 Test 1: Calling ask-more endpoint...');
  try {
    const response = await fetch(`${API_URL}/api/deep-dive/ask-more`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        current_confidence: 85,
        target_confidence: 90,
        user_id: '45b61b67-175d-48a0-aca6-d0be57609383', // Your user ID
        max_questions: 5
      })
    });
    
    const data = await response.json();
    console.log('Response:', data);
    
    if (data.error && data.error.includes('NoneType')) {
      console.error('❌ Backend cannot find session data!');
      console.log('The session might be:');
      console.log('1. Not saved to database');
      console.log('2. Marked as "completed" instead of "analysis_ready"');
      console.log('3. Missing required fields (initial_questions_count)');
    }
  } catch (error) {
    console.error('❌ Request failed:', error);
  }
  
  // Test 2: Check if we can get session info (if backend has debug endpoint)
  console.log('\n📡 Test 2: Checking session existence...');
  try {
    const debugResponse = await fetch(`${API_URL}/api/debug/session/${sessionId}`);
    if (debugResponse.ok) {
      const debugData = await debugResponse.json();
      console.log('Session debug info:', debugData);
    } else {
      console.log('No debug endpoint available');
    }
  } catch (error) {
    console.log('Debug endpoint not implemented');
  }
  
  console.log('\n📋 Backend should check:');
  console.log(`
  SELECT * FROM deep_dive_sessions WHERE id = '${sessionId}';
  
  Check if:
  - Record exists
  - status = 'analysis_ready' (not 'completed')
  - initial_questions_count is set
  - questions and answers fields exist
  `);
}

// Usage: Copy session ID from console and run:
// debugAskMore('96099af5-35bf-451f-9733-9c728c642802')