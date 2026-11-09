"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { supabase } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth";

export type UserStatus =
  | "ACTIVE"
  | "PENDING"
  | "REJECTED"
  | "SUSPENDED";

export type User = {
  id: string;
  email: string;
  fullName: string;
  role: "STUDENT" | "TEACHER" | "PARENT" | "ADMIN";
  status: UserStatus;
};

type AuthContextType = {
  user: User | null;

  loading: boolean;

  login: (user: User) => void;

  logout: () => Promise<void>;

  refreshUser: () => Promise<void>;

  isAuthenticated: boolean;
};

const AuthContext =
  createContext<AuthContextType | null>(
    null
  );

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] =
    useState<User | null>(null);

  const [loading, setLoading] =
    useState(true);

  async function loadUser() {
    try {
      // 1. Check local session storage for active user
      const stored =
        typeof window !== "undefined"
          ? localStorage.getItem("learnova_user")
          : null;
      if (stored) {
        try {
          setUser(JSON.parse(stored));
          setLoading(false);
          return;
        } catch {
          localStorage.removeItem("learnova_user");
        }
      }

      // 2. Check Supabase session
      const currentUser = await getCurrentUser();

      if (currentUser) {
        const mappedUser: User = {
          id: currentUser.id,
          email: currentUser.email,
          fullName: currentUser.fullName,
          role: currentUser.role,
          status: currentUser.status,
        };
        setUser(mappedUser);
        if (typeof window !== "undefined") {
          localStorage.setItem("learnova_user", JSON.stringify(mappedUser));
        }
      } else {
        setUser(null);
      }
    } catch {
      const stored =
        typeof window !== "undefined"
          ? localStorage.getItem("learnova_user")
          : null;
      if (stored) {
        try {
          setUser(JSON.parse(stored));
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUser();

    const {
      data: listener,
    } =
      supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (event === "SIGNED_OUT" || !session) {
            const stored = typeof window !== "undefined" ? localStorage.getItem("learnova_user") : null;
            if (!stored) {
              setUser(null);
            }
          } else {
            await loadUser();
          }
        }
      );
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  async function logout() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("learnova_user");
    }
    setUser(null);

    try {
      await supabase.auth.signOut();
    } catch {}
  }

  function login(user: User) {
    if (typeof window !== "undefined") {
      localStorage.setItem("learnova_user", JSON.stringify(user));
    }
    setUser(user);
  }

  async function refreshUser() {
    await loadUser();
  }

  return (
    <AuthContext.Provider
      value={{
        user,

        loading,

        login,

        logout,

        refreshUser,

        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider."
    );
  }

  return context;
}