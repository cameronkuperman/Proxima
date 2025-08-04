/**
 * SQL Injection Protection Test Suite
 * 
 * Run with: npm test src/tests/test-sql-injection.ts
 */

import { 
  sanitizeString, 
  sanitizeUUID, 
  sanitizeEmail,
  sanitizeNumber,
  sanitizeEnum,
  SafeQuery 
} from '@/utils/sql-protection';

// Common SQL injection payloads to test
const SQL_INJECTION_PAYLOADS = [
  "'; DROP TABLE users; --",
  "1' OR '1'='1",
  "admin'--",
  "1' UNION SELECT * FROM users--",
  "1'; DELETE FROM users WHERE '1'='1",
  "1' AND SLEEP(5)--",
  "1' AND BENCHMARK(1000000,MD5('test'))--",
  "<script>alert('XSS')</script>",
  "Robert'); DROP TABLE students;--",
  "' OR 1=1--",
  "\" OR 1=1--",
  "' OR 'a'='a",
  "') OR ('a'='a",
  "'; EXEC xp_cmdshell('dir'); --",
  "1' AND (SELECT COUNT(*) FROM users) > 0--",
];

// Test sanitizeString
console.log('Testing sanitizeString...');
SQL_INJECTION_PAYLOADS.forEach((payload, index) => {
  try {
    sanitizeString(payload, `test${index}`);
    console.error(`❌ FAILED: Payload ${index} was not blocked: ${payload}`);
  } catch (error) {
    console.log(`✅ PASSED: Payload ${index} was blocked`);
  }
});

// Test valid strings should pass
const validStrings = [
  'John Doe',
  'user@example.com',
  'This is a normal comment',
  'Product-123',
  'Search term with spaces',
];

console.log('\nTesting valid strings...');
validStrings.forEach((str) => {
  try {
    const result = sanitizeString(str, 'validString');
    console.log(`✅ PASSED: Valid string accepted: "${str}"`);
  } catch (error) {
    console.error(`❌ FAILED: Valid string rejected: "${str}"`);
  }
});

// Test UUID sanitization
console.log('\nTesting UUID sanitization...');
const invalidUUIDs = [
  "'; DROP TABLE users; --",
  "not-a-uuid",
  "12345",
  "g1234567-1234-1234-1234-123456789012", // Invalid character
];

invalidUUIDs.forEach((uuid) => {
  try {
    sanitizeUUID(uuid, 'testUUID');
    console.error(`❌ FAILED: Invalid UUID accepted: ${uuid}`);
  } catch (error) {
    console.log(`✅ PASSED: Invalid UUID rejected`);
  }
});

// Valid UUID should pass
try {
  const validUUID = '123e4567-e89b-12d3-a456-426614174000';
  sanitizeUUID(validUUID, 'validUUID');
  console.log(`✅ PASSED: Valid UUID accepted`);
} catch (error) {
  console.error(`❌ FAILED: Valid UUID rejected`);
}

// Test email sanitization
console.log('\nTesting email sanitization...');
const invalidEmails = [
  "admin'--@example.com",
  "user@example.com'; DROP TABLE users; --",
  "not-an-email",
  "<script>alert('xss')</script>@example.com",
];

invalidEmails.forEach((email) => {
  try {
    sanitizeEmail(email);
    console.error(`❌ FAILED: Invalid email accepted: ${email}`);
  } catch (error) {
    console.log(`✅ PASSED: Invalid email rejected`);
  }
});

// Test number sanitization
console.log('\nTesting number sanitization...');
try {
  sanitizeNumber('not-a-number', 'testNumber');
  console.error(`❌ FAILED: Non-number accepted`);
} catch (error) {
  console.log(`✅ PASSED: Non-number rejected`);
}

try {
  const num = sanitizeNumber('42', 'testNumber', 0, 100);
  console.log(`✅ PASSED: Valid number accepted: ${num}`);
} catch (error) {
  console.error(`❌ FAILED: Valid number rejected`);
}

// Test enum sanitization
console.log('\nTesting enum sanitization...');
const allowedTypes = ['quick_scan', 'deep_dive', 'photo_analysis'] as const;

try {
  sanitizeEnum("'; DROP TABLE users; --", allowedTypes, 'type');
  console.error(`❌ FAILED: SQL injection in enum accepted`);
} catch (error) {
  console.log(`✅ PASSED: SQL injection in enum rejected`);
}

try {
  const validType = sanitizeEnum('quick_scan', allowedTypes, 'type');
  console.log(`✅ PASSED: Valid enum value accepted: ${validType}`);
} catch (error) {
  console.error(`❌ FAILED: Valid enum rejected`);
}

// Test SafeQuery utilities
console.log('\nTesting SafeQuery utilities...');

// Test search query builder
try {
  const searchQuery = SafeQuery.buildSearchQuery("normal search term");
  console.log(`✅ PASSED: Search query built: ${searchQuery}`);
} catch (error) {
  console.error(`❌ FAILED: Search query builder failed`);
}

// Test with SQL injection in search
try {
  SafeQuery.buildSearchQuery("'; DROP TABLE users; --");
  console.error(`❌ FAILED: SQL injection in search accepted`);
} catch (error) {
  console.log(`✅ PASSED: SQL injection in search rejected`);
}

// Test date range
try {
  const range = SafeQuery.buildDateRange('2024-01-01', '2024-12-31');
  console.log(`✅ PASSED: Valid date range accepted`);
} catch (error) {
  console.error(`❌ FAILED: Valid date range rejected`);
}

// Test invalid date range
try {
  SafeQuery.buildDateRange('2024-12-31', '2024-01-01');
  console.error(`❌ FAILED: Invalid date range accepted`);
} catch (error) {
  console.log(`✅ PASSED: Invalid date range rejected`);
}

console.log('\n✨ SQL Injection Protection Test Suite Complete!');