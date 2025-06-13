import NavBar from "@/components/NavBar";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Testimonials from "@/components/Testimonials";
import Contact from "@/components/Contact";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-stretch bg-[#F7F9FB] text-[#202225]">
      <NavBar />
      <Hero />
      <About />
      <Testimonials />
      <Contact />
    </main>
  );
}
