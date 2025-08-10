'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function TestSyncPage() {
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const router = useRouter();

  const handleSync = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setResult({ error: 'Not authenticated' });
        return;
      }

      const response = await fetch('/api/stripe/test-subscription', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleForceSync = async () => {
    setSyncing(true);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        alert('Not authenticated');
        return;
      }

      const response = await fetch('/api/stripe/force-sync', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();
      
      if (data.success) {
        alert(`Success! ${data.message}\n\nRedirecting to dashboard...`);
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } else {
        alert(`Error: ${data.error || 'Failed to sync'}`);
      }
      
      setResult(data);
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleFixTier = async (tier: string) => {
    setFixing(true);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        alert('Not authenticated');
        return;
      }

      const response = await fetch('/api/stripe/fix-tier', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ newTier: tier }),
      });

      const data = await response.json();
      
      if (data.success) {
        alert(`Success! Tier updated to ${tier}`);
        handleSync(); // Refresh the status
      } else {
        alert(`Error: ${data.error || 'Failed to update tier'}`);
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setFixing(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Subscription Sync Test</h1>
        
        <div className="flex gap-4 mb-8 flex-wrap">
          <button
            onClick={handleSync}
            disabled={loading}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium"
          >
            {loading ? 'Checking...' : 'Check Status'}
          </button>
          
          <button
            onClick={handleForceSync}
            disabled={syncing}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-medium"
          >
            {syncing ? 'Syncing...' : 'Force Sync Subscription'}
          </button>
          
          <button
            onClick={() => handleFixTier('pro')}
            disabled={fixing}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium"
          >
            {fixing ? 'Updating...' : 'Fix Tier to PRO'}
          </button>
          
          <button
            onClick={() => handleFixTier('pro_plus')}
            disabled={fixing}
            className="px-6 py-3 bg-pink-600 hover:bg-pink-700 rounded-lg font-medium"
          >
            {fixing ? 'Updating...' : 'Fix Tier to PRO PLUS'}
          </button>
        </div>

        {result && (
          <div className="bg-gray-900 rounded-lg p-6">
            <pre className="text-xs overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}