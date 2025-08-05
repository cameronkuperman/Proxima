/**
 * Test script for security headers
 * Run with: node test-security-headers.js
 */

const https = require('https');
const http = require('http');

async function checkHeaders(url) {
  console.log(`\n🔍 Checking security headers for: ${url}\n`);
  
  return new Promise((resolve) => {
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, (res) => {
      console.log('Status:', res.statusCode);
      console.log('\nSecurity Headers Found:');
      console.log('========================');
      
      const securityHeaders = [
        'x-frame-options',
        'x-content-type-options',
        'strict-transport-security',
        'content-security-policy',
        'referrer-policy',
        'permissions-policy',
        'access-control-allow-origin'
      ];
      
      let foundCount = 0;
      
      securityHeaders.forEach(header => {
        const value = res.headers[header];
        if (value) {
          console.log(`✅ ${header}: ${value.substring(0, 100)}${value.length > 100 ? '...' : ''}`);
          foundCount++;
        } else {
          console.log(`❌ ${header}: Not found`);
        }
      });
      
      console.log(`\n📊 Score: ${foundCount}/${securityHeaders.length} security headers implemented`);
      
      // Check if CSP allows required resources
      const csp = res.headers['content-security-policy'];
      if (csp) {
        console.log('\n🔍 CSP Analysis:');
        console.log('================');
        if (csp.includes('human.biodigital.com')) {
          console.log('✅ BioDigital iframe allowed');
        }
        if (csp.includes('supabase.co')) {
          console.log('✅ Supabase connections allowed');
        }
        if (csp.includes('railway.app')) {
          console.log('✅ Backend API allowed');
        }
        if (csp.includes("'unsafe-inline'")) {
          console.log('⚠️  Unsafe inline scripts allowed (needed for Next.js)');
        }
      }
      
      resolve();
    }).on('error', (err) => {
      console.error('Error:', err.message);
      resolve();
    });
  });
}

async function runTests() {
  console.log('🛡️  Security Headers Test\n');
  console.log('First, make sure your dev server is running: npm run dev\n');
  
  // Test local development
  await checkHeaders('http://localhost:3000');
  
  // Test API endpoint
  await checkHeaders('http://localhost:3000/api/test-rate-limit');
  
  console.log('\n📝 Notes:');
  console.log('- HSTS header only appears in production');
  console.log('- CORS headers only appear on /api/* routes');
  console.log('- Update Access-Control-Allow-Origin in next.config.ts with your production domain');
  
  console.log('\n✅ If all critical headers are present, your security headers are working!');
}

runTests().catch(console.error);