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
    const isHttps = window.location.protocol === "https:";
    const cookieFlags = isHttps
      ? "path=/; max-age=604800; SameSite=None; Secure"
      : "path=/; max-age=604800; SameSite=Lax";
    const clearFlags = isHttps
      ? "path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=None; Secure"
      : "path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

    if (user) {
      const serialized = JSON.stringify(user);
      localStorage.setItem("learnova_user", serialized);
      localStorage.setItem("learnova-user", serialized);
      sessionStorage.setItem("learnova_user", serialized);
      document.cookie = `learnova_user=${encodeURIComponent(serialized)}; ${cookieFlags}`;
    } else {
      localStorage.removeItem("learnova_user");
      localStorage.removeItem("learnova-user");
      localStorage.removeItem("learnova_access_token");
      sessionStorage.removeItem("learnova_user");
      sessionStorage.removeItem("learnova_access_token");
      document.cookie = `learnova_user=; ${clearFlags}`;
    }
  } catch {}
}

let fetchPatched = false;
function installAuthFetchInterceptor() {
  if (typeof window === "undefined" || fetchPatched) return;
  fetchPatched = true;
  const origFetch = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const urlStr =
      typeof input === "string"
        ? input
        : input instanceof URL
        ? input.toString()
        : input.url;

    const isSameOriginApi =
      urlStr.startsWith("/api/") ||
      urlStr.startsWith(`${window.location.origin}/api/`);

    if (isSameOriginApi) {
      try {
        const token =
          sessionStorage.getItem("learnova_access_token") ||
          localStorage.getItem("learnova_access_token");
        if (token) {
          const headers = new Headers(
            init?.headers || (input instanceof Request ? input.headers : undefined)
          );
          if (!headers.has("Authorization")) {
            headers.set("Authorization", `Bearer ${token}`);
          }
          return origFetch(input, { ...init, headers });
        }
      } catch {}
    }

    return origFetch(input, init);
  };
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
    installAuthFetchInterceptor();
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
          if (session?.access_token) {
            try {
              localStorage.setItem("learnova_access_token", session.access_token);
              sessionStorage.setItem("learnova_access_token", session.access_token);
            } catch {}
          }
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