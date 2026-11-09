"use client";

import Logo from "@/components/branding/Logo";

export default function Footer() {
  return (
    <footer
      id="footer"
      className="bg-[#0B1220] border-t border-slate-800 py-16"
    >
      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-10">
        <div>
          <Logo />

          <p className="mt-4 text-slate-400">
            AI-powered education platform for modern schools.
          </p>
        </div>

        <div>
          <h3 className="font-bold">Product</h3>

          <ul className="mt-4 space-y-2 text-slate-400">
            <li>Features</li>
            <li>Pricing</li>
            <li>Nova AI</li>
          </ul>
        </div>

        <div>
          <h3 className="font-bold">Company</h3>

          <ul className="mt-4 space-y-2 text-slate-400">
            <li>About</li>
            <li>Contact</li>
            <li>Schools</li>
          </ul>
        </div>

        <div>
          <h3 className="font-bold">Legal</h3>

          <ul className="mt-4 space-y-2 text-slate-400">
            <li>Privacy</li>
            <li>Terms</li>
          </ul>
        </div>
      </div>

      <div className="text-center text-slate-500 mt-16">
        © {new Date().getFullYear()} Learnova. All rights reserved.
      </div>
    </footer>
  );
}