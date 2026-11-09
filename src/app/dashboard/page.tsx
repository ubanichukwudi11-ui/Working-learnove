"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";

import AppLayout from "@/components/layout/AppLayout";

import FadeIn from "@/components/ui/FadeIn";
import PageTransition from "@/components/animations/PageTransition";

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
      <PageTransition>
        <AppLayout>
          <div
            className="
              grid
              2xl:grid-cols-[1fr_320px]
              gap-6
            "
          >
            <div>
              <FadeIn delay={0.1}>
                <WelcomeHeader />
              </FadeIn>

              <FadeIn delay={0.2}>
                <ContinueLearningCard />
              </FadeIn>

              <FadeIn delay={0.3}>
                <QuickStats />
              </FadeIn>

              <FadeIn delay={0.4}>
                <SubjectGrid />
              </FadeIn>

              <FadeIn delay={0.5}>
                <NovaRecommendation />
              </FadeIn>

              <FadeIn delay={0.6}>
                <AnalyticsPreview />
              </FadeIn>
            </div>

            <div className="hidden 2xl:block">
              <FadeIn delay={0.3}>
                <RightPanel />
              </FadeIn>
            </div>
          </div>
        </AppLayout>
      </PageTransition>
    </ProtectedRoute>
  );
}