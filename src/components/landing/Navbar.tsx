"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, X, ArrowRight } from "lucide-react";
import Logo from "@/components/branding/Logo";

const links = [
  { name: "Curriculum", href: "#features" },
  { name: "Live Classes", href: "#live" },
  { name: "Nova AI", href: "#nova" },
  { name: "Pricing", href: "#pricing" },
  { name: "Sign In", href: "/login" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 18);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 border-b ${
        scrolled
          ? "bg-white/92 backdrop-blur-xl border-slate-200/90 shadow-xs"
          : "bg-[#07162B]/95 backdrop-blur-xl border-white/10"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Brand Wordmark */}
        <Logo dark={!scrolled} />

        {/* Zone 2: Single-Line Navigation Links */}
        <nav
          aria-label="Primary Navigation"
          className="hidden items-center gap-7 md:flex"
        >
          {links.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={`whitespace-nowrap shrink-0 text-sm font-medium transition-colors ${
                scrolled
                  ? "text-slate-600 hover:text-[#0B1F3A]"
                  : "text-slate-200 hover:text-white"
              }`}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Zone 3: Single Primary Action */}
        <div className="hidden md:flex items-center shrink-0">
          <Link
            href="/register"
            className={`inline-flex items-center gap-2 whitespace-nowrap shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
              scrolled
                ? "bg-[#0B1F3A] text-white hover:bg-[#143258]"
                : "bg-[#0D9488] text-white hover:bg-[#0F766E]"
            }`}
          >
            Get Started Free
            <ArrowRight size={15} />
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle Menu"
          aria-expanded={open}
          className={`md:hidden p-2 rounded-xl border transition-colors ${
            scrolled
              ? "border-slate-200 text-[#0B1F3A] hover:bg-slate-50"
              : "border-white/15 text-white hover:bg-white/10"
          }`}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Navigation Sheet */}
      {open && (
        <div
          className={`md:hidden border-t px-4 py-4 space-y-2 ${
            scrolled
              ? "border-slate-200 bg-white text-[#0B1F3A]"
              : "border-white/10 bg-[#091C36] text-white"
          }`}
        >
          {links.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setOpen(false)}
              className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                scrolled ? "hover:bg-slate-50" : "hover:bg-white/5"
              }`}
            >
              {link.name}
            </Link>
          ))}
          <div className="pt-2">
            <Link
              href="/register"
              onClick={() => setOpen(false)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0D9488] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0F766E] transition-colors"
            >
              Get Started Free
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}