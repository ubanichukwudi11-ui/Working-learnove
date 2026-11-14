"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";

type BillingCycle = "monthly" | "term";

export default function Pricing() {
  const [cycle, setCycle] = useState<BillingCycle>("monthly");

  const plans = [
    {
      name: "Starter Learner",
      price: "₦0",
      cadence: "Free forever",
      description: "Essential access for independent JSS & SSS revision.",
      features: [
        "Core subject outlines & notes",
        "5 Nova AI study questions daily",
        "Weekly timetable & study planner",
      ],
      cta: "Get Started Free",
      href: "/register/student",
      featured: false,
    },
    {
      name: "Scholar Term Plan",
      price: cycle === "monthly" ? "₦4,500" : "₦12,000",
      cadence:
        cycle === "monthly"
          ? "per month · or ₦12,000 / term"
          : "per full school term · save 11% vs monthly",
      description: "Full access for WAEC, NECO & JAMB preparation.",
      features: [
        "Unlimited Live Interactive Classes",
        "All Subject → Term → Topic Video Lessons",
        "Unlimited Nova AI explanations & CBT drills",
        "Parent progress monitoring & PDF report cards",
      ],
      cta: "Get Started",
      href: "/register/student",
      featured: true,
    },
    {
      name: "School Cohort",
      price: "₦1,800",
      cadence: "per student / term (min. 50)",
      description: "Complete digital campus for secondary schools.",
      features: [
        "Dedicated Teacher & Admin Workspaces",
        "School-wide WAT Timetable & Attendance",
        "Term report analytics & parent portal",
        "Onboarding support for teachers",
      ],
      cta: "Apply as Teacher / School",
      href: "/register/teacher",
      featured: false,
    },
  ];

  return (
    <section
      id="pricing"
      className="bg-[#F5F3FF] py-20 lg:py-24 px-4 sm:px-6 lg:px-8 border-b border-[#E4E1F5]"
    >
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="landing-mono text-xs font-semibold uppercase tracking-[0.18em] text-[#6D28D9]">
              Transparent Naira Plans
            </p>
            <h2 className="landing-display mt-2 text-3xl sm:text-4xl font-bold tracking-[-0.02em] text-[#0B1230]">
              Accessible plans for learners, families, and schools
            </h2>
          </div>

          <div
            role="tablist"
            aria-label="Scholar billing cadence"
            className="inline-flex self-start md:self-auto rounded-xl bg-white p-1 border border-[#E4E1F5]"
          >
            <button
              type="button"
              role="tab"
              aria-selected={cycle === "monthly"}
              onClick={() => setCycle("monthly")}
              className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                cycle === "monthly"
                  ? "bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] text-white"
                  : "text-slate-600 hover:text-[#0B1230]"
              }`}
            >
              Monthly View
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={cycle === "term"}
              onClick={() => setCycle("term")}
              className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                cycle === "term"
                  ? "bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] text-white"
                  : "text-slate-600 hover:text-[#0B1230]"
              }`}
            >
              Per Term View
            </button>
          </div>
        </div>

        <div className="mt-10 grid lg:grid-cols-3 gap-6 items-stretch">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-3xl p-7 sm:p-8 flex flex-col justify-between transition-colors ${
                plan.featured
                  ? "bg-gradient-to-br from-[#0B1230] via-[#131946] to-[#231955] text-white border-2 border-[#7C3AED] shadow-xl shadow-indigo-950/20"
                  : "bg-white text-[#0B1230] border border-[#E4E1F5]"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="landing-display text-lg font-bold">
                    {plan.name}
                  </h3>
                  {plan.featured && (
                    <span className="landing-mono text-[11px] font-semibold uppercase tracking-wider text-[#22D3EE]">
                      Recommended
                    </span>
                  )}
                </div>

                <div className="mt-5">
                  <span className="landing-display text-4xl font-extrabold tabular-nums">
                    {plan.price}
                  </span>
                  <span
                    className={`block text-xs mt-1.5 landing-mono ${
                      plan.featured ? "text-indigo-200/80" : "text-slate-500"
                    }`}
                  >
                    {plan.cadence}
                  </span>
                </div>

                <p
                  className={`mt-4 text-sm leading-relaxed ${
                    plan.featured ? "text-indigo-100/85" : "text-slate-600"
                  }`}
                >
                  {plan.description}
                </p>

                <ul
                  className={`mt-6 pt-6 border-t space-y-3 text-sm ${
                    plan.featured ? "border-white/15" : "border-[#E4E1F5]"
                  }`}
                >
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5">
                      <Check
                        size={16}
                        className={`mt-0.5 shrink-0 ${
                          plan.featured ? "text-[#22D3EE]" : "text-[#6D28D9]"
                        }`}
                      />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                href={plan.href}
                className={`mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl py-3 px-4 text-sm font-bold transition-all ${
                  plan.featured
                    ? "bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] hover:from-[#8B5CF6] hover:to-[#4338CA] text-white shadow-md shadow-[#7C3AED]/25"
                    : "border border-[#E4E1F5] bg-[#FAF8FF] hover:bg-[#EDE9FE] text-[#1E1B4B]"
                }`}
              >
                {plan.cta}
                <ArrowRight size={15} />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}