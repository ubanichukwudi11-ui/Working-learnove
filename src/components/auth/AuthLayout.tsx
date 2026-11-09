"use client";

import BrandingPanel from "./BrandingPanel";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">

      <div className="mx-auto flex min-h-screen max-w-7xl">

        {/* Left Side */}
        <BrandingPanel />

        {/* Right Side */}
        <div className="flex flex-1 items-center justify-center p-6 lg:p-12">

          <div
            className="
              w-full
              max-w-md
              rounded-3xl
              border
              border-slate-800
              bg-slate-900/80
              p-8
              shadow-2xl
              backdrop-blur
            "
          >
            {children}
          </div>

        </div>

      </div>

    </div>
  );
}