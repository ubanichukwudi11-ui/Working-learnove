import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || "";

export const SUPABASE_CONFIG_ERROR =
  "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment variables.";

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    !supabaseUrl.includes("placeholder") &&
    supabaseAnonKey &&
    !supabaseAnonKey.includes("placeholder")
);

function createUnconfiguredQueryResult() {
  const err = new Error(SUPABASE_CONFIG_ERROR);
  const result = { data: null, error: err };
  const builder: Record<string, unknown> = {
    then: (resolve: (v: typeof result) => unknown) => Promise.resolve(result).then(resolve),
  };
  const proxy: unknown = new Proxy(builder, {
    get(target, prop) {
      if (prop === "then") return target.then;
      if (prop === "getPublicUrl") {
        return () => ({ data: { publicUrl: "" } });
      }
      return () => proxy;
    },
  });
  return proxy;
}

function createUnconfiguredClient(): SupabaseClient {
  const err = new Error(SUPABASE_CONFIG_ERROR);
  const authMock = {
    getSession: async () => ({ data: { session: null }, error: err }),
    getUser: async () => ({ data: { user: null }, error: err }),
    setSession: async () => ({ data: { session: null, user: null }, error: err }),
    signInWithOAuth: async () => ({ data: { provider: "google", url: "" }, error: err }),
    signInWithPassword: async () => ({ data: { session: null, user: null }, error: err }),
    signUp: async () => ({ data: { session: null, user: null }, error: err }),
    signOut: async () => ({ error: null }),
    resetPasswordForEmail: async () => ({ data: {}, error: err }),
    onAuthStateChange: () => ({
      data: {
        subscription: {
          id: "unconfigured",
          callback: () => {},
          unsubscribe: () => {},
        },
      },
    }),
  };

  return {
    auth: authMock,
    from: () => createUnconfiguredQueryResult(),
    storage: {
      from: () => createUnconfiguredQueryResult(),
    },
  } as unknown as SupabaseClient;
}

export const supabase: SupabaseClient = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : createUnconfiguredClient();