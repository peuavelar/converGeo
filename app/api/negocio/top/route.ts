import { resolveTop } from "@/lib/negocio/engineProxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const segmento = url.searchParams.get("segmento") || "food_service";
  const limit = Number(url.searchParams.get("limit") || "5");
  const { body } = await resolveTop(
    segmento,
    Number.isFinite(limit) ? limit : 5,
  );
  return Response.json(body, { headers: { "Cache-Control": "no-store" } });
}
