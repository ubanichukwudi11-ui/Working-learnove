"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import WelcomeHeader from "@/components/dashboard/WelcomeHeader";
import ContinueLearningCard from "@/components/dashboard/ContinueLearningCard";
import QuickStats from "@/components/dashboard/QuickStats";
import SubjectGrid from "@/components/dashboard/SubjectGrid";
import NovaRecommendation from "@/components/dashboard/NovaRecommendation";
import AnalyticsPreview from "@/components/dashboard/AnalyticsPreview";
import RightPanel from "@/components/dashboard/RightPanel";

export default function DashboardPage() {
  return (
    <ProtectedRoute roles={["STUDENT"]}>
      <AppLayout>
        <div className="grid xl:grid-cols-[1fr_320px] gap-6 items-start">
          <div>
            <WelcomeHeader />
            <ContinueLearningCard />
            <QuickStats />
            <SubjectGrid />
            <NovaRecommendation />
            <AnalyticsPreview />
          </div>

          <div>
            <RightPanel />
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}