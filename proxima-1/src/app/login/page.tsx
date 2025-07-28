import LiquidGlassLogin from "@/components/LiquidGlassLogin";
import UnifiedAuthGuard from "@/components/UnifiedAuthGuard";

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  return (
    <UnifiedAuthGuard requireAuth={false}>
      <LiquidGlassLogin />
    </UnifiedAuthGuard>
  );
}
