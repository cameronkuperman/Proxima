'use client';

import React, { useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://web-production-945c4.up.railway.app';

export default function TestConnection() {
  const [status, setStatus] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testBackend = async () => {
      try {
        const response = await fetch(`${API_URL}/api/photo-analysis/health`);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        setStatus(data);
      } catch (err: any) {
        setError(err.message);
        console.error('Backend test failed:', err);
      }
    };

    testBackend();
  }, []);

  return (
    <div className="p-4 rounded-lg bg-gray-900 text-white">
      <h3 className="text-lg font-bold mb-2">Backend Connection Test</h3>
      <p className="text-sm text-gray-400 mb-2">API URL: {API_URL}</p>
      {error ? (
        <div className="text-red-400">
          <p>❌ Connection Failed</p>
          <p className="text-xs mt-1">{error}</p>
        </div>
      ) : status ? (
        <div className="text-green-400">
          <p>✅ Backend Connected</p>
          <pre className="text-xs mt-2 text-gray-300">
            {JSON.stringify(status, null, 2)}
          </pre>
        </div>
      ) : (
        <p className="text-yellow-400">⏳ Testing connection...</p>
      )}
    </div>
  );
}