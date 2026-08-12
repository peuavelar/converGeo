import { dataSources } from "@/lib/config/dataSources";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Healthcheck local / Vercel — útil antes do deploy. */
export async function GET() {
  return Response.json({
    ok: true,
    service: "convergeo-web",
    version: "1.2.0",
    dataProvider: dataSources.mode,
    backendOrigin: dataSources.backendOrigin || null,
    osm: {
      overpass: true,
      nominatim: true,
      docs: "https://github.com/openstreetmap",
      turbo: "https://overpass-turbo.eu/",
    },
    time: new Date().toISOString(),
  });
}
