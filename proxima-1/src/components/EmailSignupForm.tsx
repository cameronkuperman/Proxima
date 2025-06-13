/* eslint-disable @next/next/no-img-element */
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
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#202225] text-white px-6 py-3 rounded-md shadow-lg z-50">
        Thanks! We&apos;ll keep you posted.
      </div>
    )}
    <form onSubmit={handleSubmit} className="flex items-center gap-2 w-full">
      <input
        type="email"
        required
        placeholder="Your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="flex-1 px-4 py-3 rounded-md border border-[#D5DAE1] focus:outline-none focus:ring-2 focus:ring-[#2962FF] bg-white text-[#202225]"
      />
      <button
        type="submit"
        disabled={!email}
        className="px-6 py-3 rounded-md bg-[#2962FF] hover:bg-[#1f4fcc] text-white font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {sent ? 'Sent!' : 'Notify Me'}
      </button>
    </form>
    </>
  );
} 