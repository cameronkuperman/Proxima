/**
 * Test script to verify API error responses don't leak sensitive data
 * Run with: npx tsx src/tests/test-api-errors.ts
 */

const API_BASE = 'http://localhost:3000/api';

async function testEndpoint(name: string, url: string, options: RequestInit = {}) {
  console.log(`\n🧪 Testing ${name}...`);
  
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    
    console.log(`  Status: ${response.status}`);
    console.log(`  Response:`, JSON.stringify(data, null, 2));
    
    // Check for sensitive data leaks
    const sensitiveKeys = ['user_id', 'session_user_id', 'details', 'debug', 'stack', 'sql', 'password', 'email'];
    const foundLeaks = sensitiveKeys.filter(key => 
      JSON.stringify(data).toLowerCase().includes(key.toLowerCase())
    );
    
    if (foundLeaks.length > 0) {
      console.log(`  ❌ LEAK DETECTED: Found sensitive keys: ${foundLeaks.join(', ')}`);
    } else {
      console.log(`  ✅ No sensitive data found`);
    }
    
    // Check for proper error structure
    if (!response.ok && data.error && data.code) {
      console.log(`  ✅ Proper error structure (error + code)`);
    } else if (!response.ok) {
      console.log(`  ⚠️  Error response missing standard structure`);
    }
    
  } catch (error) {
    console.log(`  ❌ Request failed:`, error);
  }
}

async function runTests() {
  console.log('🔒 API Security Error Testing');
  console.log('==============================');
  
  // Test unauthorized access
  await testEndpoint('Timeline (unauthorized)', `${API_BASE}/timeline`);
  await testEndpoint('Test User (unauthorized)', `${API_BASE}/test-user`);
  
  // Test with invalid data
  await testEndpoint('Timeline (invalid params)', `${API_BASE}/timeline?limit=invalid`);
  
  // Test POST with missing data
  await testEndpoint('Timeline Validation (missing data)', `${API_BASE}/timeline`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });
  
  console.log('\n✅ Testing complete!');
  console.log('\nNote: This test runs without authentication.');
  console.log('All endpoints should return clean error messages without sensitive data.');
}

// Run tests
runTests().catch(console.error);