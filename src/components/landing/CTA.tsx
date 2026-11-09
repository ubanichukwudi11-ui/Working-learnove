"use client";

import Button from "@/components/ui/Button";

export default function CTA() {
  return (
    <section className="py-28 px-6 bg-gradient-to-r from-violet-700 to-cyan-600">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-5xl font-black">
          Ready to Transform Learning?
        </h2>

        <p className="mt-6 text-xl text-white/90">
          Join thousands of students and schools already using Learnova.
        </p>

        <Button
          href="/register"
          size="lg"
          variant="secondary"
          className="mt-10"
        >
          Get Started Free
        </Button>
      </div>
    </section>
  );
}