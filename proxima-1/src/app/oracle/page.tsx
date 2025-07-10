'use client';

import OracleFullScreen from '@/components/OracleFullScreen';
import OnboardingGuard from '@/components/OnboardingGuard';

export default function OraclePage() {
  return (
    <OnboardingGuard>
      <OracleFullScreen />
    </OnboardingGuard>
  );
}