import { clientScoreAt, clientTop, type ClientHex } from "./clientHexFallback";

type LatLng = { lat: number; lng: number };

export type NegocioHex = {
  h3_index: string;
  lat: number;
  lng: number;
  segmento?: string;
  score_total?: number;
  breakdown?: {
    estrutural?: number;
    macroeconomico?: number;
    comportamental?: number;
  };
  demo?: boolean;
};

function apiBase(): string {
  return "/api/negocio";
}

async function jsonGet(url: string): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Record<string, unknown>;
    if (!data || typeof data !== "object" || "detail" in data) return null;
    return data;
  } catch {
    return null;
  }
}

function asHexList(data: Record<string, unknown> | null): NegocioHex[] {
  if (!data || data.status !== "sucesso") return [];
  const recs = data.recomendacoes;
  if (!Array.isArray(recs)) {
    if (typeof data.h3_index === "string") {
      return [data as unknown as NegocioHex];
    }
    return [];
  }
  return recs.filter(
    (row): row is NegocioHex =>
      Boolean(row) &&
      typeof row === "object" &&
      typeof (row as NegocioHex).h3_index === "string",
  );
}

function fromClient(rows: ClientHex[]): NegocioHex[] {
  return rows;
}

/** Pins sintéticos de concorrência a partir do score macro. */
export function competitorPinsFromHex(hex: {
  lat: number;
  lng: number;
  breakdown?: { macroeconomico?: number };
}): { lat: number; lng: number }[] {
  const macro = hex.breakdown?.macroeconomico || 0;
  const n = Math.max(0, Math.floor((10 - macro) * 2.5));
  const pins = [];
  for (let i = 0; i < n; i++) {
    const radius = 0.005 * Math.sqrt(Math.random());
    const theta = Math.random() * 2 * Math.PI;
    pins.push({
      lat: hex.lat + radius * Math.cos(theta),
      lng: hex.lng + radius * Math.sin(theta),
    });
  }
  return pins;
}

export async function fetchNegocioHex(opts: {
  viewMode: "single" | "top" | "compare" | "heatmap";
  segment: string;
  lastCoordinate: LatLng | null;
  compareLocations: LatLng[];
}): Promise<{ hexData: NegocioHex[]; competitorPins: { lat: number; lng: number }[] }> {
  const base = apiBase();
  const { viewMode, segment, lastCoordinate, compareLocations } = opts;

  if (viewMode === "heatmap" || viewMode === "top") {
    const limit = viewMode === "heatmap" ? 180 : 5;
    const data = await jsonGet(
      `${base}/top?segmento=${encodeURIComponent(segment)}&limit=${limit}`,
    );
    const hexData = asHexList(data);
    if (hexData.length) return { hexData, competitorPins: [] };
    return { hexData: fromClient(clientTop(segment, limit)), competitorPins: [] };
  }

  if (viewMode === "single" && lastCoordinate) {
    const data = await jsonGet(
      `${base}/score?lat=${lastCoordinate.lat}&lng=${lastCoordinate.lng}&segmento=${encodeURIComponent(segment)}`,
    );
    let hexData = asHexList(data);
    if (!hexData.length) {
      const local = clientScoreAt(
        lastCoordinate.lat,
        lastCoordinate.lng,
        segment,
      );
      hexData = local ? [local] : [];
    }
    return {
      hexData,
      competitorPins: hexData[0] ? competitorPinsFromHex(hexData[0]) : [],
    };
  }

  if (viewMode === "compare" && compareLocations.length === 2) {
    const results = await Promise.all(
      compareLocations.map(async (loc) => {
        const data = await jsonGet(
          `${base}/score?lat=${loc.lat}&lng=${loc.lng}&segmento=${encodeURIComponent(segment)}`,
        );
        const list = asHexList(data);
        if (list[0]) return list[0];
        return clientScoreAt(loc.lat, loc.lng, segment);
      }),
    );
    return {
      hexData: results.filter((d): d is NegocioHex => Boolean(d)),
      competitorPins: [],
    };
  }

  return { hexData: [], competitorPins: [] };
}
