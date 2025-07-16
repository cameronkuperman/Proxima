import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Share2, Mail, FileText, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { generateReportPDF, shareReportText } from '@/utils/pdfGenerator';

interface ReportViewerProps {
  report: any;
  onBack?: () => void;
}

type TabType = 'summary' | 'analysis' | 'recommendations' | 'billing';

export const ReportViewer: React.FC<ReportViewerProps> = ({ report, onBack }) => {
  const [activeTab, setActiveTab] = useState<TabType>('summary');
  const [isExporting, setIsExporting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  
  // Determine available tabs based on report data
  const getAvailableTabs = (): TabType[] => {
    const tabs: TabType[] = ['summary'];
    const data = report?.report_data;
    
    if (data?.pattern_analysis || data?.medical_analysis || 
        Object.keys(data || {}).some(key => key.includes('_specific'))) {
      tabs.push('analysis');
    }
    
    if (data?.recommendations || data?.action_plan) {
      tabs.push('recommendations');
    }
    
    if (data?.billing_optimization) {
      tabs.push('billing');
    }
    
    return tabs;
  };
  
  const availableTabs = getAvailableTabs();

  const exportPDF = async () => {
    try {
      setIsExporting(true);
      await generateReportPDF(report, {
        includeMetadata: true,
        includeSummaryOnly: false,
      });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const shareReport = async () => {
    try {
      setIsSharing(true);
      await shareReportText(report);
    } catch (error) {
      console.error('Error sharing report:', error);
      alert('Failed to share report. Please try again.');
    } finally {
      setIsSharing(false);
    }
  };

  const emailReport = () => {
    const subject = `Medical Report - ${new Date().toLocaleDateString()}`;
    const body = encodeURIComponent(report.report_data?.executive_summary?.one_page_summary || '');
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  // Render different report types
  if (report.report_type === 'urgent_triage') {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-red-50 border-2 border-red-300 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
            <h1 className="text-2xl font-bold text-red-900">Urgent Medical Summary</h1>
          </div>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-red-800 mb-2">Immediate Action Required:</h3>
              <p className="text-xl font-bold text-red-900">
                {report.triage_summary?.recommended_action || 'Seek immediate medical attention'}
              </p>
            </div>

            <div className="pt-4 border-t border-red-200">
              <button
                onClick={exportPDF}
                disabled={isExporting}
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white 
                  font-medium rounded-lg transition-colors disabled:opacity-50 
                  disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Download className={`w-4 h-4 ${isExporting ? 'animate-spin' : ''}`} />
                {isExporting ? 'Generating PDF...' : 'Download Emergency Summary'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Standard report viewer for other types
  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900">
            Medical Report
          </h1>
          <div className="flex items-center gap-3">
            <button
              onClick={exportPDF}
              disabled={isExporting}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white 
                rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 
                disabled:cursor-not-allowed"
            >
              <Download className={`w-4 h-4 ${isExporting ? 'animate-spin' : ''}`} />
              {isExporting ? 'Exporting...' : 'Export PDF'}
            </button>
            <button
              onClick={shareReport}
              disabled={isSharing}
              className="px-4 py-2 border border-gray-300 hover:bg-gray-50 
                rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 
                disabled:cursor-not-allowed"
            >
              <Share2 className={`w-4 h-4 ${isSharing ? 'animate-spin' : ''}`} />
              {isSharing ? 'Sharing...' : 'Share'}
            </button>
            <button
              onClick={emailReport}
              className="px-4 py-2 border border-gray-300 hover:bg-gray-50 
                rounded-lg transition-colors flex items-center gap-2"
            >
              <Mail className="w-4 h-4" />
              Email
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>Report Type: {report.report_type?.replace('_', ' ')}</span>
          <span>•</span>
          <span>Generated: {new Date(report.generated_at || Date.now()).toLocaleString()}</span>
          {report.report_id && (
            <>
              <span>•</span>
              <span>ID: {report.report_id}</span>
            </>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b mb-6">
        <div className="flex gap-6">
          {availableTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-2 px-1 capitalize ${
                activeTab === tab 
                  ? 'border-b-2 border-blue-600 text-blue-600' 
                  : 'text-gray-600'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow p-6">
        {activeTab === 'summary' && (
          <SummaryTab reportData={report.report_data} />
        )}

        {activeTab === 'analysis' && (
          <AnalysisTab reportData={report.report_data} reportType={report.report_type} />
        )}

        {activeTab === 'recommendations' && (
          <RecommendationsTab reportData={report.report_data} />
        )}
        
        {activeTab === 'billing' && (
          <BillingTab reportData={report.report_data} />
        )}
      </div>

      {/* Back Button */}
      {onBack && (
        <div className="mt-8">
          <button
            onClick={onBack}
            className="text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to health data
          </button>
        </div>
      )}
    </div>
  );
};

// Summary Tab Component
const SummaryTab: React.FC<{ reportData: any }> = ({ reportData }) => {
  if (!reportData) return <div>No report data available</div>;
  
  const summary = reportData.executive_summary || reportData.triage_summary;
  
  return (
    <div className="prose max-w-none">
      <h2>Executive Summary</h2>
      {summary?.one_page_summary && (
        <p className="text-gray-700 leading-relaxed">{summary.one_page_summary}</p>
      )}
      
      {summary?.key_findings && summary.key_findings.length > 0 && (
        <>
          <h3>Key Findings</h3>
          <ul>
            {summary.key_findings.map((finding: string, i: number) => (
              <li key={i}>{finding}</li>
            ))}
          </ul>
        </>
      )}

      {summary?.patterns_identified && summary.patterns_identified.length > 0 && (
        <>
          <h3>Patterns Identified</h3>
          <ul>
            {summary.patterns_identified.map((pattern: string, i: number) => (
              <li key={i}>{pattern}</li>
            ))}
          </ul>
        </>
      )}
      
      {summary?.chief_complaints && summary.chief_complaints.length > 0 && (
        <>
          <h3>Chief Complaints</h3>
          <ul>
            {summary.chief_complaints.map((complaint: string, i: number) => (
              <li key={i}>{complaint}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};

// Analysis Tab Component
const AnalysisTab: React.FC<{ reportData: any; reportType: string }> = ({ reportData, reportType }) => {
  if (!reportData) return <div>No analysis data available</div>;
  
  return (
    <div className="space-y-6">
      {/* Pattern Analysis for 30-day/annual reports */}
      {reportData.pattern_analysis && (
        <div>
          <h3 className="text-xl font-semibold mb-4">Pattern Analysis</h3>
          
          {reportData.pattern_analysis.correlation_patterns?.symptom_triggers && (
            <div className="mb-4">
              <h4 className="font-medium mb-2">Symptom Triggers (Seems to pop up when...)</h4>
              <ul className="list-disc pl-5 space-y-1">
                {reportData.pattern_analysis.correlation_patterns.symptom_triggers.map((trigger: string, i: number) => (
                  <li key={i}>{trigger}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Medical Analysis */}
      {reportData.medical_analysis && (
        <div>
          <h3 className="text-xl font-semibold mb-4">Medical Analysis</h3>
          {reportData.medical_analysis.conditions_assessed?.map((condition: any, i: number) => (
            <div key={i} className="mb-4 p-4 bg-gray-50 rounded">
              <h4 className="font-medium">{condition.condition}</h4>
              <p className="text-sm text-gray-600">Likelihood: {condition.likelihood}</p>
              {condition.supporting_evidence && (
                <ul className="list-disc pl-5 mt-2">
                  {condition.supporting_evidence.map((evidence: string, j: number) => (
                    <li key={j} className="text-sm">{evidence}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Specialist-specific analysis */}
      {reportType?.includes('cardiology') && reportData.cardiology_specific && (
        <div>
          <h3 className="text-xl font-semibold mb-4">Cardiac Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded">
              <h4 className="font-medium mb-2">Risk Stratification</h4>
              <p>ASCVD Risk: {reportData.cardiology_specific.risk_stratification?.ascvd_risk}</p>
              <p>Heart Failure Risk: {reportData.cardiology_specific.risk_stratification?.heart_failure_risk}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded">
              <h4 className="font-medium mb-2">Recommended Tests</h4>
              <ul className="list-disc pl-5">
                {reportData.cardiology_specific.recommended_tests?.immediate?.map((test: string, i: number) => (
                  <li key={i}>{test}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
      
      {/* Other specialist analyses */}
      {Object.keys(reportData).filter(key => key.includes('_specific')).map(specialtyKey => (
        <div key={specialtyKey}>
          <h3 className="text-xl font-semibold mb-4">
            {specialtyKey.replace('_specific', '').replace('_', ' ').toUpperCase()} Analysis
          </h3>
          <pre className="bg-gray-50 p-4 rounded overflow-auto">
            {JSON.stringify(reportData[specialtyKey], null, 2)}
          </pre>
        </div>
      ))}
    </div>
  );
};

// Recommendations Tab Component
const RecommendationsTab: React.FC<{ reportData: any }> = ({ reportData }) => {
  const recommendations = reportData?.recommendations || reportData?.action_plan;
  
  if (!recommendations) return <div>No recommendations available</div>;
  
  return (
    <div className="space-y-6">
      {(recommendations.immediate_actions || recommendations.immediate_actions)?.length > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded">
          <h3 className="font-semibold text-red-800 mb-2">Immediate Actions</h3>
          <ul className="list-disc pl-5">
            {(recommendations.immediate_actions || recommendations.immediate_actions).map((action: string, i: number) => (
              <li key={i}>{action}</li>
            ))}
          </ul>
        </div>
      )}

      {recommendations.lifestyle_modifications?.length > 0 && (
        <div>
          <h3 className="font-semibold mb-2">Lifestyle Modifications</h3>
          <ul className="list-disc pl-5">
            {recommendations.lifestyle_modifications.map((mod: string, i: number) => (
              <li key={i}>{mod}</li>
            ))}
          </ul>
        </div>
      )}
      
      {recommendations.lifestyle_changes?.length > 0 && (
        <div>
          <h3 className="font-semibold mb-2">Lifestyle Changes</h3>
          <ul className="list-disc pl-5">
            {recommendations.lifestyle_changes.map((change: string, i: number) => (
              <li key={i}>{change}</li>
            ))}
          </ul>
        </div>
      )}

      {recommendations.monitoring_priorities?.length > 0 && (
        <div>
          <h3 className="font-semibold mb-2">Monitoring Priorities</h3>
          <ul className="list-disc pl-5">
            {recommendations.monitoring_priorities.map((priority: string, i: number) => (
              <li key={i}>{priority}</li>
            ))}
          </ul>
        </div>
      )}
      
      {recommendations.monitoring_plan?.length > 0 && (
        <div>
          <h3 className="font-semibold mb-2">Monitoring Plan</h3>
          <ul className="list-disc pl-5">
            {recommendations.monitoring_plan.map((item: string, i: number) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      )}
      
      {recommendations.follow_up_timeline && (
        <div className="mt-4 p-4 bg-blue-50 rounded">
          <h4 className="font-semibold text-blue-900">Follow-up Timeline</h4>
          <p className="text-blue-700">{recommendations.follow_up_timeline}</p>
        </div>
      )}
    </div>
  );
};

// Billing Tab Component
const BillingTab: React.FC<{ reportData: any }> = ({ reportData }) => {
  const billing = reportData?.billing_optimization;
  
  if (!billing) return <div>No billing information available</div>;
  
  return (
    <div className="p-4 bg-blue-50 rounded">
      <h3 className="font-semibold mb-4">Billing & Insurance</h3>
      <div className="space-y-2">
        {billing.suggested_codes?.icd10 && (
          <div>
            <span className="text-sm font-medium">ICD-10 Codes: </span>
            <span className="text-sm">{billing.suggested_codes.icd10.join(', ')}</span>
          </div>
        )}
        {billing.suggested_codes?.cpt && (
          <div>
            <span className="text-sm font-medium">CPT Codes: </span>
            <span className="text-sm">{billing.suggested_codes.cpt.join(', ')}</span>
          </div>
        )}
        {billing.documentation_requirements && (
          <div className="mt-4">
            <h4 className="font-medium mb-2">Documentation Requirements</h4>
            <ul className="list-disc pl-5 text-sm">
              {billing.documentation_requirements.map((req: string, i: number) => (
                <li key={i}>{req}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};