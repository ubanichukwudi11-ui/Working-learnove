import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://wvisrluzisxswqmroswk.supabase.co";

const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2aXNybHV6aXN4c3dxbXJvc3drIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjU0OTU5NCwiZXhwIjoyMDk4MTI1NTk0fQ.rOzApMHawv2eNwMXGWGeWSR8AiFswVrd4bssB7x0xuo";

export const isSupabaseServerConfigured = Boolean(
  supabaseUrl &&
    !supabaseUrl.includes("placeholder") &&
    supabaseKey &&
    !supabaseKey.includes("placeholder")
);

export function getSupabaseServerClient() {
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
