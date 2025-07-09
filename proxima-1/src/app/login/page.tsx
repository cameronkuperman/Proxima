import LiquidGlassLogin from "@/components/LiquidGlassLogin";
import AuthGuard from "@/components/AuthGuard";

export default function LoginPage() {
  return (
    <AuthGuard requireAuth={false}>
      <LiquidGlassLogin />
    </AuthGuard>
  );
}
