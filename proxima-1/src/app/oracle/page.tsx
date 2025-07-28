'use client';

import OracleFullScreen from '@/components/OracleFullScreen';
import UnifiedAuthGuard from '@/components/UnifiedAuthGuard';

export const dynamic = 'force-dynamic';

export default function OraclePage() {
  return (
    <UnifiedAuthGuard requireAuth={true}>
      <OracleFullScreen />
    </UnifiedAuthGuard>
  );
}