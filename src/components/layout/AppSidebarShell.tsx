"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings, X, type LucideIcon } from "lucide-react";
import { useSidebar } from "@/context/SidebarContext";

export type SidebarNavItem = {
  name: string;
  href: string;
  icon: LucideIcon;
  exact?: boolean;
};

export type SidebarNavGroup = {
  label: string;
  items: SidebarNavItem[];
};

type AppSidebarShellProps = {
  brandHref: string;
  workspaceLabel: string;
  brandIcon: LucideIcon;
  groups: SidebarNavGroup[];
  accentTextColor?: string;
  settingsHref?: string;
};

const COLLAPSE_DELAY_MS = 180;

export default function AppSidebarShell({
  brandHref,
  workspaceLabel,
  brandIcon: BrandIcon,
  groups,
  accentTextColor = "text-[#22D3EE]",
  settingsHref = "/settings",
}: AppSidebarShellProps) {
  const pathname = usePathname();
  const { mobileOpen, closeMobile } = useSidebar();

  const [isHovered, setIsHovered] = useState(false);
  const [isFocusWithin, setIsFocusWithin] = useState(false);
  const [dismissedByEscape, setDismissedByEscape] = useState(false);
  const [hoveredTip, setHoveredTip] = useState<{
    label: string;
    top: number;
  } | null>(null);

  const collapseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mobileCloseBtnRef = useRef<HTMLButtonElement>(null);

  const isExpanded = !dismissedByEscape && (isHovered || isFocusWithin);

  const clearCollapseTimer = () => {
    if (collapseTimerRef.current) {
      clearTimeout(collapseTimerRef.current);
      collapseTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      clearCollapseTimer();
    };
  }, []);

  useEffect(() => {
    closeMobile();
    setHoveredTip(null);
  }, [pathname, closeMobile]);

  useEffect(() => {
    if (!mobileOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    mobileCloseBtnRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMobile();
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileOpen, closeMobile]);

  const handleDesktopMouseEnter = () => {
    clearCollapseTimer();
    setDismissedByEscape(false);
    setIsHovered(true);
    setHoveredTip(null);
  };

  const handleDesktopMouseLeave = () => {
    clearCollapseTimer();
    setHoveredTip(null);
    collapseTimerRef.current = setTimeout(() => {
      setIsHovered(false);
      setDismissedByEscape(false);
    }, COLLAPSE_DELAY_MS);
  };

  const handleDesktopFocus = () => {
    clearCollapseTimer();
    setDismissedByEscape(false);
    setIsFocusWithin(true);
  };

  const handleDesktopBlur = (e: React.FocusEvent<HTMLElement>) => {
    if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
    clearCollapseTimer();
    collapseTimerRef.current = setTimeout(() => {
      setIsFocusWithin(false);
      setDismissedByEscape(false);
    }, 120);
  };

  const handleDesktopKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === "Escape" && isExpanded) {
      e.stopPropagation();
      setDismissedByEscape(true);
      setHoveredTip(null);
    }
  };

  const isRouteActive = (item: SidebarNavItem) =>
    item.exact
      ? pathname === item.href
      : pathname === item.href || pathname.startsWith(item.href + "/");

  const isSettingsActive =
    pathname === settingsHref || pathname.startsWith(settingsHref + "/");

  const showCollapsedTip = (label: string, el: HTMLElement) => {
    if (isExpanded) return;
    const rect = el.getBoundingClientRect();
    setHoveredTip({
      label,
      top: rect.top + rect.height / 2,
    });
  };

  return (
    <>
      {/* Desktop Supabase-Style Hover-Expanding Liquid Glass Sidebar */}
      <aside
        aria-label={`${workspaceLabel} Navigation`}
        onMouseEnter={handleDesktopMouseEnter}
        onMouseLeave={handleDesktopMouseLeave}
        onFocus={handleDesktopFocus}
        onBlur={handleDesktopBlur}
        onKeyDown={handleDesktopKeyDown}
        className={`hidden md:flex fixed left-0 top-0 h-screen z-50 text-white flex-col overflow-hidden transition-[width,box-shadow,border-color] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] learnova-glass-sidebar ${
          isExpanded ? "w-64 learnova-glass-sidebar-expanded" : "w-[76px]"
        }`}
      >
        {/* Brand Header (Fixed 52px icon anchor keeps logo rock-steady) */}
        <div className="h-16 shrink-0 flex items-center px-3 border-b border-white/10 bg-gradient-to-r from-[#4F46E5]/18 via-[#7C3AED]/8 to-transparent">
          <Link
            href={brandHref}
            aria-label={`Learnova · ${workspaceLabel}`}
            title={!isExpanded ? `Learnova · ${workspaceLabel}` : undefined}
            className="flex items-center w-full h-11 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE]/85"
          >
            <span className="w-[52px] h-11 shrink-0 flex items-center justify-center">
              <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#4F46E5] via-[#7C3AED] to-[#06B6D4] border border-white/25 flex items-center justify-center text-white shadow-md shadow-[#4F46E5]/30">
                <BrandIcon size={19} />
              </span>
            </span>
            <span
              aria-hidden={!isExpanded}
              className={`leading-tight min-w-0 pr-2 transition-all duration-150 ${
                isExpanded
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 -translate-x-1 pointer-events-none"
              }`}
            >
              <span className="landing-display font-extrabold text-base tracking-tight text-white block whitespace-nowrap truncate">
                Learnova
              </span>
              <span
                className={`block text-[11px] font-semibold whitespace-nowrap truncate ${accentTextColor}`}
              >
                {workspaceLabel}
              </span>
            </span>
          </Link>
        </div>

        {/* Grouped Navigation Links (Fixed group slot heights prevent vertical shift) */}
        <nav
          aria-label={`${workspaceLabel} links`}
          className="flex-1 py-3 px-3 space-y-2.5 overflow-y-auto overflow-x-hidden sidebar-scroll"
        >
          {groups.map((group, groupIdx) => (
            <div key={group.label} className="space-y-1">
              <div className="relative h-6 flex items-center">
                {groupIdx > 0 && (
                  <div
                    aria-hidden="true"
                    className={`ml-[12px] h-px w-7 bg-white/14 transition-opacity duration-150 ${
                      isExpanded ? "opacity-0" : "opacity-100"
                    }`}
                  />
                )}
                <p
                  aria-hidden={!isExpanded}
                  className={`absolute inset-x-3 text-[11px] font-semibold tracking-wide text-indigo-200/60 whitespace-nowrap truncate transition-opacity duration-150 ${
                    isExpanded ? "opacity-100" : "opacity-0 pointer-events-none"
                  }`}
                >
                  {group.label}
                </p>
              </div>

              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isRouteActive(item);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-label={item.name}
                      aria-current={active ? "page" : undefined}
                      title={!isExpanded ? item.name : undefined}
                      onMouseEnter={(e) => showCollapsedTip(item.name, e.currentTarget)}
                      onMouseLeave={() => setHoveredTip(null)}
                      className={`group flex items-center h-10 w-full rounded-xl text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE]/85 ${
                        active
                          ? "bg-gradient-to-r from-[#4F46E5]/90 to-[#7C3AED]/85 text-white ring-1 ring-inset ring-white/25 shadow-md shadow-[#4F46E5]/30"
                          : "text-indigo-100/80 hover:bg-white/[0.09] hover:text-white"
                      }`}
                    >
                      <span className="w-[52px] h-10 shrink-0 flex items-center justify-center">
                        <Icon
                          size={18}
                          className={`transition-colors duration-150 ${
                            active
                              ? "text-white"
                              : "text-indigo-200/85 group-hover:text-white"
                          }`}
                        />
                      </span>
                      <span
                        aria-hidden={!isExpanded}
                        className={`pr-3 whitespace-nowrap truncate transition-all duration-150 ${
                          isExpanded
                            ? "opacity-100 translate-x-0"
                            : "opacity-0 -translate-x-1 pointer-events-none"
                        }`}
                      >
                        {item.name}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom Settings Quick Anchor */}
        <div className="border-t border-white/10 p-3 shrink-0">
          <Link
            href={settingsHref}
            aria-label="Settings"
            aria-current={isSettingsActive ? "page" : undefined}
            title={!isExpanded ? "Settings" : undefined}
            onMouseEnter={(e) => showCollapsedTip("Settings", e.currentTarget)}
            onMouseLeave={() => setHoveredTip(null)}
            className={`group flex items-center h-10 w-full rounded-xl text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE]/85 ${
              isSettingsActive
                ? "bg-gradient-to-r from-[#4F46E5]/90 to-[#7C3AED]/85 text-white ring-1 ring-inset ring-white/25 shadow-md shadow-[#4F46E5]/30"
                : "text-indigo-100/80 hover:bg-white/[0.09] hover:text-white"
            }`}
          >
            <span className="w-[52px] h-10 shrink-0 flex items-center justify-center">
              <Settings
                size={18}
                className={`transition-colors duration-150 ${
                  isSettingsActive
                    ? "text-white"
                    : "text-indigo-200/85 group-hover:text-white"
                }`}
              />
            </span>
            <span
              aria-hidden={!isExpanded}
              className={`pr-3 whitespace-nowrap truncate transition-all duration-150 ${
                isExpanded
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 -translate-x-1 pointer-events-none"
              }`}
            >
              Settings
            </span>
          </Link>
        </div>
      </aside>

      {/* Floating Liquid Glass Tooltip when Collapsed */}
      {!isExpanded && hoveredTip && (
        <div
          role="tooltip"
          style={{ top: hoveredTip.top }}
          className="hidden md:flex fixed left-[84px] -translate-y-1/2 z-[60] pointer-events-none items-center rounded-lg learnova-glass-tooltip px-3 py-1.5 text-xs font-semibold text-white whitespace-nowrap"
        >
          {hoveredTip.label}
        </div>
      )}

      {/* Mobile Tap-Controlled Liquid Glass Navigation Drawer */}
      <div
        id="learnova-mobile-drawer"
        role="dialog"
        aria-modal="true"
        aria-label={`${workspaceLabel} Navigation`}
        className={`md:hidden fixed inset-0 z-[70] transition-opacity duration-200 ${
          mobileOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        aria-hidden={!mobileOpen}
      >
        <div
          onClick={closeMobile}
          aria-hidden="true"
          className="absolute inset-0 bg-[#070D24]/70 backdrop-blur-xs"
        />

        <aside
          aria-label={`${workspaceLabel} Mobile Navigation`}
          className={`relative w-72 max-w-[85vw] h-full learnova-glass-sidebar learnova-glass-sidebar-expanded text-white flex flex-col transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="h-16 flex items-center justify-between px-4 border-b border-white/10 shrink-0 bg-gradient-to-r from-[#4F46E5]/18 via-[#7C3AED]/8 to-transparent">
            <Link
              href={brandHref}
              onClick={closeMobile}
              className="flex items-center gap-3 min-w-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE]/85"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#4F46E5] via-[#7C3AED] to-[#06B6D4] border border-white/25 flex items-center justify-center text-white shadow-md shrink-0">
                <BrandIcon size={19} />
              </div>
              <div className="leading-tight min-w-0">
                <span className="landing-display font-extrabold text-base tracking-tight text-white block truncate">
                  Learnova
                </span>
                <span
                  className={`block text-[11px] font-semibold truncate ${accentTextColor}`}
                >
                  {workspaceLabel}
                </span>
              </div>
            </Link>

            <button
              ref={mobileCloseBtnRef}
              type="button"
              onClick={closeMobile}
              aria-label="Close navigation menu"
              className="w-11 h-11 rounded-xl flex items-center justify-center text-indigo-100/85 hover:text-white hover:bg-white/10 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE]/85 shrink-0"
            >
              <X size={20} />
            </button>
          </div>

          <nav
            aria-label={`${workspaceLabel} mobile links`}
            className="flex-1 py-4 px-3 space-y-4 overflow-y-auto sidebar-scroll"
          >
            {groups.map((group) => (
              <div key={group.label} className="space-y-1">
                <p className="px-3 pb-1 text-[11px] font-semibold tracking-wide text-indigo-200/60">
                  {group.label}
                </p>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = isRouteActive(item);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={closeMobile}
                        aria-current={active ? "page" : undefined}
                        className={`flex items-center gap-3 px-3 min-h-[44px] py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE]/85 ${
                          active
                            ? "bg-gradient-to-r from-[#4F46E5]/90 to-[#7C3AED]/85 text-white ring-1 ring-inset ring-white/25 shadow-md shadow-[#4F46E5]/30"
                            : "text-indigo-100/80 hover:bg-white/[0.09] hover:text-white"
                        }`}
                      >
                        <Icon size={18} className="shrink-0" />
                        <span className="truncate">{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="border-t border-white/10 p-3 shrink-0">
            <Link
              href={settingsHref}
              onClick={closeMobile}
              aria-current={isSettingsActive ? "page" : undefined}
              className={`w-full flex items-center gap-3 px-3 min-h-[44px] py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE]/85 ${
                isSettingsActive
                  ? "bg-gradient-to-r from-[#4F46E5]/90 to-[#7C3AED]/85 text-white ring-1 ring-inset ring-white/25 shadow-md shadow-[#4F46E5]/30"
                  : "text-indigo-100/80 hover:bg-white/[0.09] hover:text-white"
              }`}
            >
              <Settings size={18} className="shrink-0" />
              <span>Settings</span>
            </Link>
          </div>
        </aside>
      </div>
    </>
  );
}
