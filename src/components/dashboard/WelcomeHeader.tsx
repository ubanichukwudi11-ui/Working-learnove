"use client";

import { useEffect, useState } from "react";

type User = {
  fullName: string;
  role: string;
};

export default function WelcomeHeader() {
  const [user, setUser] = useState<User | null>(
    null
  );

  useEffect(() => {
    const saved =
      localStorage.getItem("learnova-user");

    if (saved) {
      setUser(JSON.parse(saved));
    }
  }, []);

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