"use client";

import Button from "@/components/ui/Button";

export default function CTA() {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-[#0B1F3A] text-white">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h2
            className="text-2xl sm:text-3xl font-bold tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Ready for the Second Term on Learnova?
          </h2>
          <p className="mt-2 text-slate-300 text-sm sm:text-base max-w-xl">
            Join as a student, teacher, parent, or school administrator and step into a calmer, more effective digital classroom.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 shrink-0">
          <Button href="/register" variant="amber" size="lg">
            Create Free Account
          </Button>
          <Button href="/login" variant="outline" size="lg">
            Sign In
          </Button>
        </div>
      </div>
    </section>
  );
}