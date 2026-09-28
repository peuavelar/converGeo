/**
 * Lê public.scores via PostgREST quando a Vercel não tem DATABASE_URL.
 * Requer as views de engine/db/migrations/005_public_scores_api.sql.
 */
import { cellToLatLng, latLngToCell } from "h3-js";
import { H3_RES, type ScoreEmpty, type ScoreOk } from "./demoScores";

type ScoreRow = {
  h3_index: string;
  segmento: string;
  score_estrutural: number | null;
  score_macroeconomico: number | null;
  score_comportamental: number | null;
  score_total: number | null;
};

function restConfig(): { base: string; key: string } | null {
  const base = (process.env.SUPABASE_URL || "").trim().replace(/\/$/, "");
  const key = (
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    ""
  ).trim();
  if (!base || !key) return null;
  return { base, key };
}

export function hasRestScores(): boolean {
  return Boolean(restConfig());
}

function toOk(row: ScoreRow): ScoreOk {
  const [lat, lng] = cellToLatLng(row.h3_index);
  return {
    status: "sucesso",
    h3_index: row.h3_index,
    lat,
    lng,
    segmento: row.segmento,
    score_total: Number(row.score_total),
    breakdown: {
      estrutural: Number(row.score_estrutural || 0),
      macroeconomico: Number(row.score_macroeconomico || 0),
      comportamental: Number(row.score_comportamental || 0),
    },
  };
}

async function restGet(path: string): Promise<ScoreRow[] | null> {
  const cfg = restConfig();
  if (!cfg) return null;
  try {
    const res = await fetch(`${cfg.base}/rest/v1/${path}`, {
      headers: {
        apikey: cfg.key,
        Authorization: `Bearer ${cfg.key}`,
        Accept: "application/json",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as unknown;
    return Array.isArray(data) ? (data as ScoreRow[]) : null;
  } catch {
    return null;
  }
}

export async function restScoreAt(
  lat: number,
  lng: number,
  segmento: string,
): Promise<ScoreOk | ScoreEmpty | null> {
  if (!restConfig()) return null;
  const h3_index = latLngToCell(lat, lng, H3_RES);
  const rows = await restGet(
    `scores?h3_index=eq.${encodeURIComponent(h3_index)}&segmento=eq.${encodeURIComponent(segmento)}&select=h3_index,segmento,score_estrutural,score_macroeconomico,score_comportamental,score_total`,
  );
  if (rows == null) return null;
  const row = rows[0];
  if (!row || row.score_total == null) {
    return {
      status: "sem_dados",
      h3_index,
      mensagem: "Região sem dados suficientes ou fora da área de cobertura.",
    };
  }
  return toOk(row);
}

export async function restTop(
  segmento: string,
  limit: number,
): Promise<{
  status: "sucesso";
  segmento: string;
  recomendacoes: Array<
    Pick<ScoreOk, "h3_index" | "lat" | "lng" | "score_total" | "breakdown">
  >;
} | null> {
  const cap = Math.max(1, Math.min(limit, 300));
  const rows = await restGet(
    `scores?segmento=eq.${encodeURIComponent(segmento)}&score_total=not.is.null&select=h3_index,segmento,score_estrutural,score_macroeconomico,score_comportamental,score_total&order=score_total.desc&limit=${cap}`,
  );
  if (!rows?.length) return null;
  return {
    status: "sucesso",
    segmento,
    recomendacoes: rows.map((row) => {
      const ok = toOk(row);
      return {
        h3_index: ok.h3_index,
        lat: ok.lat,
        lng: ok.lng,
        score_total: ok.score_total,
        breakdown: ok.breakdown,
      };
    }),
  };
}

export async function restProbe(): Promise<"up" | "down" | "unset"> {
  if (!restConfig()) return "unset";
  const rows = await restGet("scores?select=h3_index&limit=1");
  if (rows == null) return "down";
  return rows.length > 0 ? "up" : "down";
}
