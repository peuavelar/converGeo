import {
  demoScoreAt,
  demoTop,
  isDemoSegment,
  type ScoreEmpty,
  type ScoreOk,
} from "./demoScores";

const UPSTREAM_TIMEOUT_MS = 4000;

type UpstreamScore = {
  status?: string;
  h3_index?: string;
  lat?: number;
  lng?: number;
  segmento?: string;
  score_total?: number;
  breakdown?: {
    estrutural?: number;
    macroeconomico?: number;
    comportamental?: number;
  };
  recomendacoes?: unknown[];
  mensagem?: string;
};

function upstreamOrigin(): string {
  const raw = (
    process.env.BACKEND_ORIGIN ||
    process.env.NEXT_PUBLIC_API_URL ||
    "https://convergeo.onrender.com"
  ).replace(/\/$/, "");
  if (!raw.startsWith("http") || /localhost|127\.0\.0\.1|0\.0\.0\.0|::1/i.test(raw)) {
    return "https://convergeo.onrender.com";
  }
  return raw;
}

function sanitizeScore(data: UpstreamScore): ScoreOk | ScoreEmpty | null {
  if (data.status === "sem_dados" && typeof data.h3_index === "string") {
    return {
      status: "sem_dados",
      h3_index: data.h3_index,
      mensagem:
        typeof data.mensagem === "string"
          ? data.mensagem
          : "Região sem dados suficientes ou fora da área de cobertura.",
    } as ScoreEmpty;
  }
  if (data.status !== "sucesso" || !data.h3_index || data.score_total == null) {
    return null;
  }
  const b = data.breakdown || {};
  return {
    status: "sucesso",
    h3_index: data.h3_index,
    lat: Number(data.lat),
    lng: Number(data.lng),
    segmento: String(data.segmento || "food_service"),
    score_total: Number(data.score_total),
    breakdown: {
      estrutural: Number(b.estrutural || 0),
      macroeconomico: Number(b.macroeconomico || 0),
      comportamental: Number(b.comportamental || 0),
    },
  } as ScoreOk;
}

async function fetchUpstream(path: string): Promise<UpstreamScore | null> {
  const url = `${upstreamOrigin()}${path}`;
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as UpstreamScore;
    if (data && typeof data === "object" && !("detail" in data)) return data;
    return null;
  } catch {
    return null;
  }
}

export async function resolveScore(lat: number, lng: number, segmento: string) {
  const seg = isDemoSegment(segmento) ? segmento : "food_service";
  const qs = `?lat=${encodeURIComponent(String(lat))}&lng=${encodeURIComponent(String(lng))}&segmento=${encodeURIComponent(seg)}`;
  const up = await fetchUpstream(`/score${qs}`);
  if (up) {
    const clean = sanitizeScore(up);
    if (clean) return { body: clean, source: "upstream" as const };
  }
  return { body: demoScoreAt(lat, lng, seg), source: "demo" as const };
}

export async function resolveTop(segmento: string, limit: number) {
  const seg = isDemoSegment(segmento) ? segmento : "food_service";
  const qs = `?segmento=${encodeURIComponent(seg)}&limit=${encodeURIComponent(String(limit))}`;
  const up = await fetchUpstream(`/top${qs}`);
  if (up?.status === "sucesso" && Array.isArray(up.recomendacoes)) {
    const recs = up.recomendacoes
      .map((raw) => {
        if (!raw || typeof raw !== "object") return null;
        const r = raw as Record<string, unknown>;
        const breakdown = (r.breakdown || {}) as Record<string, unknown>;
        if (typeof r.h3_index !== "string" || r.score_total == null) return null;
        return {
          h3_index: r.h3_index,
          lat: Number(r.lat),
          lng: Number(r.lng),
          score_total: Number(r.score_total),
          breakdown: {
            estrutural: Number(breakdown.estrutural || 0),
            macroeconomico: Number(breakdown.macroeconomico || 0),
            comportamental: Number(breakdown.comportamental || 0),
          },
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null);
    if (recs.length) {
      return {
        body: { status: "sucesso" as const, segmento: seg, recomendacoes: recs },
        source: "upstream" as const,
      };
    }
  }
  return { body: demoTop(seg, limit), source: "demo" as const };
}

export async function probeUpstream(): Promise<"up" | "down"> {
  const up = await fetchUpstream("/score?lat=-13.0018&lng=-38.4631&segmento=food_service");
  return up?.status === "sucesso" || up?.status === "sem_dados" ? "up" : "down";
}
