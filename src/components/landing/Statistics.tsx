"use client";

const stats = [
  { number: "140+", label: "Nigerian Partner Schools" },
  { number: "38,000+", label: "Active JSS & SSS Learners" },
  { number: "94%", label: "WAEC & JAMB Pass Readiness" },
  { number: "1,200+", label: "Verified Subject Teachers" },
];

export default function Statistics() {
  return (
    <section className="py-14 px-4 sm:px-6 lg:px-8 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-8">
        {stats.map((stat) => (
          <div key={stat.label} className="text-center lg:text-left">
            <p className="text-3xl sm:text-4xl font-extrabold text-[#0B1F3A] tabular-nums">
              {stat.number}
            </p>
            <p className="mt-1.5 text-sm text-slate-600 font-medium">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}