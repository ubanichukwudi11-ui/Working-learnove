"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  X,
  type LucideIcon,
} from "lucide-react";
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

export default function AppSidebarShell({
  brandHref,
  workspaceLabel,
  brandIcon: BrandIcon,
  groups,
  accentTextColor = "text-[#22D3EE]",
  settingsHref = "/profile",
}: AppSidebarShellProps) {
  const pathname = usePathname();
  const { collapsed, toggleSidebar, mobileOpen, closeMobile } = useSidebar();
  const [hoveredTip, setHoveredTip] = useState<{
    label: string;
    top: number;
  } | null>(null);

  useEffect(() => {
    closeMobile();
  }, [pathname, closeMobile]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMobile();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen, closeMobile]);

  const isRouteActive = (item: SidebarNavItem) =>
    item.exact
      ? pathname === item.href
      : pathname === item.href || pathname.startsWith(item.href + "/");

  const isSettingsActive =
    pathname === settingsHref || pathname.startsWith(settingsHref + "/");

  return (
    <>
      {/* Desktop & Tablet Collapsible Sidebar */}
      <aside
        aria-label={`${workspaceLabel} Navigation`}
        className={`hidden md:flex fixed left-0 top-0 h-screen z-50 learnova-glass-sidebar text-white flex-col transition-[width] duration-200 ease-out ${
          collapsed ? "w-[76px]" : "w-64"
        }`}
      >
        {/* Brand + Collapse Header */}
        <div
          className={`h-16 flex items-center border-b border-white/10 shrink-0 bg-gradient-to-r from-[#4F46E5]/15 to-transparent ${
            collapsed ? "justify-center px-2" : "justify-between px-4"
          }`}
        >
          <Link
            href={brandHref}
            className="flex items-center gap-3 min-w-0"
            title={collapsed ? `Learnova · ${workspaceLabel}` : undefined}
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#4F46E5] via-[#7C3AED] to-[#06B6D4] border border-white/20 flex items-center justify-center text-white shadow-md shadow-[#4F46E5]/25 shrink-0">
              <BrandIcon size={19} />
            </div>
            {!collapsed && (
              <div className="leading-tight min-w-0">
                <span className="landing-display font-extrabold text-base tracking-tight text-white block truncate">
                  Learnova
                </span>
                <span className={`block text-[11px] font-semibold truncate ${accentTextColor}`}>
                  {workspaceLabel}
                </span>
              </div>
            )}
          </Link>

          {!collapsed && (
            <button
              type="button"
              onClick={toggleSidebar}
              aria-label="Collapse sidebar"
              title="Collapse sidebar"
              className="p-1.5 rounded-lg text-indigo-200/75 hover:text-white hover:bg-white/10 transition shrink-0"
            >
              <PanelLeftClose size={17} />
            </button>
          )}
        </div>

        {/* Expand control when collapsed */}
        {collapsed && (
          <div className="px-2 pt-3 pb-1 flex justify-center shrink-0">
            <button
              type="button"
              onClick={toggleSidebar}
              aria-label="Expand sidebar"
              title="Expand sidebar"
              className="w-10 h-9 rounded-xl flex items-center justify-center text-indigo-200/80 hover:text-white hover:bg-white/10 border border-white/10 transition"
            >
              <PanelLeftOpen size={17} />
            </button>
          </div>
        )}

        {/* Grouped Navigation Links */}
        <nav className="flex-1 py-4 px-3 space-y-5 overflow-y-auto sidebar-scroll">
          {groups.map((group, groupIdx) => (
            <div key={group.label} className="space-y-1">
              {!collapsed ? (
                <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-indigo-300/55">
                  {group.label}
                </p>
              ) : (
                groupIdx > 0 && (
                  <div className="mx-3 my-2 h-px bg-white/10" aria-hidden="true" />
                )
              )}

              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isRouteActive(item);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-label={item.name}
                      onMouseEnter={(e) => {
                        if (!collapsed) return;
                        const rect = e.currentTarget.getBoundingClientRect();
                        setHoveredTip({
                          label: item.name,
                          top: rect.top + rect.height / 2,
                        });
                      }}
                      onMouseLeave={() => setHoveredTip(null)}
                      className={`relative group flex items-center gap-3 rounded-xl text-sm font-medium transition ${
                        collapsed
                          ? "justify-center px-2 py-2.5"
                          : "justify-start px-3 py-2.5"
                      } ${
                        active
                          ? "bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white shadow-md shadow-[#4F46E5]/25"
                          : "text-indigo-100/75 hover:bg-white/8 hover:text-white"
                      }`}
                    >
                      {active && (
                        <span
                          aria-hidden="true"
                          className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-[#22D3EE]"
                        />
                      )}
                      <Icon
                        size={18}
                        className={`shrink-0 ${
                          active ? "text-white" : "text-indigo-200/80 group-hover:text-white"
                        }`}
                      />
                      {!collapsed && <span className="truncate">{item.name}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom Profile & Settings Quick Anchor (no permanent Sign Out in sidebar) */}
        <div className="border-t border-white/10 p-3 shrink-0">
          <Link
            href={settingsHref}
            aria-label="Settings"
            onMouseEnter={(e) => {
              if (!collapsed) return;
              const rect = e.currentTarget.getBoundingClientRect();
              setHoveredTip({
                label: "Settings",
                top: rect.top + rect.height / 2,
              });
            }}
            onMouseLeave={() => setHoveredTip(null)}
            className={`w-full flex items-center gap-3 rounded-xl text-sm font-medium transition ${
              collapsed ? "justify-center px-2 py-2.5" : "justify-start px-3 py-2.5"
            } ${
              isSettingsActive
                ? "bg-white/15 text-white"
                : "text-indigo-100/75 hover:bg-white/8 hover:text-white"
            }`}
          >
            <Settings size={18} className="shrink-0 text-indigo-200/80" />
            {!collapsed && <span className="truncate">Settings</span>}
          </Link>
        </div>
      </aside>

      {/* Floating Tooltip for Collapsed Mode */}
      {collapsed && hoveredTip && (
        <div
          role="tooltip"
          style={{ top: hoveredTip.top }}
          className="hidden md:flex fixed left-[84px] -translate-y-1/2 z-[60] pointer-events-none items-center rounded-lg bg-[#0B1230] border border-white/15 px-3 py-1.5 text-xs font-semibold text-white shadow-xl whitespace-nowrap"
        >
          {hoveredTip.label}
        </div>
      )}

      {/* Mobile Slide-Out Drawer (also opened via Bottom Nav "More" button) */}
      <div
        className={`md:hidden fixed inset-0 z-[70] transition-opacity duration-200 ${
          mobileOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        aria-hidden={!mobileOpen}
      >
        <div
          onClick={closeMobile}
          className="absolute inset-0 bg-[#070D24]/70 backdrop-blur-xs"
        />

        <aside
          aria-label={`${workspaceLabel} Mobile Navigation`}
          className={`relative w-72 max-w-[85vw] h-full learnova-glass-sidebar text-white flex flex-col shadow-2xl transition-transform duration-200 ease-out ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="h-16 flex items-center justify-between px-4 border-b border-white/10 shrink-0 bg-gradient-to-r from-[#4F46E5]/15 to-transparent">
            <Link
              href={brandHref}
              onClick={closeMobile}
              className="flex items-center gap-3 min-w-0"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#4F46E5] via-[#7C3AED] to-[#06B6D4] border border-white/20 flex items-center justify-center text-white shadow-md shrink-0">
                <BrandIcon size={19} />
              </div>
              <div className="leading-tight min-w-0">
                <span className="landing-display font-extrabold text-base tracking-tight text-white block">
                  Learnova
                </span>
                <span className={`block text-[11px] font-semibold ${accentTextColor}`}>
                  {workspaceLabel}
                </span>
              </div>
            </Link>

            <button
              type="button"
              onClick={closeMobile}
              aria-label="Close navigation menu"
              className="p-2 rounded-xl text-indigo-200/80 hover:text-white hover:bg-white/10 transition"
            >
              <X size={18} />
            </button>
          </div>

          <nav className="flex-1 py-4 px-3 space-y-5 overflow-y-auto sidebar-scroll">
            {groups.map((group) => (
              <div key={group.label} className="space-y-1">
                <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-indigo-300/55">
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
                        className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                          active
                            ? "bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white shadow-md shadow-[#4F46E5]/25"
                            : "text-indigo-100/75 hover:bg-white/8 hover:text-white"
                        }`}
                      >
                        {active && (
                          <span
                            aria-hidden="true"
                            className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-[#22D3EE]"
                          />
                        )}
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
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                isSettingsActive
                  ? "bg-white/15 text-white"
                  : "text-indigo-100/75 hover:bg-white/8 hover:text-white"
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
