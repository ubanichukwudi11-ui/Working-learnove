"use client";

import Link from "next/link";
import Button from "@/components/ui/Button";
import Logo from "@/components/branding/Logo";

const links = [
  { name: "Features", href: "#features" },
  { name: "Live Classes", href: "#live" },
  { name: "Pricing", href: "#pricing" },
  { name: "About", href: "#footer" },
];

export default function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-slate-800/50 bg-[#0F172A]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
        <Logo />

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="text-slate-300 transition hover:text-white"
            >
              {link.name}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Button href="/login" variant="ghost">Login</Button>
          <Button href="/register">Get Started</Button>
        </div>
      </div>
    </header>
  );
}