import type { Metadata } from "next";
import { Nunito_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { OnboardingProvider } from "@/contexts/OnboardingContext";
import { TutorialProvider } from "@/contexts/TutorialContext";
import SessionSync from "@/components/SessionSync";

const bodyFont = Nunito_Sans({
  subsets: ["latin"],
  variable: "--font-body",
});

const headingFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading",
});

export const metadata: Metadata = {
  title: "Proxima — Coming Soon",
  description: "Interactive 3D symptom analysis — launching 2025.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${bodyFont.variable} ${headingFont.variable} antialiased bg-[#0a0a0a] text-white`}
      >
        <AuthProvider>
          <OnboardingProvider>
            <TutorialProvider>
              <SessionSync />
              {children}
            </TutorialProvider>
          </OnboardingProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
