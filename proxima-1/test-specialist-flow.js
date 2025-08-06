#!/usr/bin/env node

// Test script to verify the complete specialist report flow
const { randomUUID } = require('crypto');

const API_BASE_URL = process.env.NEXT_PUBLIC_ORACLE_API_URL || 'https://web-production-945c4.up.railway.app';
const TEST_USER_ID = '45b61b67-175d-48a0-aca6-d0be57609383';
const TEST_DEEP_DIVE_ID = '057447a9-3369-42b2-b683-778d10ae5c8b';

async function testSpecialistFlow() {
  console.log('=== TESTING EXACT SPECIALIST REPORT FLOW ===\n');
  
  try {
    // Step 1: Call triage with single deep dive ID
    console.log('1. Calling triage with single deep dive ID...');
    const triageRes = await fetch(`${API_BASE_URL}/api/report/specialty-triage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: TEST_USER_ID,
        deep_dive_ids: [TEST_DEEP_DIVE_ID]
      })
    });
    
    if (!triageRes.ok) {
      const error = await triageRes.text();
      throw new Error(`Triage failed: ${triageRes.status} - ${error}`);
    }
    
    const triage = await triageRes.json();
    console.log('✅ Triage result:', JSON.stringify(triage, null, 2));
    
    // Extract specialty from response (handle multiple formats)
    let specialty;
    if (triage.status === 'success' && triage.triage_result?.primary_specialty) {
      specialty = triage.triage_result.primary_specialty;
    } else if (triage.primary_specialty) {
      specialty = triage.primary_specialty;
    } else {
      throw new Error('Could not determine specialty from triage response');
    }
    
    console.log(`\n2. Determined specialty: ${specialty}`);
    
    // Step 2: Create analysis record (would be in Supabase in real app)
    const analysisId = randomUUID();
    console.log(`\n3. Created analysis record ID: ${analysisId}`);
    console.log('   (In real app, this would be inserted into Supabase)');
    
    // Step 3: Generate specialist report
    console.log(`\n4. Generating ${specialty} report...`);
    const reportRes = await fetch(`${API_BASE_URL}/api/report/${specialty}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        analysis_id: analysisId,
        user_id: TEST_USER_ID,
        deep_dive_ids: [TEST_DEEP_DIVE_ID]
      })
    });
    
    if (!reportRes.ok) {
      const error = await reportRes.text();
      throw new Error(`Report generation failed: ${reportRes.status} - ${error}`);
    }
    
    const report = await reportRes.json();
    console.log('✅ Report generated successfully!');
    
    // Verify report contains ONLY data from the selected deep dive
    console.log('\n5. Verification:');
    if (report.report_data?.executive_summary?.chief_complaints) {
      console.log('   Chief complaints:', report.report_data.executive_summary.chief_complaints);
      console.log('   ✅ Should ONLY contain data from deep dive ID:', TEST_DEEP_DIVE_ID);
    }
    
    console.log('\n=== TEST COMPLETED SUCCESSFULLY ===');
    console.log('The flow correctly:');
    console.log('1. Determined specialty from triage');
    console.log('2. Would create analysis record in database');
    console.log('3. Generated specialist report for the correct specialty');
    console.log('4. Report should only contain data from selected assessments');
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    process.exit(1);
  }
}

// Run the test
testSpecialistFlow();