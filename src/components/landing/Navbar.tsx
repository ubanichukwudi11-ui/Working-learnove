"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, X, ArrowRight } from "lucide-react";
import Logo from "@/components/branding/Logo";

const navLinks = [
  { name: "Home", href: "#top" },
  { name: "Features", href: "#video-lessons" },
  { name: "How It Works", href: "#how-it-works" },
  { name: "For Students", href: "#practice-progress" },
  { name: "For Teachers", href: "#portals" },
  { name: "About", href: "#about" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 border-b ${
        scrolled
          ? "bg-white/95 backdrop-blur-md border-[#E4E1F5] shadow-sm shadow-indigo-950/5"
          : "bg-[#070D24]/95 backdrop-blur-md border-white/10"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        {/* Brand Wordmark */}
        <Logo dark={!scrolled} variant="learnova" />

        {/* Desktop Navigation Links */}
        <nav
          aria-label="Primary Navigation"
          className="hidden lg:flex items-center gap-4 xl:gap-6"
        >
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className={`group relative whitespace-nowrap shrink-0 py-1 text-sm font-medium transition-colors ${
                scrolled
                  ? "text-slate-600 hover:text-[#4F46E5]"
                  : "text-indigo-100/85 hover:text-white"
              }`}
            >
              {link.name}
              <span
                aria-hidden="true"
                className={`absolute inset-x-0 -bottom-0.5 h-0.5 scale-x-0 rounded-full transition-transform duration-200 group-hover:scale-x-100 ${
                  scrolled
                    ? "bg-gradient-to-r from-[#6D28D9] to-[#06B6D4]"
                    : "bg-gradient-to-r from-[#A78BFA] to-[#22D3EE]"
                }`}
              />
            </a>
          ))}
        </nav>

        {/* Auth & Primary Actions */}
        <div className="hidden lg:flex items-center gap-2.5 shrink-0">
          <Link
            href="/login"
            className={`whitespace-nowrap shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
              scrolled
                ? "text-[#1E1B4B] hover:bg-[#F5F3FF] border border-[#E4E1F5]"
                : "text-white hover:bg-white/10 border border-white/15"
            }`}
          >
            Log In
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 rounded-xl bg-gradient-to-r from-[#7C3AED] via-[#6D28D9] to-[#4F46E5] hover:from-[#8B5CF6] hover:to-[#4338CA] px-4 py-2 text-sm font-semibold text-white shadow-md shadow-[#7C3AED]/25 transition-all"
          >
            Get Started
            <ArrowRight size={15} />
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle Menu"
          aria-expanded={open}
          className={`lg:hidden p-2.5 rounded-xl border transition-colors min-h-[44px] min-w-[44px] inline-flex items-center justify-center ${
            scrolled
              ? "border-[#E4E1F5] text-[#0B1230] hover:bg-[#F5F3FF]"
              : "border-white/15 text-white hover:bg-white/10"
          }`}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Navigation Sheet */}
      {open && (
        <div
          className={`lg:hidden border-t px-4 py-4 space-y-1.5 ${
            scrolled
              ? "border-[#E4E1F5] bg-white text-[#0B1230]"
              : "border-white/10 bg-[#0B1230] text-white"
          }`}
        >
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={() => setOpen(false)}
              className={`flex items-center min-h-[44px] rounded-xl px-3.5 py-2 text-sm font-medium transition-colors ${
                scrolled ? "hover:bg-[#F5F3FF] hover:text-[#6D28D9]" : "hover:bg-white/5"
              }`}
            >
              {link.name}
            </a>
          ))}
          <div
            className={`pt-3 mt-2 border-t grid grid-cols-2 gap-2.5 ${
              scrolled ? "border-[#E4E1F5]" : "border-white/10"
            }`}
          >
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className={`flex min-h-[44px] items-center justify-center rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${
                scrolled
                  ? "border-[#E4E1F5] text-[#1E1B4B] hover:bg-[#F5F3FF]"
                  : "border-white/20 text-white hover:bg-white/10"
              }`}
            >
              Log In
            </Link>
            <Link
              href="/register"
              onClick={() => setOpen(false)}
              className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] px-4 py-2.5 text-sm font-semibold text-white"
            >
              Get Started
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}