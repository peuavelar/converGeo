import { probeScoreSource } from "@/lib/negocio/engineProxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const motor = await probeScoreSource();
  return Response.json(
    {
      status: "ok",
      version: "1.3.2",
      motor,
      demo: motor === "demo",
      layers: {
        databaseUrl: Boolean((process.env.DATABASE_URL || "").trim()),
        supabaseRest: Boolean(
          (process.env.SUPABASE_URL || "").trim() &&
            (
              process.env.SUPABASE_SECRET_KEY ||
              process.env.SUPABASE_PUBLISHABLE_KEY ||
              ""
            ).trim(),
        ),
      },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
