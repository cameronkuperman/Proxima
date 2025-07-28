'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export default function OAuthDebugPage() {
  const [debugInfo, setDebugInfo] = useState<any>({});
  
  useEffect(() => {
    const captureOAuthData = async () => {
      // Capture all possible OAuth data
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const queryParams = new URLSearchParams(window.location.search);
      
      const hashData: Record<string, string> = {};
      hashParams.forEach((value, key) => {
        hashData[key] = value;
      });
      
      const queryData: Record<string, string> = {};
      queryParams.forEach((value, key) => {
        queryData[key] = value;
      });
      
      // Check current session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      // Check localStorage
      const storageKeys = ['proxima-auth', 'sb-auth-token'];
      const storageData: Record<string, any> = {};
      storageKeys.forEach(key => {
        const value = localStorage.getItem(key);
        if (value) {
          try {
            storageData[key] = JSON.parse(value);
          } catch {
            storageData[key] = value;
          }
        }
      });
      
      setDebugInfo({
        url: window.location.href,
        hash: window.location.hash,
        hashParams: hashData,
        queryParams: queryData,
        hasSession: !!session,
        sessionError: error?.message,
        userId: session?.user?.id,
        email: session?.user?.email,
        localStorage: storageData,
        cookies: document.cookie,
        timestamp: new Date().toISOString()
      });
    };
    
    captureOAuthData();
  }, []);
  
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8">
      <h1 className="text-2xl font-bold mb-4">OAuth Debug Information</h1>
      <pre className="bg-gray-900 p-4 rounded overflow-auto">
        {JSON.stringify(debugInfo, null, 2)}
      </pre>
      <div className="mt-4">
        <button
          onClick={() => window.location.href = '/login'}
          className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded"
        >
          Back to Login
        </button>
      </div>
    </div>
  );
}