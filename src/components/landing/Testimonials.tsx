"use client";

const testimonials = [
  {
    name: "Toluwani Adeyemi",
    role: "SSS 3 Student · Lagos",
    metric: "58% → 84% WAEC Mock",
    text: "Joining live Mathematics and Physics revisions after school helped me raise my WAEC mock score from 58% to 84% in one term. Being able to snap my rough workbook steps for Nova to verify changed how I revise.",
  },
  {
    name: "Mrs. Funke Adewale",
    role: "Senior Mathematics Teacher · Ibadan",
    metric: "40+ Learner Stage Control",
    text: "Approving students onto the live stage only when they raise their hands keeps my 40-student class orderly even on average mobile data.",
  },
  {
    name: "Engr. Nnamdi Okafor",
    role: "Parent · Abuja",
    metric: "Real-Time Term Tracking",
    text: "I can check my son's attendance, homework submissions, and term scores between work meetings without waiting for end-of-term open day.",
  },
];

export default function Testimonials() {
  const [featured, ...secondary] = testimonials;

  return (
    <section className="bg-white py-20 lg:py-24 px-4 sm:px-6 lg:px-8 border-b border-slate-200">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-2xl">
          <p className="landing-mono text-xs font-semibold uppercase tracking-[0.18em] text-[#0D9488]">
            Trusted Across Nigeria
          </p>
          <h2 className="landing-display mt-2 text-3xl sm:text-4xl font-bold tracking-[-0.025em] text-[#0B1F3A]">
            Proven outcomes for students, educators, and parents
          </h2>
        </div>

        <div className="mt-12 grid lg:grid-cols-12 gap-6 items-stretch">
          {/* Featured Outcome Quote */}
          <div className="lg:col-span-6 rounded-2xl bg-[#FAF8F4] border border-slate-200 p-8 sm:p-9 flex flex-col justify-between gap-8">
            <div className="space-y-4">
              <p className="landing-mono text-xs font-semibold uppercase tracking-wider text-[#D97706]">
                {featured.metric}
              </p>
              <p className="landing-display text-xl sm:text-2xl font-semibold text-[#0B1F3A] leading-snug">
                &ldquo;{featured.text}&rdquo;
              </p>
            </div>

            <div className="pt-5 border-t border-slate-200">
              <p className="text-sm font-bold text-[#0B1F3A]">{featured.name}</p>
              <p className="text-xs text-slate-500 mt-0.5">{featured.role}</p>
            </div>
          </div>

          {/* Stacked Secondary Quotes */}
          <div className="lg:col-span-6 grid gap-6">
            {secondary.map((item) => (
              <div
                key={item.name}
                className="rounded-2xl border border-slate-200 bg-white p-7 flex flex-col justify-between gap-5"
              >
                <div className="space-y-2.5">
                  <p className="landing-mono text-xs font-semibold uppercase tracking-wider text-[#0D9488]">
                    {item.metric}
                  </p>
                  <p className="text-base text-slate-700 leading-relaxed">
                    &ldquo;{item.text}&rdquo;
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-[#0B1F3A]">
                      {item.name}
                    </p>
                    <p className="text-xs text-slate-500">{item.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}