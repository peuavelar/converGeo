import { dataSources } from "@/lib/config/dataSources";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Healthcheck local / Vercel — útil antes do deploy. */
export async function GET() {
  const payload: Record<string, unknown> = {
    ok: true,
    service: "convergeo-web",
    version: "1.3.0",
    time: new Date().toISOString(),
  };
  // Em produção não publica origem interna do motor nem modo de dados.
  if (process.env.VERCEL !== "1" && process.env.NODE_ENV !== "production") {
    payload.dataProvider = dataSources.mode;
    payload.osm = {
      overpass: true,
      nominatim: true,
      docs: "https://github.com/openstreetmap",
    };
  }
  return Response.json(payload, {
    headers: { "Cache-Control": "no-store" },
  });
}
