const { randomUUID } = require('crypto');

const API_BASE_URL = 'https://web-production-945c4.up.railway.app';
const USER_ID = '323ce656-8d89-46ac-bea1-a6382cc86ce9';
const QUICK_SCAN_ID = '01398d26-9974-482e-867a-5e840ca67679';

async function testFullFlow() {
  console.log('=== TESTING COMPLETE SPECIALIST FLOW ===\n');
  
  try {
    // Step 1: Triage
    console.log('1. Running triage...');
    const triageRes = await fetch(`${API_BASE_URL}/api/report/specialty-triage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: USER_ID,
        quick_scan_ids: [QUICK_SCAN_ID]
      })
    });
    
    const triage = await triageRes.json();
    const specialty = triage.triage_result?.primary_specialty || triage.primary_specialty;
    console.log(`Triage determined: ${specialty}\n`);
    
    // Step 2: Create analysis ID (frontend would save to Supabase)
    const analysisId = randomUUID();
    console.log(`2. Created analysis ID: ${analysisId}`);
    console.log('   (Frontend saves this to Supabase)\n');
    
    // Step 3: Generate report
    console.log(`3. Generating ${specialty} report...`);
    const reportRes = await fetch(`${API_BASE_URL}/api/report/${specialty}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        analysis_id: analysisId,
        user_id: USER_ID,
        specialty: specialty,
        quick_scan_ids: [QUICK_SCAN_ID]
      })
    });
    
    const report = await reportRes.json();
    
    if (report.error) {
      console.log('Error from backend:', report.error);
      console.log('\nThis likely means the backend needs the analysis record to exist.');
      console.log('The frontend creates it, but we cannot from this test script.\n');
    } else {
      console.log('Report generated!\n');
      console.log('Report structure:');
      console.log('- report_type:', report.report_type);
      console.log('- specialty field:', report.specialty || 'NOT PRESENT (ISSUE)');
      console.log('- has report_data:', Boolean(report.report_data));
      
      if (!report.specialty) {
        console.log('\nISSUE: Backend is not returning specialty field!');
        console.log('This is why the UI shows "Specialist Consultation Report"');
        console.log('instead of the actual specialty like "Urology Consultation Report"');
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testFullFlow();
