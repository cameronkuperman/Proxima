/**
 * Verification script to test all API endpoints return objects, not strings
 * Run this after any backend updates to ensure proper response formats
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_ORACLE_API_URL || 'https://web-production-945c4.up.railway.app'

export const verifyApiResponses = {
  // Test Quick Scan endpoints
  async testQuickScan() {
    console.log('=== TESTING QUICK SCAN ENDPOINTS ===')
    
    // Test data
    const testData = {
      body_part: 'head',
      form_data: {
        symptoms: 'headache test',
        duration: '1 day',
        severity: 'mild'
      },
      user_id: 'test-user'
    }

    try {
      // Test Quick Scan
      const scanResponse = await fetch(`${API_BASE_URL}/api/quick-scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData)
      })
      
      const scanData = await scanResponse.json()
      console.log('Quick Scan Response:')
      console.log('- Analysis is object?', typeof scanData.analysis === 'object')
      console.log('- Confidence is number?', typeof scanData.analysis.confidence === 'number')
      console.log('- Primary condition:', scanData.analysis.primaryCondition)
      
      // Test Think Harder
      if (scanData.scan_id) {
        const thinkResponse = await fetch(`${API_BASE_URL}/api/quick-scan/think-harder-o4`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scan_id: scanData.scan_id,
            user_id: 'test-user'
          })
        })
        
        const thinkData = await thinkResponse.json()
        console.log('\nThink Harder Response:')
        console.log('- Enhanced analysis is object?', typeof thinkData.enhanced_analysis === 'object')
        console.log('- Confidence is number?', typeof thinkData.enhanced_analysis.confidence === 'number')
      }
      
    } catch (error) {
      console.error('Quick Scan test failed:', error)
    }
  },

  // Test Deep Dive endpoints
  async testDeepDive() {
    console.log('\n=== TESTING DEEP DIVE ENDPOINTS ===')
    
    const testData = {
      body_part: 'chest',
      form_data: {
        symptoms: 'chest pain test',
        duration: '2 days',
        severity: 'moderate'
      },
      user_id: 'test-user',
      model: 'deepseek/deepseek-chat'
    }

    try {
      // Start Deep Dive
      const startResponse = await fetch(`${API_BASE_URL}/api/deep-dive/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData)
      })
      
      const startData = await startResponse.json()
      console.log('Deep Dive Start Response:')
      console.log('- Session ID:', startData.session_id)
      console.log('- Question type:', typeof startData.question)
      
      if (startData.session_id) {
        // Test Continue
        const continueResponse = await fetch(`${API_BASE_URL}/api/deep-dive/continue`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: startData.session_id,
            answer: 'Sharp pain, worse with breathing',
            question_number: 1,
            fallback_model: 'deepseek/deepseek-chat'
          })
        })
        
        const continueData = await continueResponse.json()
        console.log('\nDeep Dive Continue Response:')
        console.log('- Next question type:', typeof continueData.question)
        console.log('- Ready for analysis?', continueData.ready_for_analysis)
        
        // Test Complete
        const completeResponse = await fetch(`${API_BASE_URL}/api/deep-dive/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: startData.session_id,
            final_answer: 'No other symptoms',
            fallback_model: 'deepseek/deepseek-chat'
          })
        })
        
        const completeData = await completeResponse.json()
        console.log('\nDeep Dive Complete Response:')
        console.log('- Analysis is object?', typeof completeData.analysis === 'object')
        console.log('- Confidence is number?', typeof completeData.analysis.confidence === 'number')
        console.log('- Primary condition:', completeData.analysis.primaryCondition)
        console.log('- Contains real medical terms?', !completeData.analysis.primaryCondition.includes('Analysis of'))
        
        // Test Ultra Think
        const ultraResponse = await fetch(`${API_BASE_URL}/api/deep-dive/ultra-think`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: startData.session_id,
            user_id: 'test-user'
          })
        })
        
        const ultraData = await ultraResponse.json()
        console.log('\nUltra Think Response:')
        console.log('- Ultra analysis is object?', typeof ultraData.ultra_analysis === 'object')
        console.log('- Has critical insights?', Array.isArray(ultraData.critical_insights))
      }
      
    } catch (error) {
      console.error('Deep Dive test failed:', error)
    }
  },

  // Run all tests
  async runAllTests() {
    console.log('Starting API Response Verification...\n')
    await this.testQuickScan()
    await this.testDeepDive()
    console.log('\n✅ Verification Complete!')
    console.log('If all "is object?" checks are true, the frontend is receiving proper object responses.')
  }
}

// Example usage:
// import { verifyApiResponses } from '@/utils/verify-api-responses'
// await verifyApiResponses.runAllTests()