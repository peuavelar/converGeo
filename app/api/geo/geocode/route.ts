import { createGeoProvider } from "@/lib/providers/createGeoProvider";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/geo/geocode?q=&limit=
 * BFF Nominatim (política OSM: não chamar do browser sem User-Agent).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim();
  const limit = Number(searchParams.get("limit") || 5);

  if (!q) {
    return Response.json({ error: "q é obrigatório" }, { status: 400 });
  }

  try {
    const provider = createGeoProvider();
    const hits = await provider.geocode({
      query: q,
      limit: Number.isFinite(limit) ? limit : 5,
    });
    return Response.json({ hits, count: hits.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : "geocode failed";
    return Response.json({ error: message }, { status: 502 });
  }
}
