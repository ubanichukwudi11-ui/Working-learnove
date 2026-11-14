import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import NovaShowcase from "@/components/landing/NovaShowcase";
import LiveClasses from "@/components/landing/LiveClasses";
import Statistics from "@/components/landing/Statistics";
import Testimonials from "@/components/landing/Testimonials";
import Pricing from "@/components/landing/Pricing";
import CTA from "@/components/landing/CTA";
import Footer from "@/components/landing/Footer";

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#F7F8FA] text-[#0F1F38] selection:bg-[#0D9488]/20">
      <Navbar />
      <Hero />
      <Statistics />
      <Features />
      <LiveClasses />
      <NovaShowcase />
      <Testimonials />
      <Pricing />
      <CTA />
      <Footer />
    </main>
  );
}
