'use client';

import { useState, useEffect } from 'react';
import { reportService } from '@/services/reportService';

interface ReportListProps {
  userId: string;
}

export function ReportList({ userId }: ReportListProps) {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, [userId]);

  const loadReports = async () => {
    try {
      const data = await reportService.getUserReports(userId);
      setReports(data);
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading reports...</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Your Medical Reports</h2>
      
      {reports.length === 0 ? (
        <p className="text-gray-600">No reports generated yet</p>
      ) : (
        <div className="grid gap-4">
          {reports.map((report) => (
            <div key={report.id} className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">
                    {report.type.replace(/_/g, ' ').toUpperCase()} Report
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {report.summary?.substring(0, 100)}...
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(report.created_at).toLocaleDateString()}
                    {report.confidence && ` • Confidence: ${report.confidence}%`}
                  </p>
                </div>
                <button
                  onClick={() => window.location.href = `/reports/${report.id}`}
                  className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded"
                >
                  View
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}