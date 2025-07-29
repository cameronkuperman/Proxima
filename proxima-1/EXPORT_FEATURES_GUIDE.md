# 📤 Export Features Implementation Guide

Quick reference for implementing PDF export and doctor sharing functionality.

## 🎨 Frontend Implementation

### 1. Update Export Buttons

```typescript
// src/components/intelligence/NarrativeView.tsx
// Update the export section with actual functionality

const exportAsPDF = async () => {
  if (!user?.id || !story) return;
  
  setIsExporting(true);
  try {
    const response = await fetch(`${API_URL}/api/export-pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: user.id,
        story_ids: [story.id],
        include_analysis: true,
        include_notes: !!storyNote
      })
    });
    
    const data = await response.json();
    
    if (data.pdf_url) {
      // Open PDF in new tab
      window.open(data.pdf_url, '_blank');
    }
  } catch (error) {
    console.error('PDF export failed:', error);
    toast.error('Failed to export PDF');
  } finally {
    setIsExporting(false);
  }
};

const shareWithDoctor = async () => {
  if (!user?.id || !story) return;
  
  setIsSharing(true);
  try {
    const response = await fetch(`${API_URL}/api/share-with-doctor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: user.id,
        story_ids: [story.id],
        expires_in_days: 30
      })
    });
    
    const data = await response.json();
    
    if (data.share_link) {
      // Show share modal with link
      setShareLink(data.share_link);
      setShowShareModal(true);
    }
  } catch (error) {
    console.error('Share failed:', error);
    toast.error('Failed to create share link');
  } finally {
    setIsSharing(false);
  }
};

// Update the buttons
<div className="flex justify-end gap-3">
  <button 
    onClick={exportAsPDF}
    disabled={isExporting}
    className="px-4 py-2 text-sm text-gray-400 hover:text-white border border-white/[0.08] hover:border-white/[0.15] rounded-lg transition-all disabled:opacity-50"
  >
    {isExporting ? 'Exporting...' : 'Export as PDF'}
  </button>
  <button 
    onClick={shareWithDoctor}
    disabled={isSharing}
    className="px-4 py-2 text-sm text-gray-400 hover:text-white border border-white/[0.08] hover:border-white/[0.15] rounded-lg transition-all disabled:opacity-50"
  >
    {isSharing ? 'Creating link...' : 'Share with Doctor'}
  </button>
</div>
```

### 2. Share Modal Component

```typescript
// src/components/modals/ShareModal.tsx
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Copy, Mail, Check } from 'lucide-react';

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
      await fetch(`${API_URL}/api/share-with-doctor`, {
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
            <h3 className="text-xl font-semibold text-white mb-4">
              Share Health Report
            </h3>
            
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
```

### 3. Multiple Story Selection

```typescript
// For exporting multiple stories at once
interface ExportMultipleProps {
  stories: Episode[];
  onExport: (storyIds: string[]) => void;
}

export function ExportMultiple({ stories, onExport }: ExportMultipleProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white">Select Stories to Export</h3>
      
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {stories.map((story) => (
          <label
            key={story.id}
            className="flex items-center gap-3 p-3 bg-white/[0.02] rounded-lg hover:bg-white/[0.03] cursor-pointer"
          >
            <input
              type="checkbox"
              checked={selectedIds.includes(story.id)}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedIds([...selectedIds, story.id]);
                } else {
                  setSelectedIds(selectedIds.filter(id => id !== story.id));
                }
              }}
              className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-purple-500"
            />
            <div className="flex-1">
              <p className="text-sm text-white">{story.title}</p>
              <p className="text-xs text-gray-400">{story.date}</p>
            </div>
          </label>
        ))}
      </div>
      
      <div className="flex justify-end gap-3">
        <button
          onClick={() => onExport(selectedIds)}
          disabled={selectedIds.length === 0}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50"
        >
          Export {selectedIds.length} {selectedIds.length === 1 ? 'Story' : 'Stories'}
        </button>
      </div>
    </div>
  );
}
```

## 🎯 Quick Implementation Steps

1. **Backend First**:
   - Deploy the PDF generation endpoint
   - Set up S3 or cloud storage for PDFs
   - Implement share link generation

2. **Frontend Updates**:
   - Add loading states to buttons
   - Implement share modal
   - Add toast notifications

3. **Security**:
   - Validate share tokens
   - Set appropriate CORS headers
   - Implement rate limiting

4. **Testing**:
   - Test PDF generation with various story lengths
   - Verify share links expire correctly
   - Test email notifications

## 🔒 Security Considerations

```python
# Secure share link generation
import secrets
import hashlib

def generate_secure_share_token(user_id: str, story_ids: List[str]) -> str:
    """Generate a secure, unguessable share token"""
    # Create a unique identifier
    data = f"{user_id}:{':'.join(sorted(story_ids))}:{datetime.utcnow().isoformat()}"
    
    # Generate random component
    random_component = secrets.token_urlsafe(32)
    
    # Create hash for verification
    hash_component = hashlib.sha256(data.encode()).hexdigest()[:16]
    
    # Combine for final token
    return f"{random_component}-{hash_component}"
```

## 📱 Mobile Considerations

```typescript
// Responsive export menu for mobile
const MobileExportMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-400 hover:text-white"
      >
        <MoreVertical className="w-5 h-5" />
      </button>
      
      {isOpen && (
        <div className="absolute right-0 top-10 bg-gray-900 border border-white/10 rounded-lg shadow-xl">
          <button
            onClick={exportAsPDF}
            className="w-full px-4 py-3 text-left text-sm hover:bg-white/5"
          >
            Export as PDF
          </button>
          <button
            onClick={shareWithDoctor}
            className="w-full px-4 py-3 text-left text-sm hover:bg-white/5"
          >
            Share with Doctor
          </button>
        </div>
      )}
    </div>
  );
};
```

This completes the export features implementation!