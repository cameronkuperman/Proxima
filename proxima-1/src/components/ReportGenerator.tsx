'use client';

import { useState, useEffect } from 'react';
import { reportService } from '@/services/reportService';
import { ReportAnalysisRequest, SpecialtyType } from '@/types/reports';
import { useAuth } from '@/contexts/AuthContext';
import { SpecialtyTriage } from './reports/SpecialtyTriage';
import { Activity, FileText, Calendar, ChevronUp, ChevronDown, CheckCircle, Zap, Brain, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TimelineClient, FlashAssessment, GeneralAssessment, TimelineEvent } from '@/lib/timeline-client';
import { AssessmentSelector } from './AssessmentSelector';
import { createClient } from '@/utils/supabase/client';

interface ReportGeneratorProps {
  userId?: string;
  quickScanIds?: string[];
  deepDiveIds?: string[];
  photoSessionIds?: string[];
  onComplete?: (report: any) => void;
}

export function ReportGenerator({ 
  userId: propUserId, 
  quickScanIds = [], 
  deepDiveIds = [], 
  photoSessionIds = [],
  onComplete 
}: ReportGeneratorProps) {
  const { user } = useAuth();
  const userId = propUserId || user?.id;
  
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'select' | 'triage' | 'analyzing' | 'generating' | 'complete'>('select');
  const [error, setError] = useState<string | null>(null);
  const [generatedReport, setGeneratedReport] = useState<any>(null);
  const [triageResult, setTriageResult] = useState<any>(null);

  // Configuration
  const [reportType, setReportType] = useState<'symptom' | 'time' | 'specialist'>('symptom');
  const [symptomFocus, setSymptomFocus] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<SpecialtyType>('cardiology');
  
  // Selection state
  const [availableQuickScans, setAvailableQuickScans] = useState<any[]>([]);
  const [availableDeepDives, setAvailableDeepDives] = useState<any[]>([]);
  const [availableFlashAssessments, setAvailableFlashAssessments] = useState<FlashAssessment[]>([]);
  const [availableGeneralAssessments, setAvailableGeneralAssessments] = useState<GeneralAssessment[]>([]);
  const [availableGeneralDeepDives, setAvailableGeneralDeepDives] = useState<any[]>([]);
  
  const [selectedQuickScans, setSelectedQuickScans] = useState<string[]>([]);
  const [selectedDeepDives, setSelectedDeepDives] = useState<string[]>([]);
  const [selectedFlashAssessments, setSelectedFlashAssessments] = useState<string[]>([]);
  const [selectedGeneralAssessments, setSelectedGeneralAssessments] = useState<string[]>([]);
  const [selectedGeneralDeepDives, setSelectedGeneralDeepDives] = useState<string[]>([]);
  
  const [expandedSections, setExpandedSections] = useState({ 
    quickScans: true, 
    deepDives: true,
    flashAssessments: true,
    generalAssessments: true,
    generalDeepDives: true
  });
  const [loadingData, setLoadingData] = useState(false);
  
  // Fetch available data
  useEffect(() => {
    if (userId && (reportType === 'specialist' || reportType === 'symptom')) {
      fetchAvailableData();
    }
  }, [userId, reportType]);
  
  const fetchAvailableData = async () => {
    setLoadingData(true);
    try {
      // Fetch quick scans
      const quickScansRes = await fetch(`${process.env.NEXT_PUBLIC_ORACLE_API_URL}/api/quick-scans?user_id=${userId}`);
      if (quickScansRes.ok) {
        const scans = await quickScansRes.json();
        setAvailableQuickScans(scans.filter((scan: any) => scan.status === 'completed'));
      }
      
      // Fetch deep dives
      const deepDivesRes = await fetch(`${process.env.NEXT_PUBLIC_ORACLE_API_URL}/api/deep-dives?user_id=${userId}`);
      if (deepDivesRes.ok) {
        const dives = await deepDivesRes.json();
        setAvailableDeepDives(dives.filter((dive: any) => dive.analysis_complete));
      }
      
      // Fetch timeline events to get general assessments
      const timelineClient = new TimelineClient();
      const events = await timelineClient.fetchTimelineEvents(userId!);
      
      // Extract flash assessments
      const flashEvents = events.filter(e => e.event_type === 'flash');
      const flashAssessments = await Promise.all(
        flashEvents.map(e => timelineClient.fetchFlashAssessment(e.source_id))
      );
      setAvailableFlashAssessments(flashAssessments.filter(a => a !== null) as FlashAssessment[]);
      
      // Extract general quick assessments
      const generalQuickEvents = events.filter(e => e.event_type === 'general_quick');
      const generalAssessments = await Promise.all(
        generalQuickEvents.map(e => timelineClient.fetchGeneralAssessment(e.source_id))
      );
      setAvailableGeneralAssessments(generalAssessments.filter(a => a !== null) as GeneralAssessment[]);
      
      // Extract general deep dive assessments
      const generalDeepEvents = events.filter(e => e.event_type === 'general_deep');
      const generalDeepDives = await Promise.all(
        generalDeepEvents.map(e => timelineClient.fetchGeneralDeepDive(e.source_id))
      );
      setAvailableGeneralDeepDives(generalDeepDives.filter(a => a !== null));
      
    } catch (err) {
      console.error('Error fetching available data:', err);
    } finally {
      setLoadingData(false);
    }
  };
  
  const toggleScan = (scanId: string, type: 'quick' | 'deep' | 'flash' | 'general' | 'generalDeep') => {
    switch (type) {
      case 'quick':
        setSelectedQuickScans(prev => 
          prev.includes(scanId) 
            ? prev.filter(id => id !== scanId)
            : [...prev, scanId]
        );
        break;
      case 'deep':
        setSelectedDeepDives(prev => 
          prev.includes(scanId) 
            ? prev.filter(id => id !== scanId)
            : [...prev, scanId]
        );
        break;
      case 'flash':
        setSelectedFlashAssessments(prev => 
          prev.includes(scanId) 
            ? prev.filter(id => id !== scanId)
            : [...prev, scanId]
        );
        break;
      case 'general':
        setSelectedGeneralAssessments(prev => 
          prev.includes(scanId) 
            ? prev.filter(id => id !== scanId)
            : [...prev, scanId]
        );
        break;
      case 'generalDeep':
        setSelectedGeneralDeepDives(prev => 
          prev.includes(scanId) 
            ? prev.filter(id => id !== scanId)
            : [...prev, scanId]
        );
        break;
    }
  };
  
  const toggleSection = (section: 'quickScans' | 'deepDives' | 'flashAssessments' | 'generalAssessments' | 'generalDeepDives') => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleGenerateSymptomReport = async () => {
    const supabase = createClient();
    setLoading(true);
    setError(null);
    setStep('analyzing');

    try {
      // Step 1: Create analysis record in DATABASE (following exact spec)
      const analysisId = crypto.randomUUID();
      console.log('Creating symptom report analysis record:', analysisId);
      
      const analysisRecord = {
        id: analysisId,
        user_id: userId,
        created_at: new Date().toISOString(),
        purpose: 'symptom_specific',
        recommended_type: 'symptom_timeline',
        confidence: 0.85,
        report_config: {
          symptom_focus: symptomFocus,
          time_range: {
            start: new Date(Date.now() - 30*24*60*60*1000).toISOString(),
            end: new Date().toISOString()
          }
        },
        quick_scan_ids: selectedQuickScans,
        deep_dive_ids: selectedDeepDives,
        general_assessment_ids: selectedGeneralAssessments,
        general_deep_dive_ids: selectedGeneralDeepDives,
        flash_assessment_ids: selectedFlashAssessments
      };
      
      const { error: dbError } = await supabase
        .from('report_analyses')
        .insert(analysisRecord);
        
      if (dbError) {
        console.error('Failed to create analysis record:', dbError);
        throw new Error(`Database error: ${dbError.message}`);
      }
      
      setStep('generating');

      // Step 2: Generate symptom timeline report
      const report = await reportService.generateReport(
        analysisId,
        'symptom_timeline' as any,
        userId,
        {
          quick_scan_ids: selectedQuickScans.length > 0 ? selectedQuickScans : undefined,
          deep_dive_ids: selectedDeepDives.length > 0 ? selectedDeepDives : undefined,
          flash_assessment_ids: selectedFlashAssessments.length > 0 ? selectedFlashAssessments : undefined,
          general_assessment_ids: selectedGeneralAssessments.length > 0 ? selectedGeneralAssessments : undefined,
          general_deep_dive_ids: selectedGeneralDeepDives.length > 0 ? selectedGeneralDeepDives : undefined,
          photo_session_ids: photoSessionIds.length > 0 ? photoSessionIds : undefined
        },
        {
          symptom_focus: symptomFocus
        }
      );

      setGeneratedReport(report);
      setStep('complete');
      onComplete?.(report);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate report');
      setStep('select');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateTimeReport = async (period: '30-day' | 'annual') => {
    const supabase = createClient();
    setLoading(true);
    setError(null);
    setStep('generating');

    try {
      // Create analysis record for time-based report
      const analysisId = crypto.randomUUID();
      const reportType = period === '30-day' ? 'monthly_summary' : 'annual_summary';
      
      const analysisRecord = {
        id: analysisId,
        user_id: userId,
        created_at: new Date().toISOString(),
        purpose: period === '30-day' ? '30-day health summary' : 'Annual health summary',
        recommended_type: reportType,
        confidence: 0.9,
        report_config: {
          period: period,
          time_range: {
            start: period === '30-day' 
              ? new Date(Date.now() - 30*24*60*60*1000).toISOString()
              : new Date(new Date().getFullYear(), 0, 1).toISOString(),
            end: new Date().toISOString()
          }
        },
        quick_scan_ids: [],
        deep_dive_ids: [],
        general_assessment_ids: [],
        general_deep_dive_ids: [],
        flash_assessment_ids: []
      };
      
      const { error: dbError } = await supabase
        .from('report_analyses')
        .insert(analysisRecord);
        
      if (dbError) {
        console.error('Failed to create analysis record:', dbError);
        throw new Error(`Database error: ${dbError.message}`);
      }

      const report = period === '30-day' 
        ? await reportService.generate30DayReport(userId!)
        : await reportService.generateAnnualReport(userId!);

      setGeneratedReport(report);
      setStep('complete');
      onComplete?.(report);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate report');
      setStep('select');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSpecialistReport = async (
    specialtyOverride?: SpecialtyType,
    idsOverride?: {
      quick_scan_ids: string[];
      deep_dive_ids: string[];
      general_assessment_ids?: string[];
      general_deep_dive_ids?: string[];
      flash_assessment_ids?: string[];
    }
  ) => {
    const specialtyToUse = specialtyOverride || selectedSpecialty;
    const supabase = createClient();
    
    // Use passed IDs or fall back to state (but prefer passed IDs to avoid race conditions)
    const idsToUse = idsOverride || {
      quick_scan_ids: selectedQuickScans,
      deep_dive_ids: selectedDeepDives,
      general_assessment_ids: selectedGeneralAssessments,
      general_deep_dive_ids: selectedGeneralDeepDives,
      flash_assessment_ids: selectedFlashAssessments
    };
    
    console.log('=== SPECIALIST REPORT GENERATION (EXACT SPEC) ===');
    console.log('Step 1: Using specialty from triage:', specialtyToUse);
    console.log('Step 2: Selected IDs to use:', idsToUse);
    console.log('User ID:', userId);
    
    setLoading(true);
    setError(null);
    setStep('analyzing');

    try {
      // STEP 1: Create analysis record in DATABASE (REQUIRED by spec)
      const analysisId = crypto.randomUUID();
      console.log('Step 3: Creating analysis record with ID:', analysisId);
      
      const analysisRecord = {
        id: analysisId,
        user_id: userId,
        created_at: new Date().toISOString(),
        purpose: 'Specialist report generation',
        recommended_type: specialtyToUse,
        confidence: triageResult?.confidence || 0.8,
        report_config: {
          time_range: {
            start: new Date(Date.now() - 30*24*60*60*1000).toISOString(),
            end: new Date().toISOString()
          }
        },
        // Store the EXACT selected IDs
        quick_scan_ids: idsToUse.quick_scan_ids,
        deep_dive_ids: idsToUse.deep_dive_ids,
        general_assessment_ids: idsToUse.general_assessment_ids || [],
        general_deep_dive_ids: idsToUse.general_deep_dive_ids || [],
        flash_assessment_ids: idsToUse.flash_assessment_ids || []
      };
      
      console.log('Inserting analysis record:', analysisRecord);
      const { error: dbError } = await supabase
        .from('report_analyses')
        .insert(analysisRecord);
        
      if (dbError) {
        console.error('Failed to create analysis record in database:', dbError);
        throw new Error(`Database error: ${dbError.message}`);
      }
      
      // STEP 2: Verify the analysis record was created
      console.log('Step 4: Verifying analysis record exists...');
      const { data: analysisCheck, error: checkError } = await supabase
        .from('report_analyses')
        .select('*')
        .eq('id', analysisId)
        .single();
        
      if (checkError || !analysisCheck) {
        console.error('Analysis record verification failed:', checkError);
        throw new Error('Failed to verify analysis record in database');
      }
      
      console.log('Analysis record verified:', analysisCheck);
      setStep('generating');

      // STEP 3: Generate specialist report with the CREATED analysis_id
      console.log('Step 5: Generating report for specialty:', specialtyToUse);
      console.log('Using analysis_id from database:', analysisId);
      console.log('Sending EXACT same IDs:', idsToUse);
      
      const report = await reportService.generateSpecialistReport(
        specialtyToUse,
        analysisId,  // Use the ID we just created and verified
        userId,
        {
          quick_scan_ids: idsToUse.quick_scan_ids.length > 0 ? idsToUse.quick_scan_ids : undefined,
          deep_dive_ids: idsToUse.deep_dive_ids.length > 0 ? idsToUse.deep_dive_ids : undefined,
          flash_assessment_ids: idsToUse.flash_assessment_ids && idsToUse.flash_assessment_ids.length > 0 ? idsToUse.flash_assessment_ids : undefined,
          general_assessment_ids: idsToUse.general_assessment_ids && idsToUse.general_assessment_ids.length > 0 ? idsToUse.general_assessment_ids : undefined,
          general_deep_dive_ids: idsToUse.general_deep_dive_ids && idsToUse.general_deep_dive_ids.length > 0 ? idsToUse.general_deep_dive_ids : undefined,
          photo_session_ids: photoSessionIds.length > 0 ? photoSessionIds : undefined
        }
      );

      console.log('Step 6: Report generated successfully:', report);
      setGeneratedReport(report);
      setStep('complete');
      onComplete?.(report);
    } catch (err) {
      console.error('Report Generation Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate report');
      setStep('select');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'complete' && generatedReport) {
    return (
      <div className="p-6 bg-green-50 rounded-lg">
        <h3 className="text-lg font-semibold text-green-800 mb-2">Report Generated Successfully!</h3>
        <p className="text-green-700">Report ID: {generatedReport.report_id}</p>
        <p className="text-green-700">Type: {generatedReport.report_type}</p>
        <button 
          onClick={() => window.location.href = `/reports/${generatedReport.report_id}`}
          className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          View Report
        </button>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="p-4 bg-yellow-50 text-yellow-700 rounded-lg">
        Please log in to generate reports
      </div>
    );
  }

  // TEST FUNCTION - Remove in production
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).testSpecialistReport = async () => {
        console.log('=== TESTING EXACT SPECIALIST REPORT FLOW ===');
        const testUserId = userId || "45b61b67-175d-48a0-aca6-d0be57609383";
        const testDeepDiveId = "057447a9-3369-42b2-b683-778d10ae5c8b";
        
        console.log('1. Calling triage with single deep dive ID...');
        const triageRes = await fetch(`${process.env.NEXT_PUBLIC_ORACLE_API_URL}/api/report/specialty-triage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: testUserId,
            deep_dive_ids: [testDeepDiveId]
          })
        });
        const triage = await triageRes.json();
        console.log('Triage result:', triage);
        
        if (triage.status === 'success' || triage.primary_specialty) {
          const specialty = triage.triage_result?.primary_specialty || triage.primary_specialty;
          console.log('2. Determined specialty:', specialty);
          
          const supabase = createClient();
          const analysisId = crypto.randomUUID();
          console.log('3. Creating analysis record:', analysisId);
          
          const { error: dbError } = await supabase
            .from('report_analyses')
            .insert({
              id: analysisId,
              user_id: testUserId,
              created_at: new Date().toISOString(),
              purpose: 'Test specialist report',
              recommended_type: specialty,
              confidence: 0.85,
              report_config: {},
              deep_dive_ids: [testDeepDiveId]
            });
            
          if (dbError) {
            console.error('DB Error:', dbError);
            return;
          }
          
          console.log('4. Generating report for specialty:', specialty);
          const reportRes = await fetch(`${process.env.NEXT_PUBLIC_ORACLE_API_URL}/api/report/${specialty}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              analysis_id: analysisId,
              user_id: testUserId,
              deep_dive_ids: [testDeepDiveId]
            })
          });
          const report = await reportRes.json();
          console.log('5. Report generated:', report);
          console.log('Chief complaints should ONLY be from deep dive:', report.report_data?.executive_summary?.chief_complaints);
        }
      };
      console.log('Test function available: window.testSpecialistReport()');
    }
  }, [userId]);

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>
      )}

      {step === 'select' && (
        <>
          <h2 className="text-2xl font-bold">Generate Medical Report</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => setReportType('symptom')}
              className={`p-4 border rounded-lg hover:border-blue-500 ${
                reportType === 'symptom' ? 'border-blue-500 bg-blue-50' : ''
              }`}
            >
              <h3 className="font-semibold">Symptom-Based Report</h3>
              <p className="text-sm text-gray-600 mt-1">Analyze specific symptoms and conditions</p>
            </button>

            <button
              onClick={() => setReportType('time')}
              className={`p-4 border rounded-lg hover:border-blue-500 ${
                reportType === 'time' ? 'border-blue-500 bg-blue-50' : ''
              }`}
            >
              <h3 className="font-semibold">Time Period Report</h3>
              <p className="text-sm text-gray-600 mt-1">30-day or annual health summary</p>
            </button>

            <button
              onClick={() => setReportType('specialist')}
              className={`p-4 border rounded-lg hover:border-blue-500 ${
                reportType === 'specialist' ? 'border-blue-500 bg-blue-50' : ''
              }`}
            >
              <h3 className="font-semibold">Specialist Report</h3>
              <p className="text-sm text-gray-600 mt-1">Detailed report for specific specialty</p>
            </button>
          </div>

          {reportType === 'symptom' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Symptom or Concern
                </label>
                <input
                  type="text"
                  placeholder="Describe your primary symptom or concern"
                  value={symptomFocus}
                  onChange={(e) => setSymptomFocus(e.target.value)}
                  className="w-full p-3 border rounded-lg"
                />
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Select Assessments to Include (Optional)
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Choose which of your previous health assessments to include in this symptom timeline report.
                </p>
                
                <AssessmentSelector
                  availableQuickScans={availableQuickScans}
                  availableDeepDives={availableDeepDives}
                  selectedQuickScans={selectedQuickScans}
                  selectedDeepDives={selectedDeepDives}
                  availableFlashAssessments={availableFlashAssessments}
                  availableGeneralAssessments={availableGeneralAssessments}
                  availableGeneralDeepDives={availableGeneralDeepDives}
                  selectedFlashAssessments={selectedFlashAssessments}
                  selectedGeneralAssessments={selectedGeneralAssessments}
                  selectedGeneralDeepDives={selectedGeneralDeepDives}
                  onToggle={toggleScan}
                  onToggleSection={toggleSection}
                  expandedSections={expandedSections}
                  loading={loadingData}
                />
              </div>

              <button
                onClick={handleGenerateSymptomReport}
                disabled={!symptomFocus || loading}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Generating Report...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Generate Symptom Timeline Report
                  </>
                )}
              </button>
            </div>
          )}

          {reportType === 'time' && (
            <div className="flex gap-4">
              <button
                onClick={() => handleGenerateTimeReport('30-day')}
                disabled={loading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Generate 30-Day Report
              </button>
              <button
                onClick={() => handleGenerateTimeReport('annual')}
                disabled={loading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Generate Annual Report
              </button>
            </div>
          )}

          {reportType === 'specialist' && (
            <div className="space-y-4">
              <p className="text-gray-600">
                Select the health analyses you want to include in the specialist report.
              </p>
              
              <AssessmentSelector
                availableQuickScans={availableQuickScans}
                availableDeepDives={availableDeepDives}
                selectedQuickScans={selectedQuickScans}
                selectedDeepDives={selectedDeepDives}
                availableFlashAssessments={availableFlashAssessments}
                availableGeneralAssessments={availableGeneralAssessments}
                availableGeneralDeepDives={availableGeneralDeepDives}
                selectedFlashAssessments={selectedFlashAssessments}
                selectedGeneralAssessments={selectedGeneralAssessments}
                selectedGeneralDeepDives={selectedGeneralDeepDives}
                onToggle={toggleScan}
                onToggleSection={toggleSection}
                expandedSections={expandedSections}
                loading={loadingData}
              />
              
              <button
                onClick={() => setStep('triage')}
                disabled={
                  selectedQuickScans.length === 0 && 
                  selectedDeepDives.length === 0 &&
                  selectedFlashAssessments.length === 0 &&
                  selectedGeneralAssessments.length === 0 &&
                  selectedGeneralDeepDives.length === 0
                }
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                Continue to Specialist Selection
              </button>
            </div>
          )}
        </>
      )}

      {step === 'triage' && (
        <SpecialtyTriage
          userId={userId}
          quickScans={availableQuickScans.filter(scan => selectedQuickScans.includes(scan.id))}
          deepDives={availableDeepDives.filter(dive => selectedDeepDives.includes(dive.id))}
          flashAssessments={availableFlashAssessments.filter(a => selectedFlashAssessments.includes(a.id))}
          generalAssessments={availableGeneralAssessments.filter(a => selectedGeneralAssessments.includes(a.id))}
          generalDeepDives={availableGeneralDeepDives.filter(a => selectedGeneralDeepDives.includes(a.id))}
          onSpecialtySelected={(specialty, triage, selectedIds) => {
            console.log('=== SPECIALTY SELECTED ===');
            console.log('Specialty:', specialty);
            console.log('Triage Result:', triage);
            console.log('Selected IDs:', selectedIds);
            
            setSelectedSpecialty(specialty);
            setTriageResult(triage);
            
            // Update ALL selected IDs from triage
            setSelectedQuickScans(selectedIds.quick_scan_ids);
            setSelectedDeepDives(selectedIds.deep_dive_ids);
            setSelectedFlashAssessments(selectedIds.flash_assessment_ids || []);
            setSelectedGeneralAssessments(selectedIds.general_assessment_ids || []);
            setSelectedGeneralDeepDives(selectedIds.general_deep_dive_ids || []);
            
            // Pass specialty and ALL IDs directly to avoid state race condition
            handleGenerateSpecialistReport(specialty, selectedIds);
          }}
        />
      )}

      {step === 'analyzing' && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg">Analyzing your health data...</p>
          <p className="text-sm text-gray-600">Determining the best report type for your needs</p>
        </div>
      )}

      {step === 'generating' && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg">Generating specialist report...</p>
          <p className="text-sm text-gray-600">Processing your selected health data</p>
        </div>
      )}
    </div>
  );
}