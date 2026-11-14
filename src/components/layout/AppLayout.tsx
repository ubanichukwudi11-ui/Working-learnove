"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

import RoleSidebar from "./RoleSidebar";
import AppNavbar from "./AppNavbar";
import MobileBottomNav from "./MobileBottomNav";
import {
  OfflineIndicator,
  ServiceWorkerRegistrar,
} from "@frontend/components/pwa/PwaSupport";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F8FA] text-[#0B1F3A]">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 rounded-full border-2 border-[#0B1F3A] border-t-transparent animate-spin mx-auto" />
          <p className="text-sm font-medium text-slate-600">Loading Learnova workspace...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#0F1F38]">
      <ServiceWorkerRegistrar />
      <RoleSidebar role={user.role} />

      <div className="md:pl-20 lg:pl-60 transition-all duration-200 min-h-screen flex flex-col">
        <AppNavbar user={user} onLogout={handleLogout} />

        <main className="flex-1 pt-20 pb-24 md:pb-10 px-4 sm:px-6 lg:px-8 max-w-[1440px] w-full mx-auto">
          {children}
        </main>
      </div>

      <OfflineIndicator />
      <MobileBottomNav role={user.role} />
    </div>
  );
}