"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

type User = {
  fullName: string;
  role: string;
};

export default function WelcomeHeader() {
  const { user: authUser } = useAuth();
  const [user, setUser] = useState<User | null>(authUser);

  useEffect(() => {
    if (authUser) {
      setUser(authUser);
      return;
    }
    try {
      const saved =
        localStorage.getItem("learnova_user") ||
        localStorage.getItem("learnova-user");

      if (saved) {
        setUser(JSON.parse(saved));
      }
    } catch {}
  }, [authUser]);

  const firstName =
    user?.fullName?.split(" ")[0] ||
    "Student";

  return (
    <div className="mb-8">
      <h1 className="text-4xl font-bold text-white">
        Hello {firstName} 👋
      </h1>

      <p className="text-slate-400 mt-2">
        Welcome back to Learnova.
      </p>

      <p className="text-slate-500 mt-1">
        Role: {user?.role || "STUDENT"}
      </p>
    </div>
  );
}