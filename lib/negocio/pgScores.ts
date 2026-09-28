/**
 * Lê convergeo.scores no Postgres (Supabase) a partir da Vercel.
 * DATABASE_URL com sslmode=require. Senha com @ / ! tem de ir percent-encoded.
 */
import { cellToLatLng, latLngToCell } from "h3-js";
import { Pool, type QueryResultRow } from "pg";
import { H3_RES, type ScoreEmpty, type ScoreOk } from "./demoScores";

const H3 = H3_RES;

function databaseUrl(): string {
  return (process.env.DATABASE_URL || "").trim();
}

/** sslmode=require no URI vira verify-full no pg 8 e quebra o chain do pooler. */
export function poolOptions(url: string): {
  connectionString: string;
  ssl: { rejectUnauthorized: false } | undefined;
} {
  const parsed = new URL(url);
  const supabase = /supabase\.(com|co)/i.test(parsed.hostname);
  if (supabase) {
    parsed.searchParams.delete("sslmode");
    parsed.searchParams.delete("uselibpqcompat");
  }
  return {
    connectionString: parsed.toString(),
    ssl: supabase ? { rejectUnauthorized: false } : undefined,
  };
}

let pool: Pool | null = null;

function getPool(): Pool | null {
  const url = databaseUrl();
  if (!url) return null;
  if (!pool) {
    const opts = poolOptions(url);
    pool = new Pool({
      connectionString: opts.connectionString,
      max: 4,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 8_000,
      ssl: opts.ssl,
    });
  }
  return pool;
}

export function hasDatabaseUrl(): boolean {
  return Boolean(databaseUrl());
}

export async function closePgPool(): Promise<void> {
  if (!pool) return;
  const current = pool;
  pool = null;
  await current.end();
}

type ScoreRow = QueryResultRow & {
  h3_index: string;
  segmento: string;
  score_estrutural: number | null;
  score_macroeconomico: number | null;
  score_comportamental: number | null;
  score_total: number | null;
};

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

export async function pgScoreAt(
  lat: number,
  lng: number,
  segmento: string,
): Promise<ScoreOk | ScoreEmpty | null> {
  const client = getPool();
  if (!client) return null;
  const h3_index = latLngToCell(lat, lng, H3);
  try {
    const res = await client.query<ScoreRow>(
      `SELECT h3_index, segmento, score_estrutural, score_macroeconomico,
              score_comportamental, score_total
       FROM convergeo.scores
       WHERE h3_index = $1 AND segmento = $2`,
      [h3_index, segmento],
    );
    const row = res.rows[0];
    if (!row || row.score_total == null) {
      return {
        status: "sem_dados",
        h3_index,
        mensagem: "Região sem dados suficientes ou fora da área de cobertura.",
      };
    }
    return toOk(row);
  } catch {
    return null;
  }
}

export async function pgTop(
  segmento: string,
  limit: number,
): Promise<{
  status: "sucesso";
  segmento: string;
  recomendacoes: Array<
    Pick<ScoreOk, "h3_index" | "lat" | "lng" | "score_total" | "breakdown">
  >;
} | null> {
  const client = getPool();
  if (!client) return null;
  const cap = Math.max(1, Math.min(limit, 300));
  try {
    const res = await client.query<ScoreRow>(
      `SELECT h3_index, segmento, score_estrutural, score_macroeconomico,
              score_comportamental, score_total
       FROM convergeo.scores
       WHERE segmento = $1 AND score_total IS NOT NULL
       ORDER BY score_total DESC
       LIMIT $2`,
      [segmento, cap],
    );
    if (!res.rows.length) return null;
    return {
      status: "sucesso",
      segmento,
      recomendacoes: res.rows.map((row) => {
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
  } catch {
    return null;
  }
}

export async function pgProbe(): Promise<"up" | "down" | "unset"> {
  if (!databaseUrl()) return "unset";
  const client = getPool();
  if (!client) return "unset";
  try {
    const res = await client.query<{ n: string }>(
      "SELECT COUNT(*)::text AS n FROM convergeo.scores",
    );
    return Number(res.rows[0]?.n || 0) > 0 ? "up" : "down";
  } catch {
    return "down";
  }
}
