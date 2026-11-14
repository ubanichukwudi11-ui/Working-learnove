"use client";

import BrandingPanel from "./BrandingPanel";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#FAF8F3] flex">
      <BrandingPanel />

      <div className="flex flex-1 items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-lg text-[#0F1F38]">
          {children}
        </div>
      </div>
    </div>
  );
}