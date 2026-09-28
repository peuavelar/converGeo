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
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
