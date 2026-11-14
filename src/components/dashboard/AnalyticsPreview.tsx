import ProgressChart from "@/components/charts/ProgressChart";
import SubjectStrengthChart from "@/components/charts/SubjectStrengthChart";

export default function AnalyticsPreview() {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-bold text-[#0B1230] mb-4">
        Academic Performance Overview
      </h2>
      <div className="grid lg:grid-cols-2 gap-6">
        <ProgressChart />
        <SubjectStrengthChart />
      </div>
    </section>
  );
}