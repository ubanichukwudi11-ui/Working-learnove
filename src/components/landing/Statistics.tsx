"use client";

const stats = [
  {
    number: "140+",
    label: "Nigerian Partner Schools",
    detail: "Lagos · Ibadan · Abuja · PH",
  },
  {
    number: "38,000+",
    label: "Active JSS & SSS Learners",
    detail: "Term-structured daily study",
  },
  {
    number: "94%",
    label: "WAEC & JAMB Pass Readiness",
    detail: "Verified mock diagnostics",
  },
  {
    number: "1,200+",
    label: "Verified Subject Teachers",
    detail: "Live & recorded instruction",
  },
];

export default function Statistics() {
  return (
    <section
      aria-label="Learnova Scale Metrics"
      className="bg-white border-b border-slate-200"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200/80">
          {stats.map((stat) => (
            <div key={stat.label} className="py-8 sm:px-6 first:pl-0 last:pr-0">
              <p className="landing-display text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0B1F3A] tabular-nums">
                {stat.number}
              </p>
              <p className="mt-1.5 text-sm font-semibold text-[#0F1F38]">
                {stat.label}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">{stat.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}