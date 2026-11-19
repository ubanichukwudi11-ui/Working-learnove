"use client";

import BrandingPanel from "./BrandingPanel";
import Logo from "@/components/branding/Logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--background)] bg-learnova-dots-lavender flex flex-col lg:flex-row">
      <BrandingPanel />

      <div className="flex flex-1 flex-col items-center justify-center p-5 sm:p-8 lg:p-12">
        <div className="mb-6 lg:hidden">
          <Logo href="/" variant="learnova" />
        </div>

        <div className="w-full max-w-md learnova-ambient-stage-soft learnova-card-glow rounded-2xl p-6 sm:p-8 text-[var(--foreground)]">
          {children}
        </div>
      </div>
    </div>
  );
}