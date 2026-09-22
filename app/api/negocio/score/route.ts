import { resolveScore } from "@/lib/negocio/engineProxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const lat = Number(url.searchParams.get("lat"));
  const lng = Number(url.searchParams.get("lng"));
  const segmento = url.searchParams.get("segmento") || "food_service";
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return Response.json(
      { status: "sem_dados", mensagem: "lat e lng são obrigatórios." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }
  const { body } = await resolveScore(lat, lng, segmento);
  return Response.json(body, { headers: { "Cache-Control": "no-store" } });
}
