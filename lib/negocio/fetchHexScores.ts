type LatLng = { lat: number; lng: number };

function apiBase(): string {
  const raw = (process.env.NEXT_PUBLIC_API_URL || "/backend").replace(/\/$/, "");
  if (/localhost|127\.0\.0\.1|0\.0\.0\.0/i.test(raw)) {
    return "/backend";
  }
  return raw;
}

async function jsonGet(url: string) {
  const res = await fetch(url);
  return res.json();
}

function okList(data: { status?: string; recomendacoes?: unknown[] }) {
  return data.status === "sucesso" ? data.recomendacoes || [] : [];
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
}): Promise<{ hexData: any[]; competitorPins: { lat: number; lng: number }[] }> {
  const base = apiBase();
  const { viewMode, segment, lastCoordinate, compareLocations } = opts;

  if (viewMode === "heatmap") {
    const data = await jsonGet(`${base}/top?segmento=${segment}&limit=300`);
    return { hexData: okList(data), competitorPins: [] };
  }

  if (viewMode === "top") {
    const data = await jsonGet(`${base}/top?segmento=${segment}&limit=5`);
    return { hexData: okList(data), competitorPins: [] };
  }

  if (viewMode === "single" && lastCoordinate) {
    const data = await jsonGet(
      `${base}/score?lat=${lastCoordinate.lat}&lng=${lastCoordinate.lng}&segmento=${segment}`,
    );
    const hexData = data.status === "sucesso" ? [data] : [];
    return {
      hexData,
      competitorPins: hexData[0] ? competitorPinsFromHex(hexData[0]) : [],
    };
  }

  if (viewMode === "compare" && compareLocations.length === 2) {
    const results = await Promise.all(
      compareLocations.map((loc) =>
        jsonGet(
          `${base}/score?lat=${loc.lat}&lng=${loc.lng}&segmento=${segment}`,
        ),
      ),
    );
    return {
      hexData: results.filter((d) => d.status === "sucesso"),
      competitorPins: [],
    };
  }

  return { hexData: [], competitorPins: [] };
}
