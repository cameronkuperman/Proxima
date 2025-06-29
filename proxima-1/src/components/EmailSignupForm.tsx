'use client';
import { FormEvent, useEffect, useState } from 'react';

export default function EmailSignupForm() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!email) return;
    setSent(true);
    setShowToast(true);
    setEmail('');
  };

  useEffect(() => {
    if (showToast) {
      const t = setTimeout(() => setShowToast(false), 4000);
      return () => clearTimeout(t);
    }
  }, [showToast]);

  return (
    <>
    {showToast && (
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded-lg shadow-xl z-50 bg-green-500/10 border border-green-500/20 text-green-400 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Thanks! We'll notify you when we launch.
        </div>
      </div>
    )}
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          required
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 px-4 py-3 rounded-lg bg-gray-900/50 border border-gray-800 focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/50 text-white placeholder-gray-500 transition-all duration-200"
        />
        
        <button
          type="submit"
          disabled={!email || sent}
          className="px-6 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
        >
          {sent ? (
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Sent!
            </span>
          ) : (
            'Get Early Access'
          )}
        </button>
      </div>
    </form>
    </>
  );
}