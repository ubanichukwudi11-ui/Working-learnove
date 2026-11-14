import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Statistics from "@/components/landing/Statistics";
import Features from "@/components/landing/Features";
import LiveClasses from "@/components/landing/LiveClasses";
import NovaShowcase from "@/components/landing/NovaShowcase";
import PracticeProgressShowcase from "@/components/landing/PracticeProgressShowcase";
import RolePortalsShowcase from "@/components/landing/RolePortalsShowcase";
import Testimonials from "@/components/landing/Testimonials";
import Pricing from "@/components/landing/Pricing";
import CTA from "@/components/landing/CTA";
import Footer from "@/components/landing/Footer";

export default function HomePage() {
  return (
    <main className="landing-body relative min-h-screen overflow-x-hidden bg-[#F5F3FF] text-[#0B1230] selection:bg-[#7C3AED]/20">
      <Navbar />
      <Hero />
      <Statistics />
      <Features />
      <LiveClasses />
      <NovaShowcase />
      <PracticeProgressShowcase />
      <RolePortalsShowcase />
      <Testimonials />
      <Pricing />
      <CTA />
      <Footer />
    </main>
  );
}
