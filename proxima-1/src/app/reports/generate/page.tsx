'use client';

import { useState } from 'react';
import { ReportGenerator } from '@/components/ReportGenerator';
import { ReportList } from '@/components/ReportList';
import { useAuth } from '@/contexts/AuthContext';
import UnifiedAuthGuard from '@/components/UnifiedAuthGuard';

export const dynamic = 'force-dynamic';

export default function ReportsGeneratePage() {
  const { user } = useAuth();
  const [showGenerator, setShowGenerator] = useState(false);
  const [refreshList, setRefreshList] = useState(0);

  if (!user) return <UnifiedAuthGuard requireAuth={true}><div>Please login to view reports</div></UnifiedAuthGuard>;

  return (
    <UnifiedAuthGuard requireAuth={true}>
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Medical Reports</h1>
          <button
            onClick={() => setShowGenerator(!showGenerator)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {showGenerator ? 'View Reports' : 'Generate New Report'}
          </button>
        </div>

        {showGenerator ? (
          <ReportGenerator 
            userId={user.id}
            onComplete={() => {
              setShowGenerator(false);
              setRefreshList(prev => prev + 1); // Trigger list refresh
            }}
          />
        ) : (
          <ReportList key={refreshList} userId={user.id} />
        )}
      </div>
    </UnifiedAuthGuard>
  );
}