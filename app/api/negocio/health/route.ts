import { probeUpstream } from "@/lib/negocio/engineProxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const motor = await probeUpstream();
  return Response.json(
    {
      status: "ok",
      version: "1.3.2",
      motor: motor === "up" ? "remoto" : "demo",
      demo: motor !== "up",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
