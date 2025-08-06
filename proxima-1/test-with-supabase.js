const { randomUUID } = require('crypto');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dhwjtriqwewsygtaqpcb.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRod2p0cmlxd2V3c3lndGFxcGNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjY1MjUxNTksImV4cCI6MjA0MjEwMTE1OX0.vHiIBgEh_7sEhCvJYG7N0J7mVQkxAjLSOC1htIpQAAc';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const API_BASE_URL = 'https://web-production-945c4.up.railway.app';
const USER_ID = '323ce656-8d89-46ac-bea1-a6382cc86ce9';
const QUICK_SCAN_ID = '01398d26-9974-482e-867a-5e840ca67679';

async function testWithSupabase() {
  console.log('=== TESTING WITH SUPABASE INTEGRATION ===\n');
  
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
    console.log(`✅ Triage determined: ${specialty}\n`);
    
    // Step 2: Create analysis record in Supabase
    const analysisId = randomUUID();
    console.log(`2. Creating analysis record in Supabase...`);
    console.log(`   ID: ${analysisId}`);
    
    const { data: analysisData, error: dbError } = await supabase
      .from('report_analyses')
      .insert({
        id: analysisId,
        user_id: USER_ID,
        created_at: new Date().toISOString(),
        purpose: 'Specialist report test',
        recommended_type: specialty,
        confidence: triage.triage_result?.confidence || 0.8,
        quick_scan_ids: [QUICK_SCAN_ID]
      })
      .select()
      .single();
    
    if (dbError) {
      console.error('❌ Failed to create analysis record:', dbError);
      return;
    }
    
    console.log('✅ Analysis record created in Supabase\n');
    
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
      console.log('❌ Error from backend:', report.error);
    } else {
      console.log('✅ Report generated!\n');
      console.log('📊 Report Analysis:');
      console.log('  - report_type:', report.report_type);
      console.log('  - specialty field:', report.specialty || '❌ NOT PRESENT - THIS IS THE ISSUE!');
      console.log('  - has report_data:', !!report.report_data);
      
      if (!report.specialty) {
        console.log('\n⚠️  CRITICAL ISSUE FOUND:');
        console.log('The backend is NOT returning the specialty field!');
        console.log('This causes the UI to show "Specialist Consultation Report"');
        console.log(`instead of "${specialty.charAt(0).toUpperCase() + specialty.slice(1)} Consultation Report"`);
        console.log('\nBackend needs to add: "specialty": "' + specialty + '" to the response');
      } else {
        console.log('\n✅ SUCCESS! The specialty field is now present!');
        console.log(`The UI will correctly show: "${report.specialty.charAt(0).toUpperCase() + report.specialty.slice(1)} Consultation Report"`);
      }
    }
    
    // Cleanup
    console.log('\n4. Cleaning up test data...');
    await supabase.from('report_analyses').delete().eq('id', analysisId);
    console.log('✅ Test data cleaned up');
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testWithSupabase();