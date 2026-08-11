import { dataSources } from "@/lib/config/dataSources";
import { cacheGet, cacheSet, nearbyCacheKey } from "@/lib/cache/memoryCache";
import { createGeoProvider } from "@/lib/providers/createGeoProvider";
import type { NearbyResponse } from "@/lib/geo/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/geo/nearby?lat=&lng=&radius_m=
 * BFF: OpenStreetMap Overpass (ou backend Python conforme DATA_PROVIDER).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));
  const radiusM = Number(
    searchParams.get("radius_m") || dataSources.nearbyDefaultRadiusM,
  );

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return Response.json(
      { error: "lat e lng são obrigatórios" },
      { status: 400 },
    );
  }

  const key = nearbyCacheKey(lat, lng, radiusM);
  const cached = cacheGet<NearbyResponse>(key);
  if (cached) {
    return Response.json({ ...cached, cached: true });
  }

  const provider = createGeoProvider();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);

  try {
    const result = await provider.fetchNearby({
      lat,
      lng,
      radiusM: Number.isFinite(radiusM) ? radiusM : dataSources.nearbyDefaultRadiusM,
      signal: controller.signal,
    });
    cacheSet(key, result, dataSources.nearbyCacheTtlMs);
    return Response.json({ ...result, cached: false });
  } catch (err) {
    const message = err instanceof Error ? err.message : "nearby failed";
    return Response.json({ error: message }, { status: 502 });
  } finally {
    clearTimeout(timer);
  }
}
