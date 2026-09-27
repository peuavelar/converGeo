import { createContextClient, resolveEnv } from "@supabase/server/core";

/** Cliente anónimo (RLS). Exige SUPABASE_URL + SUPABASE_PUBLISHABLE_KEY. */
export function getSupabaseAnon() {
  return createContextClient();
}

export function supabaseEnvStatus() {
  const { data, error } = resolveEnv();
  return {
    configured: Boolean(data?.url && !error),
    urlHost: data?.url ? new URL(data.url).host : null,
    hasPublishableKey: Boolean(data && !error),
    hasSecretKey: Boolean(process.env.SUPABASE_SECRET_KEY),
    jwks: Boolean(process.env.SUPABASE_JWKS_URL),
    error: error ? error.message : null,
  };
}
