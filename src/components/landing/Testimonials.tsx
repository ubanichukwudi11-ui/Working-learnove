"use client";

import Card from "@/components/ui/Card";

const testimonials = [
  {
    name: "David",
    role: "WAEC Student",
    text: "Learnova helped me improve my grades and understand difficult topics with Nova AI.",
  },
  {
    name: "Grace",
    role: "Teacher",
    text: "Managing assignments and live classes has never been this easy.",
  },
  {
    name: "Mrs. Okafor",
    role: "Parent",
    text: "I can now monitor my child's attendance and academic progress from anywhere.",
  },
];

export default function Testimonials() {
  return (
    <section className="py-28 bg-[#0F172A] px-6">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-center text-5xl font-black">
          Loved by Students, Teachers & Parents
        </h2>

        <div className="grid md:grid-cols-3 gap-8 mt-16">
          {testimonials.map((item) => (
            <Card key={item.name} hover className="p-8">
              <div className="text-yellow-400 text-xl">
                ★★★★★
              </div>

              <p className="mt-6 text-slate-300 leading-7">
                "{item.text}"
              </p>

              <div className="mt-8">
                <h3 className="font-bold">
                  {item.name}
                </h3>

                <p className="text-slate-400">
                  {item.role}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}