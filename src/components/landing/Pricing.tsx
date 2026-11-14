"use client";

import Button from "@/components/ui/Button";
import { Check } from "lucide-react";

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
    price: "₦4,500",
    cadence: "per month · or ₦12,000 / term",
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

export default function Pricing() {
  return (
    <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-[#FAF8F3] border-t border-slate-200">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-widest text-[#D97706]">
            Transparent Naira Pricing
          </p>
          <h2
            className="mt-2 text-3xl sm:text-4xl font-bold text-[#0B1F3A] tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Accessible plans for families and schools
          </h2>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mt-10">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl p-7 flex flex-col justify-between ${
                plan.featured
                  ? "bg-[#0B1F3A] text-white border-2 border-[#0D9488] shadow-xl"
                  : "bg-white text-[#0F1F38] border border-slate-200 shadow-xs"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-lg font-bold">{plan.name}</h3>
                  {plan.featured && (
                    <span className="text-xs font-bold text-[#F59E0B]">
                      Recommended
                    </span>
                  )}
                </div>

                <div className="mt-4">
                  <span className="text-4xl font-extrabold tabular-nums">
                    {plan.price}
                  </span>
                  <span
                    className={`block text-xs mt-1 ${
                      plan.featured ? "text-slate-300" : "text-slate-500"
                    }`}
                  >
                    {plan.cadence}
                  </span>
                </div>

                <p
                  className={`mt-3 text-sm ${
                    plan.featured ? "text-slate-300" : "text-slate-600"
                  }`}
                >
                  {plan.description}
                </p>

                <ul className="mt-6 space-y-2.5 text-sm">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5">
                      <Check
                        size={16}
                        className={`mt-0.5 shrink-0 ${
                          plan.featured ? "text-[#0D9488]" : "text-[#0D9488]"
                        }`}
                      />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Button
                href={plan.href}
                variant={plan.featured ? "secondary" : "outline"}
                fullWidth
                className="mt-8"
              >
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}