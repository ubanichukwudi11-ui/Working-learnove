import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
  "https://wvisrluzisxswqmroswk.supabase.co";

const envServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const isValidServiceKey = Boolean(
  envServiceRole &&
    (envServiceRole.startsWith("sb_secret_") ||
      envServiceRole.split(".").length === 3)
);

const supabaseServiceKey =
  (isValidServiceKey ? envServiceRole : undefined) ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2aXNybHV6aXN4c3dxbXJvc3drIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjU0OTU5NCwiZXhwIjoyMDk4MTI1NTk0fQ.rOzApMHawv2eNwMXGWGeWSR8AiFswVrd4bssB7x0xuo";

const supabasePublicKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || supabaseServiceKey;

export const isSupabaseServerConfigured = Boolean(
  supabaseUrl &&
    !supabaseUrl.includes("placeholder") &&
    supabaseServiceKey &&
    !supabaseServiceKey.includes("placeholder")
);

export function getSupabaseServerClient(): SupabaseClient {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export function getSupabaseAuthClient(): SupabaseClient {
  return createClient(supabaseUrl, supabasePublicKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
