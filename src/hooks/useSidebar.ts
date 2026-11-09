"use client";

import { useEffect, useState } from "react";

export default function useSidebar() {
  const [collapsed, setCollapsed] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(
        "learnova-sidebar"
      );

      if (
        saved === "true" ||
        saved === "false"
      ) {
        setCollapsed(saved === "true");
      }
    } catch (error) {
      console.error(
        "Sidebar state error:",
        error
      );
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "learnova-sidebar",
      String(collapsed)
    );
  }, [collapsed]);

  const toggleSidebar = () => {
    setCollapsed((prev) => !prev);
  };

  return {
    collapsed,
    toggleSidebar,
  };
}