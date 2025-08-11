'use client';

import OracleEnhanced from '@/components/oracle/OracleEnhanced';
import UnifiedAuthGuard from '@/components/UnifiedAuthGuard';

export const dynamic = 'force-dynamic';

export default function OracleEnhancedPage() {
  return (
    <UnifiedAuthGuard requireAuth={true}>
      <OracleEnhanced />
    </UnifiedAuthGuard>
  );
}