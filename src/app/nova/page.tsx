import { Suspense } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { CardSkeleton } from "@/components/ui";
import NovaChat from "@frontend/components/nova/NovaChat";

export default function NovaPage() {
  return (
    <AppLayout>
      <Suspense fallback={<CardSkeleton lines={6} />}>
        <NovaChat />
      </Suspense>
    </AppLayout>
  );
}