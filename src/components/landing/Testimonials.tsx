"use client";

const testimonials = [
  {
    name: "Toluwani Adeyemi",
    role: "SSS 3 Student · Lagos",
    text: "Joining live Mathematics and Physics revisions after school helped me raise my WAEC mock score from 58% to 84% in one term.",
  },
  {
    name: "Mrs. Funke Adewale",
    role: "Senior Mathematics Teacher · Ibadan",
    text: "Approving students onto the live stage only when they raise their hands keeps my 40-student class orderly even on average mobile data.",
  },
  {
    name: "Engr. Nnamdi Okafor",
    role: "Parent · Abuja",
    text: "I can check my son's attendance, homework submissions, and term scores between work meetings without waiting for end-of-term open day.",
  },
];

export default function Testimonials() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-widest text-[#0D9488]">
            Trusted Across Nigeria
          </p>
          <h2
            className="mt-2 text-3xl sm:text-4xl font-bold text-[#0B1F3A] tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Built with students, teachers, and parents
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mt-10">
          {testimonials.map((item) => (
            <div
              key={item.name}
              className="rounded-2xl border border-slate-200 bg-[#FAF8F3] p-6 flex flex-col justify-between"
            >
              <p className="text-sm text-slate-700 leading-relaxed">
                &ldquo;{item.text}&rdquo;
              </p>

              <div className="mt-6 pt-4 border-t border-slate-200/80">
                <p className="text-sm font-bold text-[#0B1F3A]">{item.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{item.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}