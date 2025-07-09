import OnboardingFlow from '@/components/OnboardingFlow';
import AuthGuard from '@/components/AuthGuard';
import OnboardingGuard from '@/components/OnboardingGuard';

export default function OnboardingPage() {
  return (
    <AuthGuard requireAuth={true}>
      <OnboardingGuard>
        <OnboardingFlow />
      </OnboardingGuard>
    </AuthGuard>
  );
} 