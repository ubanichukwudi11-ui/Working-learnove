"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { supabase } from "@/lib/supabase";
import { getCurrentUser, UserRole } from "@/lib/auth";

export type UserStatus =
  | "ACTIVE"
  | "PENDING"
  | "REJECTED"
  | "SUSPENDED";

export type User = {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  classLevel?: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (user: User) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
};

function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw =
      localStorage.getItem("learnova_user") ||
      localStorage.getItem("learnova-user") ||
      sessionStorage.getItem("learnova_user");
    if (raw) return JSON.parse(raw);

    const match = document.cookie.match(/(?:^|;\s*)learnova_user=([^;]+)/);
    if (match) return JSON.parse(decodeURIComponent(match[1]));
  } catch {}
  return null;
}

function persistUser(user: User | null) {
  if (typeof window === "undefined") return;
  try {
    if (user) {
      const serialized = JSON.stringify(user);
      localStorage.setItem("learnova_user", serialized);
      localStorage.setItem("learnova-user", serialized);
      sessionStorage.setItem("learnova_user", serialized);
      document.cookie = `learnova_user=${encodeURIComponent(serialized)}; path=/; max-age=604800; SameSite=Lax`;
    } else {
      localStorage.removeItem("learnova_user");
      localStorage.removeItem("learnova-user");
      sessionStorage.removeItem("learnova_user");
      document.cookie = "learnova_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
  } catch {}
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  async function loadUser() {
    try {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        const mappedUser: User = {
          id: currentUser.id,
          email: currentUser.email,
          fullName: currentUser.fullName,
          role: currentUser.role,
          status: currentUser.status,
          classLevel: currentUser.classLevel,
        };
        setUser(mappedUser);
        persistUser(mappedUser);
      } else {
        persistUser(null);
        setUser(null);
      }
    } catch {
      const cached = getStoredUser();
      if (cached) {
        setUser(cached);
      } else {
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const cached = getStoredUser();
    if (cached) {
      setUser(cached);
    }
    loadUser();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_OUT") {
          persistUser(null);
          setUser(null);
        } else if (event === "SIGNED_IN" || session) {
          await loadUser();
        }
      }
    );
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  async function logout() {
    persistUser(null);
    setUser(null);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      await supabase.auth.signOut();
    } catch {}
  }

  function login(newUser: User) {
    persistUser(newUser);
    setUser(newUser);
    setLoading(false);
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
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }
  return context;
}