-- Learnova Complete School Management, Timetable, Payment, Allocation & Live Classroom Schema
-- Safe, idempotent, non-destructive migration (CREATE TABLE IF NOT EXISTS only).

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Schools / Tenants
CREATE TABLE IF NOT EXISTS public.schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  state TEXT NOT NULL DEFAULT 'Lagos',
  address TEXT,
  timezone TEXT NOT NULL DEFAULT 'Africa/Lagos',
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Role Permissions & Elevated Admin Grants
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL,
  role TEXT NOT NULL CHECK (role IN ('SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT')),
  permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
  granted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, role)
);

-- 3. Class Levels (JSS1 - SS3 + configurable school levels)
CREATE TABLE IF NOT EXISTS public.class_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('JSS', 'SSS', 'PRIMARY', 'OTHER')),
  sort_order INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (school_id, code)
);

-- 4. Subjects & Class Level Mapping
CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  department TEXT NOT NULL DEFAULT 'Core',
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (school_id, code)
);

CREATE TABLE IF NOT EXISTS public.subject_class_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  class_level_id UUID NOT NULL REFERENCES public.class_levels(id) ON DELETE CASCADE,
  UNIQUE (subject_id, class_level_id)
);

-- 5. Academic Sessions & Terms
CREATE TABLE IF NOT EXISTS public.academic_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_current BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.academic_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.academic_sessions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  starts_at DATE NOT NULL,
  ends_at DATE NOT NULL,
  is_current BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Teacher Subject Applications & Admin Approvals
CREATE TABLE IF NOT EXISTS public.teacher_subject_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  class_level_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  qualification TEXT NOT NULL,
  experience_years TEXT,
  license_number TEXT,
  bio TEXT,
  document_urls JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'RESUBMISSION_REQUIRED', 'SUSPENDED')),
  admin_explanation TEXT,
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.teacher_subject_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  class_level_id UUID NOT NULL REFERENCES public.class_levels(id) ON DELETE CASCADE,
  application_id UUID REFERENCES public.teacher_subject_applications(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'APPROVED' CHECK (status IN ('APPROVED', 'SUSPENDED', 'REVOKED')),
  approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reason TEXT,
  approved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (teacher_user_id, subject_id, class_level_id)
);

-- 7. Subscription Plans, Payment Records & Student Entitlements
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('MONTHLY', 'TERM', 'SESSION')),
  price_ngn INTEGER NOT NULL CHECK (price_ngn >= 0),
  included_subject_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  all_subjects_included BOOLEAN NOT NULL DEFAULT FALSE,
  duration_days INTEGER NOT NULL DEFAULT 90,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.student_enrolments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  class_level_id UUID NOT NULL REFERENCES public.class_levels(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.academic_sessions(id) ON DELETE SET NULL,
  term_id UUID REFERENCES public.academic_terms(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'ENROLLED' CHECK (status IN ('REGISTERED', 'ENROLLED', 'WITHDRAWN')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (student_user_id, class_level_id, subject_id)
);

CREATE TABLE IF NOT EXISTS public.payment_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.subscription_plans(id) ON DELETE SET NULL,
  subject_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  amount_ngn INTEGER NOT NULL CHECK (amount_ngn >= 0),
  provider TEXT NOT NULL CHECK (provider IN ('PAYSTACK', 'BANK_TRANSFER', 'SCHOLARSHIP', 'MANUAL_ADMIN')),
  reference TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'AWAITING_CONFIRMATION' CHECK (status IN ('AWAITING_CONFIRMATION', 'VERIFIED', 'FAILED', 'REFUNDED')),
  verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.subscription_entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  class_level_id UUID NOT NULL REFERENCES public.class_levels(id) ON DELETE CASCADE,
  subject_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  all_subjects BOOLEAN NOT NULL DEFAULT FALSE,
  access_status TEXT NOT NULL CHECK (access_status IN ('REGISTERED', 'ENROLLED', 'ACTIVE_PAID', 'EXPIRED', 'AWAITING_CONFIRMATION', 'SCHOLARSHIP_GRANTED')),
  payment_id UUID REFERENCES public.payment_records(id) ON DELETE SET NULL,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  granted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reason TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Official Timetable, Multi-Teacher Assignments & Student Grouping
CREATE TABLE IF NOT EXISTS public.timetable_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.academic_sessions(id) ON DELETE SET NULL,
  term_id UUID REFERENCES public.academic_terms(id) ON DELETE SET NULL,
  class_level_id UUID NOT NULL REFERENCES public.class_levels(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  day_of_week TEXT NOT NULL CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday')),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  teaching_mode TEXT NOT NULL DEFAULT 'ONLINE' CHECK (teaching_mode IN ('ONLINE', 'PHYSICAL', 'HYBRID')),
  max_capacity_per_room INTEGER NOT NULL DEFAULT 50 CHECK (max_capacity_per_room > 0),
  publication_status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (publication_status IN ('DRAFT', 'PUBLISHED', 'CANCELLED')),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (end_time > start_time)
);

CREATE TABLE IF NOT EXISTS public.teacher_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timetable_entry_id UUID NOT NULL REFERENCES public.timetable_entries(id) ON DELETE CASCADE,
  teacher_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (timetable_entry_id, teacher_user_id)
);

CREATE TABLE IF NOT EXISTS public.student_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timetable_entry_id UUID NOT NULL REFERENCES public.timetable_entries(id) ON DELETE CASCADE,
  group_name TEXT NOT NULL,
  group_number INTEGER NOT NULL,
  teacher_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  max_capacity INTEGER NOT NULL DEFAULT 50,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (timetable_entry_id, group_number)
);

CREATE TABLE IF NOT EXISTS public.student_group_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_group_id UUID NOT NULL REFERENCES public.student_groups(id) ON DELETE CASCADE,
  timetable_entry_id UUID NOT NULL REFERENCES public.timetable_entries(id) ON DELETE CASCADE,
  student_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assigned_reason TEXT,
  is_manual_override BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (timetable_entry_id, student_user_id)
);

-- 9. Classroom Records, Attendance, Learning Materials, Notifications & Audit Logs
CREATE TABLE IF NOT EXISTS public.classroom_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timetable_entry_id UUID NOT NULL REFERENCES public.timetable_entries(id) ON DELETE CASCADE,
  student_group_id UUID NOT NULL UNIQUE REFERENCES public.student_groups(id) ON DELETE CASCADE,
  teacher_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  class_level_id UUID NOT NULL REFERENCES public.class_levels(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  lesson_title TEXT NOT NULL,
  lesson_description TEXT,
  lesson_objectives TEXT,
  lesson_notes TEXT,
  status TEXT NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'PREPARED', 'LIVE', 'ENDED', 'CANCELLED')),
  prepared_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id UUID NOT NULL REFERENCES public.classroom_records(id) ON DELETE CASCADE,
  student_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('PRESENT', 'ABSENT', 'LATE')),
  joined_at TIMESTAMPTZ,
  left_at TIMESTAMPTZ,
  recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (classroom_id, student_user_id)
);

CREATE TABLE IF NOT EXISTS public.learning_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id UUID REFERENCES public.classroom_records(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  class_level_id UUID REFERENCES public.class_levels(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  material_type TEXT NOT NULL DEFAULT 'PDF',
  file_url TEXT,
  notes_content TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_role TEXT,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  href TEXT,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_email TEXT,
  actor_role TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  reason TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for high-frequency queries
CREATE INDEX IF NOT EXISTS idx_teacher_approvals_lookup ON public.teacher_subject_approvals(subject_id, class_level_id, status);
CREATE INDEX IF NOT EXISTS idx_enrolments_student ON public.student_enrolments(student_user_id, class_level_id);
CREATE INDEX IF NOT EXISTS idx_entitlements_student ON public.subscription_entitlements(student_user_id, access_status);
CREATE INDEX IF NOT EXISTS idx_timetable_schedule ON public.timetable_entries(class_level_id, day_of_week, publication_status);
CREATE INDEX IF NOT EXISTS idx_group_memberships_student ON public.student_group_memberships(student_user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient_user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);

-- Enable Row Level Security across all new tables
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_subject_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_subject_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_enrolments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetable_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_group_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classroom_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Baseline RLS policies (Server service role bypasses RLS after verifying user token + role)
CREATE POLICY IF NOT EXISTS "Public active class levels read" ON public.class_levels FOR SELECT USING (is_active = TRUE);
CREATE POLICY IF NOT EXISTS "Public active subjects read" ON public.subjects FOR SELECT USING (is_active = TRUE);
CREATE POLICY IF NOT EXISTS "Users read own notifications" ON public.notifications FOR SELECT USING (auth.uid() = recipient_user_id);
CREATE POLICY IF NOT EXISTS "Users update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = recipient_user_id);
CREATE POLICY IF NOT EXISTS "Students read own enrolments" ON public.student_enrolments FOR SELECT USING (auth.uid() = student_user_id);
CREATE POLICY IF NOT EXISTS "Students read own group memberships" ON public.student_group_memberships FOR SELECT USING (auth.uid() = student_user_id);
