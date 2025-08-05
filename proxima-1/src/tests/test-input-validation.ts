/**
 * Test script to verify input validation works correctly
 * Run with: npx tsx src/tests/test-input-validation.ts
 */

const API_BASE = 'http://localhost:3000/api';

interface TestCase {
  name: string;
  url?: string;
  method?: string;
  body?: any;
  expectedStatus: number;
  expectedError?: string;
}

const testCases: TestCase[] = [
  // Timeline GET - Valid cases
  {
    name: 'Timeline GET - Default parameters',
    url: `${API_BASE}/timeline`,
    expectedStatus: 401 // Unauthorized (but validation passes)
  },
  {
    name: 'Timeline GET - Valid limit and offset',
    url: `${API_BASE}/timeline?limit=20&offset=10`,
    expectedStatus: 401
  },
  {
    name: 'Timeline GET - Valid search',
    url: `${API_BASE}/timeline?search=headache&type=quick_scan`,
    expectedStatus: 401
  },
  
  // Timeline GET - Invalid cases
  {
    name: 'Timeline GET - Invalid limit (negative)',
    url: `${API_BASE}/timeline?limit=-5`,
    expectedStatus: 400,
    expectedError: 'limit: Number must be greater than or equal to 1'
  },
  {
    name: 'Timeline GET - Invalid limit (too high)',
    url: `${API_BASE}/timeline?limit=200`,
    expectedStatus: 400,
    expectedError: 'limit: Number must be less than or equal to 100'
  },
  {
    name: 'Timeline GET - Invalid limit (not a number)',
    url: `${API_BASE}/timeline?limit=abc`,
    expectedStatus: 400,
    expectedError: 'limit: Expected number, received nan'
  },
  {
    name: 'Timeline GET - Invalid offset (negative)',
    url: `${API_BASE}/timeline?offset=-10`,
    expectedStatus: 400,
    expectedError: 'offset: Number must be greater than or equal to 0'
  },
  {
    name: 'Timeline GET - Search too long',
    url: `${API_BASE}/timeline?search=${'a'.repeat(201)}`,
    expectedStatus: 400,
    expectedError: 'search: String must contain at most 200 character(s)'
  },
  
  // Timeline POST - Valid cases
  {
    name: 'Timeline POST - Valid quick_scan',
    url: `${API_BASE}/timeline`,
    method: 'POST',
    body: {
      interactionId: '123e4567-e89b-12d3-a456-426614174000',
      interactionType: 'quick_scan'
    },
    expectedStatus: 401 // Unauthorized (but validation passes)
  },
  {
    name: 'Timeline POST - Valid deep_dive',
    url: `${API_BASE}/timeline`,
    method: 'POST',
    body: {
      interactionId: '123e4567-e89b-12d3-a456-426614174000',
      interactionType: 'deep_dive'
    },
    expectedStatus: 401
  },
  
  // Timeline POST - Invalid cases
  {
    name: 'Timeline POST - Invalid UUID',
    url: `${API_BASE}/timeline`,
    method: 'POST',
    body: {
      interactionId: 'not-a-uuid',
      interactionType: 'quick_scan'
    },
    expectedStatus: 400,
    expectedError: 'interactionId: Invalid uuid'
  },
  {
    name: 'Timeline POST - Invalid interaction type',
    url: `${API_BASE}/timeline`,
    method: 'POST',
    body: {
      interactionId: '123e4567-e89b-12d3-a456-426614174000',
      interactionType: 'invalid_type'
    },
    expectedStatus: 400,
    expectedError: 'interactionType: Invalid enum value'
  },
  {
    name: 'Timeline POST - Missing fields',
    url: `${API_BASE}/timeline`,
    method: 'POST',
    body: {},
    expectedStatus: 400,
    expectedError: 'interactionId: Required'
  },
  {
    name: 'Timeline POST - SQL injection attempt',
    url: `${API_BASE}/timeline`,
    method: 'POST',
    body: {
      interactionId: '123e4567-e89b-12d3-a456-426614174000',
      interactionType: "quick_scan'; DROP TABLE users; --"
    },
    expectedStatus: 400,
    expectedError: 'interactionType: Invalid enum value'
  }
];

async function runTest(test: TestCase) {
  console.log(`\n🧪 ${test.name}`);
  
  try {
    const options: RequestInit = {
      method: test.method || 'GET',
      headers: test.body ? { 'Content-Type': 'application/json' } : undefined,
      body: test.body ? JSON.stringify(test.body) : undefined
    };
    
    const response = await fetch(test.url!, options);
    const data = await response.json();
    
    console.log(`   Status: ${response.status} ${response.status === test.expectedStatus ? '✅' : '❌'}`);
    
    if (response.status !== test.expectedStatus) {
      console.log(`   Expected: ${test.expectedStatus}`);
    }
    
    if (test.expectedError && data.error !== test.expectedError) {
      console.log(`   Error: "${data.error}" ${data.error === test.expectedError ? '✅' : '❌'}`);
      console.log(`   Expected: "${test.expectedError}"`);
    } else if (data.error) {
      console.log(`   Error: "${data.error}"`);
    }
    
    if (data.code) {
      console.log(`   Code: ${data.code}`);
    }
    
  } catch (error) {
    console.log(`   ❌ Request failed: ${error}`);
  }
}

async function runAllTests() {
  console.log('🔒 Input Validation Testing');
  console.log('===========================');
  console.log('Note: 401 errors are expected - we\'re testing validation, not auth');
  
  for (const test of testCases) {
    await runTest(test);
  }
  
  console.log('\n✅ Testing complete!');
  console.log('\nSummary:');
  console.log('- Valid inputs should return 401 (auth required)');
  console.log('- Invalid inputs should return 400 with specific error messages');
  console.log('- All SQL injection attempts should be blocked');
}

// Run tests
runAllTests().catch(console.error);