"use client";

import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

const plans = [
  {
    name: "Free",
    price: "₦0",
    features: ["Nova AI (Limited)", "Basic Notes", "Community Support"],
  },
  {
    name: "Pro",
    price: "₦5,000/mo",
    features: [
      "Unlimited Nova AI",
      "Live Classes",
      "Analytics",
      "Assignments",
    ],
    popular: true,
  },
  {
    name: "School",
    price: "Custom",
    features: [
      "Unlimited Students",
      "Admin Dashboard",
      "Teacher Portal",
      "Parent Portal",
    ],
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="py-28 bg-[#111827] px-6">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-center text-5xl font-black">
          Simple Pricing
        </h2>

        <div className="grid lg:grid-cols-3 gap-8 mt-16">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              hover
              className={`p-8 ${
                plan.popular ? "border-violet-500" : ""
              }`}
            >
              {plan.popular && (
                <span className="bg-violet-600 px-3 py-1 rounded-full text-sm">
                  Most Popular
                </span>
              )}

              <h3 className="text-3xl font-bold mt-6">
                {plan.name}
              </h3>

              <p className="text-5xl font-black mt-4">
                {plan.price}
              </p>

              <ul className="space-y-3 mt-8">
                {plan.features.map((feature) => (
                  <li key={feature}>✅ {feature}</li>
                ))}
              </ul>

              <Button fullWidth className="mt-8">
                Choose Plan
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}