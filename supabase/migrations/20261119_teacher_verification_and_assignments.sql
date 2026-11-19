-- Teacher Verification Workflow, Status History, Internal Admin Notes & Profile Biography
-- Safe, idempotent migration.

ALTER TABLE public.teacher_profiles
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS requested_subjects JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS requested_class_levels JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE public.teacher_subject_applications
  ADD COLUMN IF NOT EXISTS internal_notes TEXT,
  ADD COLUMN IF NOT EXISTS history JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Expand allowed application statuses to include UNDER_REVIEW
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  SELECT c.conname INTO constraint_name
  FROM pg_constraint c
  JOIN pg_class t ON c.conrelid = t.oid
  JOIN pg_namespace n ON t.relnamespace = n.oid
  WHERE n.nspname = 'public'
    AND t.relname = 'teacher_subject_applications'
    AND c.contype = 'c'
    AND pg_get_constraintdef(c.oid) ILIKE '%PENDING_REVIEW%';

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.teacher_subject_applications DROP CONSTRAINT %I', constraint_name);
  END IF;

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
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;
