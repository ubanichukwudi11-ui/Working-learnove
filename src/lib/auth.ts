import { supabase, isSupabaseConfigured, SUPABASE_CONFIG_ERROR } from "./supabase";
import {
  getAuthCallbackUrl,
  getPasswordResetRedirectUrl,
  sanitizePostAuthRedirect,
} from "./appUrl";
import type { User as SupabaseUser } from "@supabase/supabase-js";

/* ===========================================
   TYPES
=========================================== */

export type UserRole =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "TEACHER"
  | "STUDENT"
  | "PARENT";

export type UserStatus =
  | "ACTIVE"
  | "PENDING"
  | "REJECTED"
  | "SUSPENDED";

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  avatarUrl?: string;
  phone?: string;
  gender?: string;
  country?: string;
  state?: string;
  address?: string;
  dob?: string;

  /* Teacher */
  subject?: string;
  qualification?: string;
  institution?: string;
  experience?: string;
  licenseNumber?: string;
  profilePhoto?: string;
  certificate?: string;
  degreeCertificate?: string;
  governmentId?: string;
  cv?: string;
  verificationScore?: number;
  adminNotes?: string;

  /* Student */
  classLevel?: string;
  age?: number;
  studentEmail?: string;

  /* Parent */
  studentName?: string;
  childIdNumber?: string;
  relationship?: string;

  /* Registration state */
  requiresEmailConfirmation?: boolean;
}

/* ===========================================
   SESSION HELPERS
=========================================== */

export async function getSession() {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (!error && data?.session) return data.session;
    } catch {}
  }
  return null;
}

export async function getAuthUser(): Promise<SupabaseUser | null> {
  if (isSupabaseConfigured) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    } catch {}
  }
  return null;
}

/* ===========================================
   LOGIN (Direct to API Route with Supabase Auth)
=========================================== */

export async function login(email: string, password?: string): Promise<User> {
  const cleanEmail = email.trim().toLowerCase();

  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: cleanEmail, password }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.error || "Invalid email or password.");
    }

    if (data.session && isSupabaseConfigured) {
      try {
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
      } catch {}
    }

    if (typeof window !== "undefined") {
      try {
        const serialized = JSON.stringify(data.user);
        localStorage.setItem("learnova_user", serialized);
        localStorage.setItem("learnova-user", serialized);
        sessionStorage.setItem("learnova_user", serialized);
        const secureAttr = window.location.protocol === "https:" ? "; Secure" : "";
        document.cookie = `learnova_user=${encodeURIComponent(serialized)}; path=/; max-age=604800; SameSite=Lax${secureAttr}`;
      } catch {}
    }

    return data.user;
  } catch (err: any) {
    // If Supabase API failed or is unconfigured, return exact error message for UI display
    throw new Error(err.message || "Failed to sign in. Please verify your credentials.");
  }
}

/* ===========================================
   GOOGLE SIGN-IN VIA SUPABASE OAUTH
=========================================== */

export async function loginWithGoogle(nextPath?: string): Promise<void> {
  if (!isSupabaseConfigured) {
    throw new Error(SUPABASE_CONFIG_ERROR);
  }

  if (typeof window !== "undefined") {
    try {
      const safeNext = nextPath ? sanitizePostAuthRedirect(nextPath, "") : "";
      if (safeNext) {
        sessionStorage.setItem("learnova_post_auth_next", safeNext);
      } else {
        sessionStorage.removeItem("learnova_post_auth_next");
      }
    } catch {}
  }

  try {
    await supabase.auth.signOut({ scope: "local" });
  } catch {}

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: getAuthCallbackUrl(),
      queryParams: {
        prompt: "select_account",
      },
    },
  });

  if (error) {
    throw error;
  }

  if (typeof window !== "undefined" && data?.url) {
    window.location.assign(data.url);
  }
}

/* ===========================================
   LOGOUT
=========================================== */

export async function logout(): Promise<void> {
  if (typeof window !== "undefined") {
    localStorage.removeItem("learnova_user");
    localStorage.removeItem("learnova-user");
    sessionStorage.removeItem("learnova_user");
  }

  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } catch {}

  if (isSupabaseConfigured) {
    try {
      await supabase.auth.signOut();
    } catch {}
  }
}

/* ===========================================
   REGISTER STUDENT (Direct to API Route)
=========================================== */

export async function registerStudent(data: {
  fullName: string;
  email: string;
  password: string;
  classLevel?: string;
  age?: number;
  profilePhoto?: string;
  aiPurpose?: string[];
  examPreparation?: string;
  favouriteSubjects?: string[];
  learningStyle?: string[];
  studyHours?: string;
  studyTime?: string;
  learningGoal?: string;
  reminders?: string;
}): Promise<User> {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      role: "STUDENT",
      ...data,
    }),
  });

  const result = await res.json();

  if (!res.ok || !result.success) {
    throw new Error(result.error || "Failed to register student account.");
  }

  if (result.session && isSupabaseConfigured) {
    try {
      await supabase.auth.setSession({
        access_token: result.session.access_token,
        refresh_token: result.session.refresh_token,
      });
    } catch {}
  }

  if (result.session && typeof window !== "undefined") {
    localStorage.setItem("learnova_user", JSON.stringify(result.user));
  }

  return {
    ...result.user,
    requiresEmailConfirmation: Boolean(result.requiresEmailConfirmation),
  };
}

/* ===========================================
   REGISTER TEACHER (Direct to API Route)
=========================================== */

export async function registerTeacher(data: {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  gender?: string;
  country?: string;
  state?: string;
  address?: string;
  dob?: string;
  subject?: string;
  qualification?: string;
  institution?: string;
  experience?: string;
  licenseNumber?: string;
  profilePhoto?: string;
  certificate?: string;
  degreeCertificate?: string;
  governmentId?: string;
  cv?: string;
}): Promise<User> {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      role: "TEACHER",
      ...data,
    }),
  });

  const result = await res.json();

  if (!res.ok || !result.success) {
    throw new Error(result.error || "Failed to submit teacher application.");
  }

  if (result.session && isSupabaseConfigured) {
    try {
      await supabase.auth.setSession({
        access_token: result.session.access_token,
        refresh_token: result.session.refresh_token,
      });
    } catch {}
  }

  if (result.session && typeof window !== "undefined") {
    localStorage.setItem("learnova_user", JSON.stringify(result.user));
  }

  return {
    ...result.user,
    requiresEmailConfirmation: Boolean(result.requiresEmailConfirmation),
  };
}

/* ===========================================
   REGISTER PARENT (Direct to API Route)
=========================================== */

export async function registerParent(data: {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  studentName?: string;
  childIdNumber?: string;
  relationship?: string;
}): Promise<User> {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      role: "PARENT",
      ...data,
    }),
  });

  const result = await res.json();

  if (!res.ok || !result.success) {
    throw new Error(result.error || "Failed to register parent account.");
  }

  if (result.session && isSupabaseConfigured) {
    try {
      await supabase.auth.setSession({
        access_token: result.session.access_token,
        refresh_token: result.session.refresh_token,
      });
    } catch {}
  }

  if (result.session && typeof window !== "undefined") {
    localStorage.setItem("learnova_user", JSON.stringify(result.user));
  }

  return {
    ...result.user,
    requiresEmailConfirmation: Boolean(result.requiresEmailConfirmation),
  };
}

/* ===========================================
   CURRENT USER
=========================================== */

export async function getCurrentUser(): Promise<User | null> {
  let meStatus = 0;
  try {
    const res = await fetch("/api/auth/me", { cache: "no-store" });
    meStatus = res.status;
    if (res.ok) {
      const data = await res.json();
      if (data?.user) {
        if (typeof window !== "undefined") {
          localStorage.setItem("learnova_user", JSON.stringify(data.user));
        }
        return data.user;
      }
    }
  } catch {}

  if (isSupabaseConfigured) {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.access_token) {
        const res = await fetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accessToken: session.access_token }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.user) {
            if (typeof window !== "undefined") {
              localStorage.setItem("learnova_user", JSON.stringify(data.user));
            }
            return data.user;
          }
        }
      }
    } catch {}
  }

  if (meStatus === 401) {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
  }

  return null;
}

/* ===========================================
   ALL USERS (Admin)
=========================================== */

export async function getAllUsers(): Promise<User[]> {
  try {
    const res = await fetch("/api/admin/users", { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data?.users) ? data.users : [];
  } catch {
    return [];
  }
}

/* ===========================================
   TEACHERS
=========================================== */

export async function getTeachers(): Promise<User[]> {
  const users = await getAllUsers();
  return users.filter((u) => u.role === "TEACHER");
}

export async function getTeacherById(id: string): Promise<User | null> {
  try {
    const res = await fetch(
      `/api/admin/users?userId=${encodeURIComponent(id)}`,
      { cache: "no-store" }
    );
    if (res.ok) {
      const data = await res.json();
      if (data?.user) return data.user;
    }
  } catch {}
  return null;
}

/* ===========================================
   STATUS MODIFIERS (Server-Enforced Admin API)
=========================================== */

async function adminPatchUser(
  userId: string,
  payload: { status?: UserStatus; role?: UserRole }
): Promise<boolean> {
  const res = await fetch("/api/admin/users", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, ...payload }),
  });
  return res.ok;
}

export async function approveTeacher(userId: string): Promise<boolean> {
  return adminPatchUser(userId, { status: "ACTIVE" });
}

export async function rejectTeacher(userId: string): Promise<boolean> {
  return adminPatchUser(userId, { status: "REJECTED" });
}

export async function suspendUser(userId: string): Promise<boolean> {
  return adminPatchUser(userId, { status: "SUSPENDED" });
}

export async function activateUser(userId: string): Promise<boolean> {
  return adminPatchUser(userId, { status: "ACTIVE" });
}

export async function changeUserRole(userId: string, role: UserRole): Promise<boolean> {
  return adminPatchUser(userId, { role });
}

export async function deleteUser(userId: string): Promise<boolean> {
  const res = await fetch(
    `/api/admin/users?userId=${encodeURIComponent(userId)}`,
    { method: "DELETE" }
  );
  return res.ok;
}

export async function resetPassword(email: string): Promise<boolean> {
  if (!isSupabaseConfigured) {
    throw new Error(SUPABASE_CONFIG_ERROR);
  }
  const { error } = await supabase.auth.resetPasswordForEmail(
    email.trim().toLowerCase(),
    {
      redirectTo: getPasswordResetRedirectUrl(),
    }
  );
  if (error) throw error;
  return true;
}

export async function updatePassword(password: string): Promise<boolean> {
  if (isSupabaseConfigured) {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  }
  return true;
}

export async function resendVerificationEmail(): Promise<boolean> {
  const res = await fetch("/api/auth/verification", { method: "POST" });
  return res.ok;
}

export async function updateProfile(_userId: string, values: Partial<User>): Promise<boolean> {
  const res = await fetch("/api/auth/me", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(values),
  });
  return res.ok;
}

export async function updateTeacherProfile(userId: string, values: Partial<User>): Promise<boolean> {
  return updateProfile(userId, values);
}

/* ===========================================
   ROLE & STATUS HELPERS
=========================================== */

export function isSuperAdmin(user?: User | null) {
  return user?.role === "SUPER_ADMIN";
}

export function isAdmin(user?: User | null) {
  return user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
}

export function isTeacher(user?: User | null) {
  return user?.role === "TEACHER";
}

export function isStudent(user?: User | null) {
  return user?.role === "STUDENT";
}

export function isParent(user?: User | null) {
  return user?.role === "PARENT";
}

export function isApproved(user?: User | null) {
  return user?.status === "ACTIVE";
}

export function isPending(user?: User | null) {
  return user?.status === "PENDING";
}

export function isRejected(user?: User | null) {
  return user?.status === "REJECTED";
}

export function isSuspended(user?: User | null) {
  return user?.status === "SUSPENDED";
}

export async function isAuthenticated() {
  const user = await getCurrentUser();
  return !!user;
}

export async function getUserRole() {
  const user = await getCurrentUser();
  return user?.role ?? null;
}

export async function getUserStatus() {
  const user = await getCurrentUser();
  return user?.status ?? null;
}

export function onAuthStateChange(
  callback: (event: string, user: SupabaseUser | null) => void
) {
  if (isSupabaseConfigured) {
    try {
      return supabase.auth.onAuthStateChange((event, session) => {
        callback(event, session?.user ?? null);
      });
    } catch {}
  }
  return {
    data: {
      subscription: {
        unsubscribe: () => {},
      },
    },
  };
}

const auth = {
  login,
  loginWithGoogle,
  logout,
  registerTeacher,
  registerStudent,
  registerParent,
  getCurrentUser,
  getAllUsers,
  getTeachers,
  getTeacherById,
  updateProfile,
  updateTeacherProfile,
  approveTeacher,
  rejectTeacher,
  suspendUser,
  activateUser,
  changeUserRole,
  deleteUser,
  resetPassword,
  updatePassword,
  resendVerificationEmail,
  onAuthStateChange,
  isAuthenticated,
  getUserRole,
  getUserStatus,
  isAdmin,
  isTeacher,
  isStudent,
  isParent,
  isApproved,
  isPending,
  isRejected,
  isSuspended,
};

export default auth;