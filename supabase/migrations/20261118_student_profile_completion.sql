-- Add student school_name and profile_completed tracking to public.student_profiles
ALTER TABLE public.student_profiles
  ADD COLUMN IF NOT EXISTS school_name TEXT,
  ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN NOT NULL DEFAULT FALSE;

-- Mark pre-existing student profiles that already have school_name and age/dob as completed
UPDATE public.student_profiles sp
SET profile_completed = TRUE
FROM public.profiles p
WHERE p.id = sp.user_id
  AND COALESCE(TRIM(sp.school_name), '') <> ''
  AND (sp.age IS NOT NULL OR COALESCE(TRIM(p.dob), '') <> '');
