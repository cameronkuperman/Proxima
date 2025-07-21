// Public pages (normal users that are not logged in / authenticated can browse, OAuth users get redirected - ex logged in users can use the hero page and be chill)
<UnifiedAuthGuard requireAuth={false}>
  <HomePage />
</UnifiedAuthGuard>

// Protected pages (requires login and user to be authenticated + complete onboarding)
<UnifiedAuthGuard requireAuth={true}>
  <DashboardPage />
</UnifiedAuthGuard>

// Onboarding (requires the user to login but also allows incomplete onboarding - main use is just for onboarding)
<UnifiedAuthGuard requireAuth={true} allowIncompleteOnboarding={true}>
  <OnboardingPage />
</UnifiedAuthGuard>

// DO NOT TOUCH THE UNIFIEDAUTHGUARD SYSTEM, THERE IS NO NEED TO, FOR OUR USE CASE THERE IS NO OTHER POSSIBILITIES THAT ARE NEEDED AT OUR CURRENT USE CASE. ALL PAGES SHOULD BE WRAPPED IN THIS.