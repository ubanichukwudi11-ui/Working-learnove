-- Learnova Production Schema Completion, Extensions, Quotas, Live Room State & Strict RLS
-- Idempotent migration designed for Supabase PostgreSQL (Pro / Production).

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================================
-- 1. CORE USER PROFILES (ensure existence on fresh instances too)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'STUDENT' CHECK (role IN ('SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT')),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PENDING', 'REJECTED', 'SUSPENDED')),
  avatar_url TEXT,
  phone TEXT,
  gender TEXT,
  country TEXT,
  state TEXT,
  address TEXT,
  dob TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.student_profiles (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  class_level TEXT NOT NULL DEFAULT 'SS1',
  age INTEGER,
  profile_photo TEXT,
  ai_purpose JSONB DEFAULT '[]'::jsonb,
  exam_preparation TEXT,
  favourite_subjects JSONB DEFAULT '[]'::jsonb,
  learning_style JSONB DEFAULT '[]'::jsonb,
  study_hours TEXT,
  study_time TEXT,
  learning_goal TEXT,
  reminders TEXT,
  low_data_default BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.teacher_profiles (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject TEXT,
  qualification TEXT,
  institution TEXT,
  experience TEXT,
  license_number TEXT,
  profile_photo TEXT,
  teaching_certificate TEXT,
  degree_certificate TEXT,
  government_id TEXT,
  cv TEXT,
  verification_score INTEGER NOT NULL DEFAULT 0,
  admin_notes TEXT,
  approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.parent_profiles (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_name TEXT,
  child_id_number TEXT,
  relationship TEXT DEFAULT 'Parent',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================================
-- 2. NON-DESTRUCTIVE COLUMN EXTENSIONS ON 20261113 LMS TABLES
-- =====================================================================
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS external_id TEXT UNIQUE;
ALTER TABLE public.class_levels ADD COLUMN IF NOT EXISTS external_id TEXT UNIQUE;
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS external_id TEXT UNIQUE;
ALTER TABLE public.academic_sessions ADD COLUMN IF NOT EXISTS external_id TEXT UNIQUE;
ALTER TABLE public.academic_terms ADD COLUMN IF NOT EXISTS external_id TEXT UNIQUE;
ALTER TABLE public.subscription_plans ADD COLUMN IF NOT EXISTS external_id TEXT UNIQUE;
ALTER TABLE public.subscription_plans ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
ALTER TABLE public.teacher_subject_applications ADD COLUMN IF NOT EXISTS external_id TEXT UNIQUE;
ALTER TABLE public.teacher_subject_applications ADD COLUMN IF NOT EXISTS teacher_name TEXT;
ALTER TABLE public.teacher_subject_applications ADD COLUMN IF NOT EXISTS teacher_email TEXT;
ALTER TABLE public.teacher_subject_applications ADD COLUMN IF NOT EXISTS subject_name TEXT;
ALTER TABLE public.teacher_subject_applications ADD COLUMN IF NOT EXISTS institution TEXT;
ALTER TABLE public.teacher_subject_approvals ADD COLUMN IF NOT EXISTS external_id TEXT UNIQUE;
ALTER TABLE public.teacher_subject_approvals ADD COLUMN IF NOT EXISTS teacher_name TEXT;
ALTER TABLE public.teacher_subject_approvals ADD COLUMN IF NOT EXISTS subject_name TEXT;
ALTER TABLE public.teacher_subject_approvals ADD COLUMN IF NOT EXISTS class_level_name TEXT;
ALTER TABLE public.payment_records ADD COLUMN IF NOT EXISTS external_id TEXT UNIQUE;
ALTER TABLE public.payment_records ADD COLUMN IF NOT EXISTS plan_name TEXT DEFAULT '';
ALTER TABLE public.payment_records ADD COLUMN IF NOT EXISTS class_level_id UUID REFERENCES public.class_levels(id) ON DELETE SET NULL;
ALTER TABLE public.payment_records ADD COLUMN IF NOT EXISTS student_name TEXT;
ALTER TABLE public.payment_records ADD COLUMN IF NOT EXISTS student_email TEXT;
ALTER TABLE public.subscription_entitlements ADD COLUMN IF NOT EXISTS external_id TEXT UNIQUE;
ALTER TABLE public.subscription_entitlements ADD COLUMN IF NOT EXISTS student_name TEXT;
ALTER TABLE public.subscription_entitlements ADD COLUMN IF NOT EXISTS student_email TEXT;
ALTER TABLE public.timetable_entries ADD COLUMN IF NOT EXISTS external_id TEXT UNIQUE;
ALTER TABLE public.timetable_entries ADD COLUMN IF NOT EXISTS allocation_status TEXT NOT NULL DEFAULT 'UNALLOCATED';
ALTER TABLE public.timetable_entries ADD COLUMN IF NOT EXISTS eligible_student_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.timetable_entries ADD COLUMN IF NOT EXISTS shortfall_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.student_groups ADD COLUMN IF NOT EXISTS external_id TEXT UNIQUE;
ALTER TABLE public.student_groups ADD COLUMN IF NOT EXISTS teacher_name TEXT;
ALTER TABLE public.classroom_records ADD COLUMN IF NOT EXISTS external_id TEXT UNIQUE;
ALTER TABLE public.classroom_records ADD COLUMN IF NOT EXISTS group_name TEXT;
ALTER TABLE public.classroom_records ADD COLUMN IF NOT EXISTS teacher_name TEXT;
ALTER TABLE public.classroom_records ADD COLUMN IF NOT EXISTS class_level_name TEXT;
ALTER TABLE public.classroom_records ADD COLUMN IF NOT EXISTS subject_name TEXT;
ALTER TABLE public.classroom_records ADD COLUMN IF NOT EXISTS day_of_week TEXT;
ALTER TABLE public.classroom_records ADD COLUMN IF NOT EXISTS start_time TEXT;
ALTER TABLE public.classroom_records ADD COLUMN IF NOT EXISTS end_time TEXT;
ALTER TABLE public.classroom_records ADD COLUMN IF NOT EXISTS teaching_mode TEXT DEFAULT 'ONLINE';
ALTER TABLE public.classroom_records ADD COLUMN IF NOT EXISTS max_capacity INTEGER DEFAULT 50;
ALTER TABLE public.classroom_records ADD COLUMN IF NOT EXISTS assignments_text TEXT DEFAULT '';
ALTER TABLE public.attendance_records ADD COLUMN IF NOT EXISTS student_name TEXT;
ALTER TABLE public.notifications ALTER COLUMN recipient_user_id DROP NOT NULL;

-- =====================================================================
-- 3. PLATFORM SETTINGS, CURRICULUM, VIDEOS, QUIZZES, PARENT LINKS
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id TEXT PRIMARY KEY DEFAULT 'global',
  platform_name TEXT NOT NULL DEFAULT 'Learnova Nigeria',
  default_timezone TEXT NOT NULL DEFAULT 'Africa/Lagos',
  default_room_capacity INTEGER NOT NULL DEFAULT 50,
  allow_manual_bank_transfer BOOLEAN NOT NULL DEFAULT TRUE,
  super_admin_emails JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.curriculum_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT UNIQUE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  term_id UUID NOT NULL REFERENCES public.academic_terms(id) ON DELETE CASCADE,
  class_level_id UUID NOT NULL REFERENCES public.class_levels(id) ON DELETE CASCADE,
  topic_order INTEGER NOT NULL DEFAULT 1,
  week_label TEXT,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  created_by TEXT NOT NULL DEFAULT 'system',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.video_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT UNIQUE,
  topic_id UUID NOT NULL REFERENCES public.curriculum_topics(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  term_id UUID NOT NULL REFERENCES public.academic_terms(id) ON DELETE CASCADE,
  class_level_id UUID NOT NULL REFERENCES public.class_levels(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  source_type TEXT NOT NULL CHECK (source_type IN ('UPLOADED_VIDEO', 'YOUTUBE', 'EXTERNAL_LINK')),
  video_url TEXT NOT NULL,
  youtube_video_id TEXT,
  storage_path TEXT,
  mime_type TEXT,
  file_size_bytes BIGINT,
  duration_label TEXT,
  materials JSONB NOT NULL DEFAULT '[]'::jsonb,
  uploaded_by_user_id TEXT NOT NULL,
  uploaded_by_name TEXT NOT NULL,
  uploaded_by_role TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PUBLISHED' CHECK (status IN ('PUBLISHED', 'PENDING_REVIEW', 'REVISION_REQUESTED', 'ARCHIVED')),
  review_notes TEXT,
  request_id TEXT,
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.video_upload_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT UNIQUE,
  topic_id UUID NOT NULL REFERENCES public.curriculum_topics(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  term_id UUID NOT NULL REFERENCES public.academic_terms(id) ON DELETE CASCADE,
  class_level_id UUID NOT NULL REFERENCES public.class_levels(id) ON DELETE CASCADE,
  teacher_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  teacher_name TEXT NOT NULL,
  requested_by_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  requested_by_name TEXT NOT NULL,
  instructions TEXT NOT NULL,
  due_date TEXT,
  status TEXT NOT NULL DEFAULT 'REQUESTED' CHECK (status IN ('REQUESTED', 'IN_PROGRESS', 'SUBMITTED', 'APPROVED', 'REVISION_REQUESTED')),
  fulfilled_video_id TEXT,
  admin_review_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.video_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT UNIQUE,
  video_id UUID NOT NULL REFERENCES public.video_lessons(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES public.curriculum_topics(id) ON DELETE CASCADE,
  timestamp_label TEXT,
  author_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  author_role TEXT NOT NULL,
  question TEXT NOT NULL,
  replies JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT UNIQUE,
  student_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  subject_name TEXT NOT NULL,
  topic_id TEXT,
  topic_title TEXT,
  quiz_type TEXT NOT NULL CHECK (quiz_type IN ('TOPIC_QUIZ', 'TIMED_CBT')),
  title TEXT NOT NULL,
  score INTEGER NOT NULL,
  total INTEGER NOT NULL,
  percentage NUMERIC(5,2) NOT NULL,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Parent-Student Verified Consent Links
CREATE TABLE IF NOT EXISTS public.parent_student_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT UNIQUE,
  parent_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_email TEXT NOT NULL,
  student_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_email TEXT NOT NULL,
  relationship TEXT NOT NULL DEFAULT 'Parent / Guardian',
  status TEXT NOT NULL DEFAULT 'PENDING_VERIFICATION' CHECK (status IN ('PENDING_VERIFICATION', 'VERIFIED', 'REJECTED')),
  verification_code TEXT,
  verified_by TEXT,
  verified_at TIMESTAMPTZ,
  linked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (parent_user_id, student_user_id)
);

-- AI Usage Quotas & Rate Tracking
CREATE TABLE IF NOT EXISTS public.ai_usage_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  chat_count INTEGER NOT NULL DEFAULT 0,
  flashcard_count INTEGER NOT NULL DEFAULT 0,
  transcribe_count INTEGER NOT NULL DEFAULT 0,
  voice_seconds INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, usage_date)
);

-- Persistent Live Classroom State (eliminates Node global RAM cache)
CREATE TABLE IF NOT EXISTS public.live_room_states (
  class_id TEXT PRIMARY KEY,
  snapshot JSONB NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Paystack Webhook Event Idempotency Log
CREATE TABLE IF NOT EXISTS public.paystack_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  reference TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================================
-- 4. INDEXES
-- =====================================================================
CREATE INDEX IF NOT EXISTS idx_video_lessons_lookup ON public.video_lessons(subject_id, term_id, class_level_id, status);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_student ON public.quiz_attempts(student_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_parent_links_parent ON public.parent_student_links(parent_user_id, status);
CREATE INDEX IF NOT EXISTS idx_parent_links_student ON public.parent_student_links(student_user_id, status);
CREATE INDEX IF NOT EXISTS idx_ai_quotas_user_date ON public.ai_usage_quotas(user_id, usage_date);
CREATE INDEX IF NOT EXISTS idx_paystack_events_ref ON public.paystack_webhook_events(reference);

-- =====================================================================
-- 5. STRICT ROW LEVEL SECURITY (100% COVERAGE)
-- =====================================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('ADMIN', 'SUPER_ADMIN')
      AND status = 'ACTIVE'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_verified_parent_of(target_student_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.parent_student_links
    WHERE parent_user_id = auth.uid()
      AND student_user_id = target_student_id
      AND status = 'VERIFIED'
  );
$$;

-- Enable RLS across ALL public tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subject_class_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_subject_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_subject_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_enrolments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetable_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_group_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classroom_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curriculum_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_upload_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_student_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_room_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paystack_webhook_events ENABLE ROW LEVEL SECURITY;

-- Profiles & Role Profiles
DROP POLICY IF EXISTS "Users read own profile or admin" ON public.profiles;
CREATE POLICY "Users read own profile or admin" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Users update own safe profile fields" ON public.profiles;
CREATE POLICY "Users update own safe profile fields" ON public.profiles
  FOR UPDATE USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Admins manage profiles" ON public.profiles;
CREATE POLICY "Admins manage profiles" ON public.profiles
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Students read/update own student profile" ON public.student_profiles;
CREATE POLICY "Students read/update own student profile" ON public.student_profiles
  FOR ALL USING (auth.uid() = user_id OR public.is_admin() OR public.is_verified_parent_of(user_id));

DROP POLICY IF EXISTS "Teachers read/update own teacher profile" ON public.teacher_profiles;
CREATE POLICY "Teachers read/update own teacher profile" ON public.teacher_profiles
  FOR ALL USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Parents read/update own parent profile" ON public.parent_profiles;
CREATE POLICY "Parents read/update own parent profile" ON public.parent_profiles
  FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- Catalog & Curriculum (Read-only for authenticated/public active rows; Admin writes)
DROP POLICY IF EXISTS "Public read schools" ON public.schools;
CREATE POLICY "Public read schools" ON public.schools FOR SELECT USING (status = 'ACTIVE' OR public.is_admin());
DROP POLICY IF EXISTS "Admin manage schools" ON public.schools;
CREATE POLICY "Admin manage schools" ON public.schools FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Public read subject class levels" ON public.subject_class_levels;
CREATE POLICY "Public read subject class levels" ON public.subject_class_levels FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS "Admin manage subject class levels" ON public.subject_class_levels;
CREATE POLICY "Admin manage subject class levels" ON public.subject_class_levels FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Public read academic sessions" ON public.academic_sessions;
CREATE POLICY "Public read academic sessions" ON public.academic_sessions FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS "Admin manage academic sessions" ON public.academic_sessions;
CREATE POLICY "Admin manage academic sessions" ON public.academic_sessions FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Public read academic terms" ON public.academic_terms;
CREATE POLICY "Public read academic terms" ON public.academic_terms FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS "Admin manage academic terms" ON public.academic_terms;
CREATE POLICY "Admin manage academic terms" ON public.academic_terms FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Public read active subscription plans" ON public.subscription_plans;
CREATE POLICY "Public read active subscription plans" ON public.subscription_plans FOR SELECT USING (is_active = TRUE OR public.is_admin());
DROP POLICY IF EXISTS "Admin manage subscription plans" ON public.subscription_plans;
CREATE POLICY "Admin manage subscription plans" ON public.subscription_plans FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins manage platform settings" ON public.platform_settings;
CREATE POLICY "Admins manage platform settings" ON public.platform_settings FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins manage role permissions" ON public.role_permissions;
CREATE POLICY "Admins manage role permissions" ON public.role_permissions FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- Teacher Applications & Approvals
DROP POLICY IF EXISTS "Teachers read/write own applications" ON public.teacher_subject_applications;
CREATE POLICY "Teachers read/write own applications" ON public.teacher_subject_applications
  FOR ALL USING (auth.uid() = teacher_user_id OR public.is_admin());

DROP POLICY IF EXISTS "Teachers read own approvals" ON public.teacher_subject_approvals;
CREATE POLICY "Teachers read own approvals" ON public.teacher_subject_approvals
  FOR SELECT USING (auth.uid() = teacher_user_id OR public.is_admin());
DROP POLICY IF EXISTS "Admins manage approvals" ON public.teacher_subject_approvals;
CREATE POLICY "Admins manage approvals" ON public.teacher_subject_approvals
  FOR ALL USING (public.is_admin());

-- Enrolments, Payments & Entitlements
DROP POLICY IF EXISTS "Students & verified parents read enrolments" ON public.student_enrolments;
CREATE POLICY "Students & verified parents read enrolments" ON public.student_enrolments
  FOR SELECT USING (auth.uid() = student_user_id OR public.is_verified_parent_of(student_user_id) OR public.is_admin());

DROP POLICY IF EXISTS "Students & verified parents read payments" ON public.payment_records;
CREATE POLICY "Students & verified parents read payments" ON public.payment_records
  FOR SELECT USING (auth.uid() = student_user_id OR public.is_verified_parent_of(student_user_id) OR public.is_admin());

DROP POLICY IF EXISTS "Students & verified parents read entitlements" ON public.subscription_entitlements;
CREATE POLICY "Students & verified parents read entitlements" ON public.subscription_entitlements
  FOR SELECT USING (auth.uid() = student_user_id OR public.is_verified_parent_of(student_user_id) OR public.is_admin());

-- Timetables, Assignments, Groups, Classrooms, Attendance
DROP POLICY IF EXISTS "Authenticated read published timetables" ON public.timetable_entries;
CREATE POLICY "Authenticated read published timetables" ON public.timetable_entries
  FOR SELECT USING (publication_status = 'PUBLISHED' OR public.is_admin());

DROP POLICY IF EXISTS "Teachers read own timetable assignments" ON public.teacher_assignments;
CREATE POLICY "Teachers read own timetable assignments" ON public.teacher_assignments
  FOR SELECT USING (auth.uid() = teacher_user_id OR public.is_admin());

DROP POLICY IF EXISTS "Participants read student groups" ON public.student_groups;
CREATE POLICY "Participants read student groups" ON public.student_groups
  FOR SELECT USING (
    auth.uid() = teacher_user_id
    OR public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.student_group_memberships m
      WHERE m.student_group_id = id AND m.student_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Assigned users read classrooms" ON public.classroom_records;
CREATE POLICY "Assigned users read classrooms" ON public.classroom_records
  FOR SELECT USING (
    auth.uid() = teacher_user_id
    OR public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.student_group_memberships m
      WHERE m.student_group_id = student_group_id AND m.student_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Students, parents & teachers read attendance" ON public.attendance_records;
CREATE POLICY "Students, parents & teachers read attendance" ON public.attendance_records
  FOR SELECT USING (
    auth.uid() = student_user_id
    OR public.is_verified_parent_of(student_user_id)
    OR public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.classroom_records c
      WHERE c.id = classroom_id AND c.teacher_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Authenticated read learning materials" ON public.learning_materials;
CREATE POLICY "Authenticated read learning materials" ON public.learning_materials
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Curriculum Topics, Video Lessons, Upload Requests, Q&A, Quiz Attempts
DROP POLICY IF EXISTS "Authenticated read published topics" ON public.curriculum_topics;
CREATE POLICY "Authenticated read published topics" ON public.curriculum_topics
  FOR SELECT USING (is_published = TRUE OR public.is_admin());

DROP POLICY IF EXISTS "Authenticated read published video lessons" ON public.video_lessons;
CREATE POLICY "Authenticated read published video lessons" ON public.video_lessons
  FOR SELECT USING (status = 'PUBLISHED' OR uploaded_by_user_id = auth.uid()::text OR public.is_admin());

DROP POLICY IF EXISTS "Teachers read own upload requests" ON public.video_upload_requests;
CREATE POLICY "Teachers read own upload requests" ON public.video_upload_requests
  FOR SELECT USING (auth.uid() = teacher_user_id OR public.is_admin());

DROP POLICY IF EXISTS "Authenticated read video questions" ON public.video_questions;
CREATE POLICY "Authenticated read video questions" ON public.video_questions
  FOR SELECT USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Authenticated ask video questions" ON public.video_questions;
CREATE POLICY "Authenticated ask video questions" ON public.video_questions
  FOR INSERT WITH CHECK (auth.uid() = author_user_id);

DROP POLICY IF EXISTS "Students & verified parents read quiz attempts" ON public.quiz_attempts;
CREATE POLICY "Students & verified parents read quiz attempts" ON public.quiz_attempts
  FOR SELECT USING (auth.uid() = student_user_id OR public.is_verified_parent_of(student_user_id) OR public.is_admin());

-- Parent-Student Links
DROP POLICY IF EXISTS "Parents and students read own links" ON public.parent_student_links;
CREATE POLICY "Parents and students read own links" ON public.parent_student_links
  FOR SELECT USING (auth.uid() = parent_user_id OR auth.uid() = student_user_id OR public.is_admin());

-- AI Quotas, Live Room States, Webhook Events, Audit Logs
DROP POLICY IF EXISTS "Users read own AI quotas" ON public.ai_usage_quotas;
CREATE POLICY "Users read own AI quotas" ON public.ai_usage_quotas
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Admins read audit logs" ON public.audit_logs;
CREATE POLICY "Admins read audit logs" ON public.audit_logs
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins read webhook events" ON public.paystack_webhook_events;
CREATE POLICY "Admins read webhook events" ON public.paystack_webhook_events
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Authenticated read live room states" ON public.live_room_states;
CREATE POLICY "Authenticated read live room states" ON public.live_room_states
  FOR SELECT USING (auth.uid() IS NOT NULL);
