import { Suspense } from "react";
import AppLayout from "@/components/layout/AppLayout";
import NovaChat from "@frontend/components/nova/NovaChat";

export default function NovaPage() {
  return (
    <AppLayout>
      <Suspense
        fallback={
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-sm text-slate-500">
            Loading Nova Classroom Workspace...
          </div>
        }
      >
        <NovaChat />
      </Suspense>
    </AppLayout>
  );
}