import { supabaseEnvStatus } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Handshake HTTP do projeto (API keys). Não substitui DATABASE_URL / PostGIS. */
export async function GET() {
  const env = supabaseEnvStatus();
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    return Response.json(
      { ok: false, layer: "api", env },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const base = url.replace(/\/$/, "");
    const auth = await fetch(`${base}/auth/v1/settings`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: "no-store",
    });
    const jwksUrl =
      process.env.SUPABASE_JWKS_URL || `${base}/auth/v1/.well-known/jwks.json`;
    const jwks = await fetch(jwksUrl, { cache: "no-store" });
    const ok = auth.ok && jwks.ok;
    return Response.json(
      {
        ok,
        layer: "api",
        auth: auth.status,
        jwks: jwks.status,
        env,
        note: "Camada API ok. O mapa H3 ainda precisa de DATABASE_URL (Postgres).",
      },
      { status: ok ? 200 : 502, headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      { ok: false, layer: "api", env, error: "falha de rede até o projeto" },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
