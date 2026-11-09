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
    <main className="relative min-h-screen overflow-x-hidden selection:bg-violet-500/30">
      <Navbar />
      <Hero />
      <Features />
      <NovaShowcase />
      <LiveClasses />
      <Statistics />
      <Testimonials />
      <Pricing />
      <CTA />
      <Footer />
    </main>
  );
}
