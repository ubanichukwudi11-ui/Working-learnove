import { supabase, isSupabaseConfigured } from "./supabase";
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
        document.cookie = `learnova_user=${encodeURIComponent(serialized)}; path=/; max-age=604800; SameSite=Lax`;
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

export async function loginWithGoogle(): Promise<void> {
  if (!isSupabaseConfigured) {
    throw new Error(
      "Supabase Auth is not configured. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable Google OAuth."
    );
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        prompt: "select_account",
      },
    },
  });

  if (error) {
    throw error;
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

  if (typeof window !== "undefined") {
    localStorage.setItem("learnova_user", JSON.stringify(result.user));
  }

  return result.user;
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

  if (typeof window !== "undefined") {
    localStorage.setItem("learnova_user", JSON.stringify(result.user));
  }

  return result.user;
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

  if (typeof window !== "undefined") {
    localStorage.setItem("learnova_user", JSON.stringify(result.user));
  }

  return result.user;
}

/* ===========================================
   CURRENT USER
=========================================== */

export async function getCurrentUser(): Promise<User | null> {
  try {
    const res = await fetch("/api/auth/me", { cache: "no-store" });
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

  return null;
}

/* ===========================================
   ALL USERS (Admin)
=========================================== */

export async function getAllUsers(): Promise<User[]> {
  if (isSupabaseConfigured) {
    try {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && profiles && profiles.length > 0) {
        return profiles.map((p: any) => ({
          id: p.id,
          email: p.email,
          fullName: p.full_name,
          role: p.role,
          status: p.status,
          avatarUrl: p.avatar_url,
          phone: p.phone,
          gender: p.gender,
          country: p.country,
          state: p.state,
          address: p.address,
          dob: p.dob,
        }));
      }
    } catch {}
  }

  return [];
}

/* ===========================================
   TEACHERS
=========================================== */

export async function getTeachers(): Promise<User[]> {
  const users = await getAllUsers();
  return users.filter((u) => u.role === "TEACHER");
}

export async function getTeacherById(id: string): Promise<User | null> {
  if (isSupabaseConfigured) {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      const { data: teacher } = await supabase
        .from("teacher_profiles")
        .select("*")
        .eq("user_id", id)
        .maybeSingle();

      if (profile) {
        return {
          id: profile.id,
          email: profile.email,
          fullName: profile.full_name,
          role: profile.role,
          status: profile.status,
          avatarUrl: profile.avatar_url,
          phone: profile.phone,
          gender: profile.gender,
          country: profile.country,
          state: profile.state,
          address: profile.address,
          dob: profile.dob,
          subject: teacher?.subject,
          qualification: teacher?.qualification,
          institution: teacher?.institution,
          experience: teacher?.experience,
          licenseNumber: teacher?.license_number,
          profilePhoto: teacher?.profile_photo,
          certificate: teacher?.teaching_certificate,
          degreeCertificate: teacher?.degree_certificate,
          governmentId: teacher?.government_id,
          cv: teacher?.cv,
          verificationScore: teacher?.verification_score ?? 0,
          adminNotes: teacher?.admin_notes,
        };
      }
    } catch {}
  }

  const all = await getAllUsers();
  return all.find((u) => u.id === id) || null;
}

/* ===========================================
   STATUS MODIFIERS (Approve / Reject / Suspend)
=========================================== */

export async function approveTeacher(userId: string): Promise<boolean> {
  if (isSupabaseConfigured) {
    await supabase.from("profiles").update({ status: "ACTIVE" }).eq("id", userId);
  }
  return true;
}

export async function rejectTeacher(userId: string): Promise<boolean> {
  if (isSupabaseConfigured) {
    await supabase.from("profiles").update({ status: "REJECTED" }).eq("id", userId);
  }
  return true;
}

export async function suspendUser(userId: string): Promise<boolean> {
  if (isSupabaseConfigured) {
    await supabase.from("profiles").update({ status: "SUSPENDED" }).eq("id", userId);
  }
  return true;
}

export async function activateUser(userId: string): Promise<boolean> {
  if (isSupabaseConfigured) {
    await supabase.from("profiles").update({ status: "ACTIVE" }).eq("id", userId);
  }
  return true;
}

export async function changeUserRole(userId: string, role: UserRole): Promise<boolean> {
  if (isSupabaseConfigured) {
    await supabase.from("profiles").update({ role }).eq("id", userId);
  }
  return true;
}

export async function deleteUser(userId: string): Promise<boolean> {
  if (isSupabaseConfigured) {
    await supabase.from("profiles").delete().eq("id", userId);
  }
  return true;
}

export async function resetPassword(email: string): Promise<boolean> {
  if (isSupabaseConfigured) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/forgot-password`,
    });
    if (error) throw error;
  }
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
  return true;
}

export async function updateProfile(userId: string, values: Partial<User>): Promise<boolean> {
  if (isSupabaseConfigured) {
    await supabase
      .from("profiles")
      .update({
        full_name: values.fullName,
        avatar_url: values.avatarUrl,
        phone: values.phone,
        gender: values.gender,
        country: values.country,
        state: values.state,
        address: values.address,
        dob: values.dob,
      })
      .eq("id", userId);
  }
  return true;
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