import OnboardingFlow from '@/components/OnboardingFlow';
import UnifiedAuthGuard from '@/components/UnifiedAuthGuard';

export default function OnboardingPage() {
  return (
    <UnifiedAuthGuard requireAuth={true} allowIncompleteOnboarding={true}>
      <OnboardingFlow />
    </UnifiedAuthGuard>
  );
} 