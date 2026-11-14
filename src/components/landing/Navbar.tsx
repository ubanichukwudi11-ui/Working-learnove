"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import Button from "@/components/ui/Button";
import Logo from "@/components/branding/Logo";

const links = [
  { name: "Curriculum", href: "#features" },
  { name: "Live Classes", href: "#live" },
  { name: "Nova AI", href: "#nova" },
  { name: "Pricing", href: "#pricing" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo />

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="text-sm font-medium text-slate-600 transition hover:text-[#0B1F3A]"
            >
              {link.name}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Button href="/login" variant="ghost" size="sm">
            Sign In
          </Button>
          <Button href="/register" variant="primary" size="sm">
            Get Started Free
          </Button>
        </div>

        <button
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle Menu"
          className="md:hidden p-2 rounded-xl border border-slate-200 text-[#0B1F3A]"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-3">
          {links.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setOpen(false)}
              className="block py-2 text-sm font-medium text-slate-700"
            >
              {link.name}
            </Link>
          ))}
          <div className="pt-2 flex gap-2">
            <Button href="/login" variant="outline" fullWidth size="sm">
              Sign In
            </Button>
            <Button href="/register" variant="primary" fullWidth size="sm">
              Get Started
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}