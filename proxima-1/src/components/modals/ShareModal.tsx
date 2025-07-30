// Share Modal Component
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Copy, Mail, Check, X } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_ORACLE_API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://web-production-945c4.up.railway.app';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareLink: string;
}

export function ShareModal({ isOpen, onClose, shareLink }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const sendEmail = async () => {
    if (!email) return;
    
    setIsSending(true);
    try {
      await fetch(`${API_URL}/api/send-share-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          share_link: shareLink,
          recipient_email: email
        })
      });
      
      toast.success('Email sent successfully');
      onClose();
    } catch (error) {
      toast.error('Failed to send email');
    } finally {
      setIsSending(false);
    }
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative bg-gray-900 border border-white/10 rounded-xl p-6 max-w-md w-full"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">
                Share Health Report
              </h3>
              <button
                onClick={onClose}
                className="p-1 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Share link */}
              <div>
                <label className="text-sm text-gray-400 mb-2 block">
                  Share Link (expires in 30 days)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={shareLink}
                    readOnly
                    className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-gray-300 text-sm"
                  />
                  <button
                    onClick={copyToClipboard}
                    className="px-3 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 rounded-lg transition-colors"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              
              {/* Email option */}
              <div>
                <label className="text-sm text-gray-400 mb-2 block">
                  Send to Doctor's Email (optional)
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="doctor@example.com"
                    className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-gray-300 text-sm placeholder-gray-500"
                  />
                  <button
                    onClick={sendEmail}
                    disabled={!email || isSending}
                    className="px-3 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Mail className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {/* Security note */}
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <p className="text-xs text-yellow-400">
                  This link provides read-only access to your selected health stories. 
                  It will expire automatically after 30 days.
                </p>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}