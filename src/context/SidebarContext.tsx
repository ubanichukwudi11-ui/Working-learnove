"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

type SidebarContextType = {
  collapsed: boolean;
  setCollapsed: (value: boolean) => void;
  toggleSidebar: () => void;
  mobileOpen: boolean;
  setMobileOpen: (value: boolean) => void;
  toggleMobile: () => void;
  closeMobile: () => void;
};

const SidebarContext = createContext<SidebarContextType | null>(null);

type SidebarProviderProps = {
  children: ReactNode;
};

const STORAGE_KEY = "learnova-sidebar";

export function SidebarProvider({ children }: SidebarProviderProps) {
  const [collapsed, setCollapsedState] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    try {
      const savedState = localStorage.getItem(STORAGE_KEY);
      if (savedState === "collapsed" || savedState === "true") {
        setCollapsedState(true);
      } else if (savedState === "expanded" || savedState === "false") {
        setCollapsedState(false);
      } else if (window.innerWidth >= 768 && window.innerWidth < 1024) {
        // Default to compact icon rail on tablet viewports until user expands
        setCollapsedState(true);
      }
    } catch {
      // Ignore storage access failures
    }
  }, []);

  const setCollapsed = useCallback((value: boolean) => {
    setCollapsedState(value);
    try {
      localStorage.setItem(STORAGE_KEY, value ? "collapsed" : "expanded");
    } catch {
      // Ignore storage failures
    }
  }, []);

  const toggleSidebar = useCallback(() => {
    setCollapsedState((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "collapsed" : "expanded");
      } catch {
        // Ignore storage failures
      }
      return next;
    });
  }, []);

  const toggleMobile = useCallback(() => {
    setMobileOpen((prev) => !prev);
  }, []);

  const closeMobile = useCallback(() => {
    setMobileOpen(false);
  }, []);

  return (
    <SidebarContext.Provider
      value={{
        collapsed,
        setCollapsed,
        toggleSidebar,
        mobileOpen,
        setMobileOpen,
        toggleMobile,
        closeMobile,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within SidebarProvider");
  }
  return context;
}