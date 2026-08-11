import { createGeoProvider } from "@/lib/providers/createGeoProvider";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/geo/reverse?lat=&lng=
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return Response.json(
      { error: "lat e lng são obrigatórios" },
      { status: 400 },
    );
  }

  try {
    const provider = createGeoProvider();
    const hit = await provider.reverseGeocode({ lat, lng });
    if (!hit) {
      return Response.json({ error: "não encontrado" }, { status: 404 });
    }
    return Response.json(hit);
  } catch (err) {
    const message = err instanceof Error ? err.message : "reverse failed";
    return Response.json({ error: message }, { status: 502 });
  }
}
