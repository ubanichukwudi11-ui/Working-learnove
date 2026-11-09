"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

import RoleSidebar from "./RoleSidebar";
import AppNavbar from "./AppNavbar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const {
    user,
    loading,
    logout,
  } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F172A] text-white">
        Loading...
      </div>
    );
  }

  if (!user) {
    router.replace("/login");
    return null;
  }

  const handleLogout = () => {
    logout();

    router.replace("/login");
  };

  return (
    <div
      className="
        min-h-screen
        bg-[#0F172A]
        text-white
      "
    >
      {/* Dynamic Sidebar */}
      <RoleSidebar role={user.role} />

      {/* Main Content */}
      <div
        className="
          pl-20
          transition-all
          duration-300
        "
      >
        {/* Navbar */}
        <AppNavbar
          user={user}
          onLogout={handleLogout}
        />

        {/* Page */}
        <main
          className="
            pt-24
            p-6
            min-h-screen
          "
        >
          {children}
        </main>
      </div>
    </div>
  );
}