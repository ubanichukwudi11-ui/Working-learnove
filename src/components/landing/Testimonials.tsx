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
    metric: "Moderated Live Stage",
    text: "Keeping students as profile avatars until I approve a raised hand keeps my 40-learner class calm, focused, and easy to run even on average mobile data.",
  },
  {
    name: "Engr. Nnamdi Okafor",
    role: "Parent · Abuja",
    metric: "Real-Time Term Tracking",
    text: "I can check my son's live attendance, CBT practice progress, and term report card between work meetings without waiting for end-of-term open day.",
  },
];

export default function Testimonials() {
  const [featured, ...secondary] = testimonials;

  return (
    <section
      id="about"
      className="bg-white py-20 lg:py-24 px-4 sm:px-6 lg:px-8 border-b border-[#E4E1F5]"
    >
      <div className="mx-auto max-w-7xl space-y-12">
        <div className="grid lg:grid-cols-12 gap-6 items-end">
          <div className="lg:col-span-7 min-w-0">
            <p className="landing-mono text-xs font-semibold uppercase tracking-[0.18em] text-[#6D28D9]">
              About Learnova · Outcomes Across Nigeria
            </p>
            <h2 className="landing-display mt-2 text-3xl sm:text-4xl font-bold tracking-[-0.02em] text-[#0B1230]">
              Built for Nigerian schools, trusted by students, teachers, and parents
            </h2>
          </div>
          <p className="lg:col-span-5 min-w-0 text-sm sm:text-base text-slate-600 leading-relaxed">
            Learnova brings together structured NERDC curriculum video lessons,
            low-bandwidth live classes, Nova AI tutoring, and verifiable term
            analytics in one unified digital school ecosystem.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-6 items-stretch">
          {/* Featured Outcome Quote */}
          <div className="lg:col-span-6 min-w-0 learnova-ambient-stage-soft rounded-3xl bg-gradient-to-br from-[#0B1230] via-[#141B46] to-[#231955] text-white border border-indigo-900/50 p-7 sm:p-9 flex flex-col justify-between gap-8">
            <div className="space-y-4">
              <p className="landing-mono text-xs font-semibold uppercase tracking-wider text-[#22D3EE]">
                {featured.metric}
              </p>
              <p className="landing-display text-xl sm:text-2xl font-semibold text-white leading-snug">
                &ldquo;{featured.text}&rdquo;
              </p>
            </div>

            <div className="pt-5 border-t border-white/15">
              <p className="text-sm font-bold text-white">{featured.name}</p>
              <p className="text-xs text-indigo-200/80 mt-0.5">{featured.role}</p>
            </div>
          </div>

          {/* Stacked Secondary Quotes */}
          <div className="lg:col-span-6 min-w-0 grid gap-6">
            {secondary.map((item) => (
              <div
                key={item.name}
                className="rounded-3xl border border-[#E4E1F5] bg-[#FAF8FF] p-7 flex flex-col justify-between gap-5"
              >
                <div className="space-y-2.5">
                  <p className="landing-mono text-xs font-semibold uppercase tracking-wider text-[#6D28D9]">
                    {item.metric}
                  </p>
                  <p className="text-base text-[#1E1B4B] leading-relaxed">
                    &ldquo;{item.text}&rdquo;
                  </p>
                </div>

                <div className="pt-4 border-t border-[#E4E1F5] flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-[#0B1230]">
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