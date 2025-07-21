import LiquidGlassLogin from "@/components/LiquidGlassLogin";
import UnifiedAuthGuard from "@/components/UnifiedAuthGuard";

export default function LoginPage() {
  return (
    <UnifiedAuthGuard requireAuth={false}>
      <LiquidGlassLogin />
    </UnifiedAuthGuard>
  );
}
