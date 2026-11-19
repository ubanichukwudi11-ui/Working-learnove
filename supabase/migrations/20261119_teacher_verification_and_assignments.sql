-- Teacher verification lifecycle, audit timeline, bio, and assignment tracking

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'teacher_subject_applications'
      AND constraint_name = 'teacher_subject_applications_status_check'
  ) THEN
    ALTER TABLE public.teacher_subject_applications
      DROP CONSTRAINT teacher_subject_applications_status_check;
  END IF;
END $$;

ALTER TABLE public.teacher_subject_applications
  ADD CONSTRAINT teacher_subject_applications_status_check
  CHECK (status IN (
    'DRAFT',
    'PENDING_REVIEW',
    'UNDER_REVIEW',
    'APPROVED',
    'REJECTED',
    'RESUBMISSION_REQUIRED',
    'SUSPENDED'
  ));

ALTER TABLE public.teacher_subject_applications
  ADD COLUMN IF NOT EXISTS internal_notes TEXT,
  ADD COLUMN IF NOT EXISTS status_history JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.teacher_profiles
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS document_meta JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.teacher_subject_approvals
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_teacher_subject_apps_status
  ON public.teacher_subject_applications (status);

CREATE INDEX IF NOT EXISTS idx_teacher_subject_approvals_teacher_status
  ON public.teacher_subject_approvals (teacher_user_id, status);
