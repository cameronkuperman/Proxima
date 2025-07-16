'use client';

import { useState } from 'react';
import { reportService } from '@/services/reportService';
import { ReportAnalysisRequest, SpecialtyType } from '@/types/reports';
import { useAuthContext } from '@/lib/auth-context';

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
  const { user } = useAuthContext();
  const userId = propUserId || user?.id;
  
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'select' | 'analyzing' | 'generating' | 'complete'>('select');
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [generatedReport, setGeneratedReport] = useState<any>(null);

  // Configuration
  const [reportType, setReportType] = useState<'symptom' | 'time' | 'specialist'>('symptom');
  const [symptomFocus, setSymptomFocus] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<SpecialtyType>('cardiology');

  const handleGenerateSymptomReport = async () => {
    setLoading(true);
    setError(null);
    setStep('analyzing');

    try {
      // Step 1: Analyze
      const analysis = await reportService.analyzeReport({
        user_id: userId,
        context: {
          purpose: 'symptom_specific',
          symptom_focus: symptomFocus,
        },
        available_data: {
          quick_scan_ids: quickScanIds,
          deep_dive_ids: deepDiveIds,
          photo_session_ids: photoSessionIds,
        }
      });

      setAnalysisResult(analysis);
      setStep('generating');

      // Step 2: Generate based on AI recommendation
      const report = await reportService.generateReport(
        analysis.analysis_id,
        analysis.recommended_type as any,
        userId
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
    setLoading(true);
    setError(null);
    setStep('generating');

    try {
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

  const handleGenerateSpecialistReport = async () => {
    setLoading(true);
    setError(null);
    setStep('analyzing');

    try {
      // First analyze to get analysis_id
      const analysis = await reportService.analyzeReport({
        user_id: userId,
        context: {
          purpose: 'specialist_referral',
          target_audience: 'specialist',
        },
        available_data: {
          quick_scan_ids: quickScanIds,
          deep_dive_ids: deepDiveIds,
          photo_session_ids: photoSessionIds,
        }
      });

      setStep('generating');

      // Generate specialist report
      const report = await reportService.generateSpecialistReport(
        selectedSpecialty,
        analysis.analysis_id,
        userId
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
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Describe your primary symptom or concern"
                value={symptomFocus}
                onChange={(e) => setSymptomFocus(e.target.value)}
                className="w-full p-3 border rounded-lg"
              />
              <button
                onClick={handleGenerateSymptomReport}
                disabled={!symptomFocus || loading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Generate Report
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
              <select
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value as SpecialtyType)}
                className="w-full p-3 border rounded-lg"
              >
                <option value="cardiology">Cardiology</option>
                <option value="neurology">Neurology</option>
                <option value="psychiatry">Psychiatry</option>
                <option value="dermatology">Dermatology</option>
                <option value="gastroenterology">Gastroenterology</option>
                <option value="endocrinology">Endocrinology</option>
                <option value="pulmonology">Pulmonology</option>
              </select>
              <button
                onClick={handleGenerateSpecialistReport}
                disabled={loading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Generate {selectedSpecialty} Report
              </button>
            </div>
          )}
        </>
      )}

      {step === 'analyzing' && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg">Analyzing your health data...</p>
          <p className="text-sm text-gray-600">Determining the best report type for your needs</p>
        </div>
      )}

      {step === 'generating' && analysisResult && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg">Generating {analysisResult.recommended_type} report...</p>
          <p className="text-sm text-gray-600">{analysisResult.reasoning}</p>
          <p className="text-sm text-gray-600 mt-2">Confidence: {Math.round(analysisResult.confidence * 100)}%</p>
        </div>
      )}
    </div>
  );
}