"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getDashboardRoute } from "@/lib/getDashboardRoute";

type Props = {
  children: React.ReactNode;
  roles?: string[];
};

export default function ProtectedRoute({ children, roles }: Props) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F8FA]">
        <div className="text-center space-y-2">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-[#0D9488] border-t-transparent mx-auto" />
          <p className="text-xs font-semibold text-slate-600">
            Verifying your Learnova session...
          </p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  if (roles && !roles.includes(user.role)) {
    const homeHref = getDashboardRoute(user.role);
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xs space-y-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <ShieldAlert size={24} />
          </div>
          <h1 className="text-xl font-extrabold text-[#0B1F3A]">
            Access Restricted
          </h1>
          <p className="text-xs text-slate-600 leading-relaxed">
            Your signed-in role (<strong>{user.role.replace("_", " ")}</strong>) does not have permission to open this workspace.
          </p>
          <Link
            href={homeHref}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#0B1F3A] hover:bg-[#143258] text-white text-xs font-bold transition"
          >
            <ArrowLeft size={14} />
            Return to Your Workspace
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}