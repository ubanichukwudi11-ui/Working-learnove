"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

type SidebarContextType = {
  collapsed: boolean;
  toggleSidebar: () => void;
};

const SidebarContext =
  createContext<SidebarContextType | null>(
    null
  );

type SidebarProviderProps = {
  children: ReactNode;
};

export function SidebarProvider({
  children,
}: SidebarProviderProps) {
  const [collapsed, setCollapsed] =
    useState(false);

  useEffect(() => {
    const savedState =
      localStorage.getItem(
        "learnova-sidebar"
      );

    if (savedState === "collapsed") {
      setCollapsed(true);
    }
  }, []);

  const toggleSidebar = () => {
    setCollapsed((prev) => {
      const next = !prev;

      localStorage.setItem(
        "learnova-sidebar",
        next
          ? "collapsed"
          : "expanded"
      );

      return next;
    });
  };

  return (
    <SidebarContext.Provider
      value={{
        collapsed,
        toggleSidebar,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context =
    useContext(SidebarContext);

  if (!context) {
    throw new Error(
      "useSidebar must be used within SidebarProvider"
    );
  }

  return context;
}