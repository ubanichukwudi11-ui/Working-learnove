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
      cta: "Start Free",
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
        "Unlimited Nova AI explanations & CBT drills",
        "Assignment grading & class recordings",
        "Parent progress monitoring link",
      ],
      cta: "Enroll Now",
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
      cta: "Contact School Desk",
      href: "/register/teacher",
      featured: false,
    },
  ];

  return (
    <section
      id="pricing"
      className="bg-[#FAF8F4] py-20 lg:py-24 px-4 sm:px-6 lg:px-8 border-b border-slate-200"
    >
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="landing-mono text-xs font-semibold uppercase tracking-[0.18em] text-[#D97706]">
              Transparent Naira Pricing
            </p>
            <h2 className="landing-display mt-2 text-3xl sm:text-4xl font-bold tracking-[-0.025em] text-[#0B1F3A]">
              Accessible plans for families and schools
            </h2>
          </div>

          <div
            role="tablist"
            aria-label="Scholar billing cadence"
            className="inline-flex self-start md:self-auto rounded-xl bg-white p-1 border border-slate-200"
          >
            <button
              type="button"
              role="tab"
              aria-selected={cycle === "monthly"}
              onClick={() => setCycle("monthly")}
              className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                cycle === "monthly"
                  ? "bg-[#0B1F3A] text-white"
                  : "text-slate-600 hover:text-[#0B1F3A]"
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
                  ? "bg-[#0B1F3A] text-white"
                  : "text-slate-600 hover:text-[#0B1F3A]"
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
              className={`rounded-2xl p-7 sm:p-8 flex flex-col justify-between transition-colors ${
                plan.featured
                  ? "bg-[#0B1F3A] text-white border-2 border-[#0D9488] shadow-xl"
                  : "bg-white text-[#0F1F38] border border-slate-200"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="landing-display text-lg font-bold">
                    {plan.name}
                  </h3>
                  {plan.featured && (
                    <span className="landing-mono text-[11px] font-semibold uppercase tracking-wider text-[#F59E0B]">
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
                      plan.featured ? "text-slate-300" : "text-slate-500"
                    }`}
                  >
                    {plan.cadence}
                  </span>
                </div>

                <p
                  className={`mt-4 text-sm leading-relaxed ${
                    plan.featured ? "text-slate-300" : "text-slate-600"
                  }`}
                >
                  {plan.description}
                </p>

                <ul className="mt-6 pt-6 border-t border-current/10 space-y-3 text-sm">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5">
                      <Check
                        size={16}
                        className={`mt-0.5 shrink-0 ${
                          plan.featured ? "text-[#2DD4BF]" : "text-[#0D9488]"
                        }`}
                      />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                href={plan.href}
                className={`mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl py-3 px-4 text-sm font-bold transition-colors ${
                  plan.featured
                    ? "bg-[#0D9488] hover:bg-[#0F766E] text-white"
                    : "border border-slate-300 bg-white hover:bg-slate-50 text-[#0B1F3A]"
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