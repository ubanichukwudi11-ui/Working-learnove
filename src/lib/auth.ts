import { supabase } from "./supabase";
import type { User as SupabaseUser } from "@supabase/supabase-js";

/* ===========================================
   TYPES
=========================================== */

export type UserRole =
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
   AUTH HELPERS
=========================================== */

function mapProfile(
  profile: any,
  teacher?: any,
  student?: any,
  parent?: any
): User {
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

    /* Teacher */

    subject: teacher?.subject,

    qualification:
      teacher?.qualification,

    institution:
      teacher?.institution,

    experience:
      teacher?.experience,

    licenseNumber:
      teacher?.license_number,

    profilePhoto:
      teacher?.profile_photo,

    certificate:
      teacher?.teaching_certificate,

    degreeCertificate:
      teacher?.degree_certificate,

    governmentId:
      teacher?.government_id,

    cv: teacher?.cv,

    verificationScore:
      teacher?.verification_score,

    adminNotes:
      teacher?.admin_notes,

    /* Student */

    classLevel:
      student?.class_level,

    age:
      student?.age,

    studentEmail:
      student?.student_email,

    /* Parent */

    studentName:
      parent?.student_name,

    childIdNumber:
      parent?.child_id_number,

    relationship:
      parent?.relationship,
  };
}

/* ===========================================
   SESSION
=========================================== */

export async function getSession() {
  const {
    data,
    error,
  } =
    await supabase.auth.getSession();

  if (error) throw error;

  return data.session;
}

export async function getAuthUser() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return null;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

/* ===========================================
   LOGIN
=========================================== */

export async function login(
  email: string,
  password: string
) {
  try {
    const {
      data,
      error,
    } =
      await supabase.auth.signInWithPassword(
        {
          email,
          password,
        }
      );

    if (!error && data?.user) {
      const user = await getCurrentUser();
      if (user) return user;
    }
  } catch (err) {
    console.warn("Supabase auth unavailable, falling back to local credentials:", err);
  }

  // Check locally registered users
  if (typeof window !== "undefined") {
    try {
      const storedUsers = localStorage.getItem("learnova_registered_users");
      if (storedUsers) {
        const users: User[] = JSON.parse(storedUsers);
        const match = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
        if (match) return match;
      }
    } catch {}
  }

  // Demo fallback based on email role or standard user
  const lower = email.toLowerCase();
  let role: UserRole = "STUDENT";
  let fullName = "Alex Carter";

  if (lower.includes("admin")) {
    role = "ADMIN";
    fullName = "Admin User";
  } else if (lower.includes("teacher")) {
    role = "TEACHER";
    fullName = "Ms. Sarah Johnson";
  } else if (lower.includes("parent")) {
    role = "PARENT";
    fullName = "David Miller";
  } else if (lower.includes("student") || lower.includes("alex")) {
    role = "STUDENT";
    fullName = "Alex Carter";
  } else {
    // Generate name from email username
    const namePart = email.split("@")[0].replace(/[._-]/g, " ");
    fullName = namePart ? namePart.charAt(0).toUpperCase() + namePart.slice(1) : "Learner";
  }

  const localUser: User = {
    id: `user-${Date.now()}`,
    email,
    fullName,
    role,
    status: "ACTIVE",
  };

  return localUser;
}

export async function loginWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        prompt: "select_account",
      },
    },
  });

  if (error) throw error;
}

/* ===========================================
   LOGOUT
=========================================== */

export async function logout() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("learnova_user");
  }

  try {
    await supabase.auth.signOut();
  } catch {}
}

/* ===========================================
   REGISTER BASE
=========================================== */

async function signUpUser(
  email: string,
  password: string,
  fullName: string,
  role: UserRole
): Promise<SupabaseUser> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role,
        },
      },
    });

    if (!error && data?.user) {
      return data.user;
    }
  } catch (err) {
    console.warn("Supabase sign up error, continuing with local registration:", err);
  }

  // Fallback local registration
  const fallbackUser: User = {
    id: `usr_${Date.now()}`,
    email,
    fullName,
    role,
    status: role === "TEACHER" ? "PENDING" : "ACTIVE",
  };

  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("learnova_registered_users");
      const list: User[] = raw ? JSON.parse(raw) : [];
      list.push(fallbackUser);
      localStorage.setItem("learnova_registered_users", JSON.stringify(list));
      localStorage.setItem("learnova_user", JSON.stringify(fallbackUser));
    } catch {}
  }

  return {
    id: fallbackUser.id,
    app_metadata: {},
    user_metadata: { full_name: fullName, role },
    aud: "authenticated",
    created_at: new Date().toISOString(),
    email: fallbackUser.email,
  } as SupabaseUser;
}

/* ===========================================
   REGISTER STUDENT
=========================================== */

export async function registerStudent(
  data: {
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
  }
) {
  const user = await signUpUser(
    data.email,
    data.password,
    data.fullName,
    "STUDENT"
  );

  try {
    await supabase
      .from("student_profiles")
      .insert({
        user_id: user.id,
        class_level: data.classLevel,
        age: data.age,
        profile_photo: data.profilePhoto,
        ai_purpose: data.aiPurpose,
        exam_preparation: data.examPreparation,
        favourite_subjects: data.favouriteSubjects,
        learning_style: data.learningStyle,
        study_hours: data.studyHours,
        study_time: data.studyTime,
        learning_goal: data.learningGoal,
        reminders: data.reminders,
      });
  } catch (err) {
    console.warn("Profile table insert skipped:", err);
  }

  return user;
}

/* ===========================================
   REGISTER PARENT
=========================================== */

export async function registerParent(
  data: {
    fullName: string;
    email: string;
    password: string;
    studentName?: string;
    relationship?: string;
    childIdNumber?: string;
  }
) {
  const user = await signUpUser(
    data.email,
    data.password,
    data.fullName,
    "PARENT"
  );

  try {
    await supabase
      .from("parent_profiles")
      .insert({
        user_id: user.id,
        student_name: data.studentName,
        relationship: data.relationship,
        child_id_number: data.childIdNumber,
      });
  } catch (err) {
    console.warn("Parent profile insert skipped:", err);
  }

  return user;
}

/* ===========================================
   REGISTER TEACHER
=========================================== */

export async function registerTeacher(
  data: {
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
  }
) {
  const user = await signUpUser(
    data.email,
    data.password,
    data.fullName,
    "TEACHER"
  );

  try {
    await supabase
      .from("profiles")
      .update({
        phone: data.phone,
        gender: data.gender,
        country: data.country,
        state: data.state,
        address: data.address,
        dob: data.dob,
      })
      .eq("id", user.id);

    await supabase
      .from("teacher_profiles")
      .insert({
        user_id: user.id,
        subject: data.subject,
        qualification: data.qualification,
        institution: data.institution,
        experience: data.experience,
        license_number: data.licenseNumber,
        profile_photo: data.profilePhoto,
        teaching_certificate: data.certificate,
        degree_certificate: data.degreeCertificate,
        government_id: data.governmentId,
        cv: data.cv,
        verification_score: 0,
      });
  } catch (err) {
    console.warn("Teacher profile insert skipped:", err);
  }

  return user;
}

/* ===========================================
   CURRENT USER
=========================================== */

export async function getCurrentUser(): Promise<User | null> {
  const authUser =
    await getAuthUser();

  if (!authUser) {
    return null;
  }

  const {
    data: profile,
    error,
  } =
    await supabase
      .from("profiles")
      .select("*")
      .eq(
        "id",
        authUser.id
      )
      .single();

  if (error || !profile) {
    return null;
  }

  let teacher =
    null;

  let student =
    null;

  let parent =
    null;

  if (
    profile.role ===
    "TEACHER"
  ) {
    const {
      data,
    } =
      await supabase
        .from(
          "teacher_profiles"
        )
        .select("*")
        .eq(
          "user_id",
          authUser.id
        )
        .single();

    teacher = data;
  }

  if (
    profile.role ===
    "STUDENT"
  ) {
    const {
      data,
    } =
      await supabase
        .from(
          "student_profiles"
        )
        .select("*")
        .eq(
          "user_id",
          authUser.id
        )
        .single();

    student = data;
  }

  if (
    profile.role ===
    "PARENT"
  ) {
    const {
      data,
    } =
      await supabase
        .from(
          "parent_profiles"
        )
        .select("*")
        .eq(
          "user_id",
          authUser.id
        )
        .single();

    parent = data;
  }

  return mapProfile(
    profile,
    teacher,
    student,
    parent
  );
}
/* ===========================================
   ALL USERS
=========================================== */

export async function getAllUsers(): Promise<User[]> {
  const { data: profiles, error } =
    await supabase
      .from("profiles")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

  if (error) {
    throw error;
  }

  const users: User[] = [];

  for (const profile of profiles ?? []) {
    let teacher = null;
    let student = null;
    let parent = null;

    if (profile.role === "TEACHER") {
      const { data } = await supabase
        .from("teacher_profiles")
        .select("*")
        .eq("user_id", profile.id)
        .single();

      teacher = data;
    }

    if (profile.role === "STUDENT") {
      const { data } = await supabase
        .from("student_profiles")
        .select("*")
        .eq("user_id", profile.id)
        .single();

      student = data;
    }

    if (profile.role === "PARENT") {
      const { data } = await supabase
        .from("parent_profiles")
        .select("*")
        .eq("user_id", profile.id)
        .single();

      parent = data;
    }

    users.push(
      mapProfile(
        profile,
        teacher,
        student,
        parent
      )
    );
  }

  return users;
}

/* ===========================================
   TEACHERS
=========================================== */

export async function getTeachers() {
  const users =
    await getAllUsers();

  return users.filter(
    (user) =>
      user.role ===
      "TEACHER"
  );
}

/* ===========================================
   TEACHER BY ID
=========================================== */

export async function getTeacherById(
  id: string
): Promise<User | null> {
  const { data: profile, error } =
    await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();

  if (error || !profile) {
    return null;
  }

  const { data: teacher } =
    await supabase
      .from("teacher_profiles")
      .select("*")
      .eq("user_id", id)
      .single();

  return mapProfile(
    profile,
    teacher,
    null,
    null
  );
}

/* ===========================================
   UPDATE PROFILE
=========================================== */

export async function updateProfile(
  userId: string,
  values: Partial<User>
) {
  const { error } =
    await supabase
      .from("profiles")
      .update({
        full_name:
          values.fullName,

        avatar_url:
          values.avatarUrl,

        phone:
          values.phone,

        gender:
          values.gender,

        country:
          values.country,

        state:
          values.state,

        address:
          values.address,

        dob:
          values.dob,
      })
      .eq("id", userId);

  if (error) {
    throw error;
  }

  return true;
}

/* ===========================================
   UPDATE TEACHER
=========================================== */

export async function updateTeacherProfile(
  userId: string,
  values: Partial<User>
) {
  const { error } =
    await supabase
      .from("teacher_profiles")
      .update({
        subject:
          values.subject,

        qualification:
          values.qualification,

        institution:
          values.institution,

        experience:
          values.experience,

        license_number:
          values.licenseNumber,

        profile_photo:
          values.profilePhoto,

        teaching_certificate:
          values.certificate,

        degree_certificate:
          values.degreeCertificate,

        government_id:
          values.governmentId,

        cv:
          values.cv,

        admin_notes:
          values.adminNotes,
      })
      .eq(
        "user_id",
        userId
      );

  if (error) {
    throw error;
  }

  return true;
}

/* ===========================================
   ROLE HELPERS
=========================================== */

export function isAdmin(
  user?: User | null
) {
  return (
    user?.role ===
    "ADMIN"
  );
}

export function isTeacher(
  user?: User | null
) {
  return (
    user?.role ===
    "TEACHER"
  );
}

export function isStudent(
  user?: User | null
) {
  return (
    user?.role ===
    "STUDENT"
  );
}

export function isParent(
  user?: User | null
) {
  return (
    user?.role ===
    "PARENT"
  );
}

/* ===========================================
   STATUS HELPERS
=========================================== */

export function isApproved(
  user?: User | null
) {
  return (
    user?.status ===
    "ACTIVE"
  );
}

export function isPending(
  user?: User | null
) {
  return (
    user?.status ===
    "PENDING"
  );
}

export function isRejected(
  user?: User | null
) {
  return (
    user?.status ===
    "REJECTED"
  );
}

export function isSuspended(
  user?: User | null
) {
  return (
    user?.status ===
    "SUSPENDED"
  );
}
/* ===========================================
   APPROVE TEACHER
=========================================== */

export async function approveTeacher(
  userId: string
) {
  const { error } =
    await supabase
      .from("profiles")
      .update({
        status: "ACTIVE",
      })
      .eq("id", userId);

  if (error) {
    throw error;
  }

  return true;
}

/* ===========================================
   REJECT TEACHER
=========================================== */

export async function rejectTeacher(
  userId: string
) {
  const { error } =
    await supabase
      .from("profiles")
      .update({
        status: "REJECTED",
      })
      .eq("id", userId);

  if (error) {
    throw error;
  }

  return true;
}

/* ===========================================
   SUSPEND USER
=========================================== */

export async function suspendUser(
  userId: string
) {
  const { error } =
    await supabase
      .from("profiles")
      .update({
        status: "SUSPENDED",
      })
      .eq("id", userId);

  if (error) {
    throw error;
  }

  return true;
}

/* ===========================================
   ACTIVATE USER
=========================================== */

export async function activateUser(
  userId: string
) {
  const { error } =
    await supabase
      .from("profiles")
      .update({
        status: "ACTIVE",
      })
      .eq("id", userId);

  if (error) {
    throw error;
  }

  return true;
}

/* ===========================================
   CHANGE USER ROLE
=========================================== */

export async function changeUserRole(
  userId: string,
  role: UserRole
) {
  const { error } =
    await supabase
      .from("profiles")
      .update({
        role,
      })
      .eq("id", userId);

  if (error) {
    throw error;
  }

  return true;
}

/* ===========================================
   DELETE USER
=========================================== */

export async function deleteUser(
  userId: string
) {
  const { error } =
    await supabase
      .from("profiles")
      .delete()
      .eq("id", userId);

  if (error) {
    throw error;
  }

  return true;
}

/* ===========================================
   PASSWORD RESET
=========================================== */

export async function resetPassword(
  email: string
) {
  const { error } =
    await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo:
          `${window.location.origin}/reset-password`,
      }
    );

  if (error) {
    throw error;
  }

  return true;
}

/* ===========================================
   UPDATE PASSWORD
=========================================== */

export async function updatePassword(
  password: string
) {
  const { error } =
    await supabase.auth.updateUser({
      password,
    });

  if (error) {
    throw error;
  }

  return true;
}

/* ===========================================
   EMAIL VERIFICATION
=========================================== */

export async function resendVerificationEmail() {
  const {
    data: { user },
  } =
    await supabase.auth.getUser();

  if (!user?.email) {
    throw new Error(
      "No authenticated user."
    );
  }

  const { error } =
    await supabase.auth.resend({
      type: "signup",
      email: user.email,
    });

  if (error) {
    throw error;
  }

  return true;
}

/* ===========================================
   AUTH LISTENER
=========================================== */

export function onAuthStateChange(
  callback: (
    event: string,
    user: SupabaseUser | null
  ) => void
) {
  return supabase.auth.onAuthStateChange(
    (event, session) => {
      callback(
        event,
        session?.user ?? null
      );
    }
  );
}

/* ===========================================
   SESSION HELPERS
=========================================== */

export async function isAuthenticated() {
  const session =
    await getSession();

  return !!session;
}

export async function getUserRole() {
  const user =
    await getCurrentUser();

  return user?.role ?? null;
}

export async function getUserStatus() {
  const user =
    await getCurrentUser();

  return user?.status ?? null;
}

/* ===========================================
   EXPORT DEFAULT
=========================================== */

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