import OnboardingFlow from '@/components/OnboardingFlow';
import AuthGuard from '@/components/AuthGuard';

export default function OnboardingPage() {
  return (
    <AuthGuard requireAuth={true}>
      <OnboardingFlow />
    </AuthGuard>
  );
} 