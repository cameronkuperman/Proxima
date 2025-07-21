import NavBar from "@/components/NavBar";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import Features from "@/components/Features";
import PhotoAnalysis from "@/components/PhotoAnalysis";
import AIPartners from "@/components/AIPartners";
import HealthcarePros from "@/components/HealthcarePros";
import About from "@/components/About";
import Testimonials from "@/components/Testimonials";
import Contact from "@/components/Contact";
import UnifiedAuthGuard from "@/components/UnifiedAuthGuard";

export default function Home() {
  return (
    <UnifiedAuthGuard requireAuth={false}>
      <main className="min-h-screen flex flex-col items-stretch">
        <NavBar />
        <Hero />
        <HowItWorks />
        <Features />
        <PhotoAnalysis />
        <AIPartners />
        <HealthcarePros />
        <About />
        <Testimonials />
        <Contact />
      </main>
    </UnifiedAuthGuard>
  );
}
