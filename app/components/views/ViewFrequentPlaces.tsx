"use client";

import { useEffect, useMemo, useState } from "react";
import { NEIGHBORHOODS } from "../../data/neighborhoods";
import {
  buildAddressSuggestions,
  type AddressSuggestion,
} from "../../data/streets";
import type { FrequentPlace, LatLng, RouteLeg } from "../../services/routing";
import {
  buildFrequentRoutes,
  formatDuration,
  geocodeInSalvador,
} from "../../services/routing";

type Props = {
  origin: LatLng | null;
  originLabel: string | null;
  places: FrequentPlace[];
  setPlaces: (places: FrequentPlace[]) => void;
  routes: RouteLeg[];
  setRoutes: (routes: RouteLeg[]) => void;
  onSetOrigin: (point: LatLng, label: string) => void;
  onRequestOriginHint?: () => void;
};

const SUGGESTIONS = [
  "Shopping da Bahia",
  "Aeroporto",
  "Pelourinho",
  "Pituba",
  "Barra",
  "Itaigara",
  "UFBA Ondina",
  "Hospital São Rafael",
];

export default function ViewFrequentPlaces({
  origin,
  originLabel,
  places,
  setPlaces,
  routes,
  setRoutes,
  onSetOrigin,
  onRequestOriginHint,
}: Props) {
  const [draft, setDraft] = useState("");
  const [originDraft, setOriginDraft] = useState(originLabel ?? "");
  const [originOpen, setOriginOpen] = useState(false);
  const [originBusy, setOriginBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (originLabel) setOriginDraft(originLabel);
  }, [originLabel]);

  const originSuggestions = useMemo(
    () => buildAddressSuggestions(originDraft, 8),
    [originDraft],
  );

  const applyOriginFromSuggestion = (s: AddressSuggestion) => {
    const n = NEIGHBORHOODS.find((x) => x.id === s.neighborhoodId);
    if (!n) {
      setError("Local ainda não cadastrado no banco.");
      return;
    }
    const label =
      s.kind === "rua" && s.street
        ? `${s.street}, ${s.neighborhoodName}`
        : s.neighborhoodName;
    onSetOrigin({ lat: n.lat, lng: n.lng }, label);
    setOriginDraft(label);
    setOriginOpen(false);
    setError("");
    setRoutes([]);
  };

  const applyOriginFromText = async () => {
    setError("");
    const q = originDraft.trim();
    if (!q) {
      setError("Digite a origem ou clique no mapa.");
      return;
    }
    if (originSuggestions[0]) {
      applyOriginFromSuggestion(originSuggestions[0]);
      return;
    }
    setOriginBusy(true);
    try {
      const geo = await geocodeInSalvador(q);
      if (!geo) {
        setError("Origem não encontrada. Tente outro nome ou clique no mapa.");
        return;
      }
      onSetOrigin({ lat: geo.lat, lng: geo.lng }, geo.name || q);
      setOriginDraft(geo.name || q);
      setOriginOpen(false);
      setRoutes([]);
    } finally {
      setOriginBusy(false);
    }
  };

  const addPlace = async (raw?: string) => {
    setError("");
    const label = (raw ?? draft).trim();
    if (!label) {
      setError("Digite um lugar que você frequenta.");
      return;
    }
    if (places.length >= 6) {
      setError("Adicione no máximo 6 lugares.");
      return;
    }
    if (places.some((p) => p.label.toLowerCase() === label.toLowerCase())) {
      setError("Esse lugar já está na lista.");
      return;
    }

    const geo = await geocodeInSalvador(label);
    const place: FrequentPlace = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      label: geo?.name || label,
      lat: geo?.lat,
      lng: geo?.lng,
    };
    setPlaces([...places, place]);
    setDraft("");
    setRoutes([]);
  };

  const removePlace = (id: string) => {
    setPlaces(places.filter((p) => p.id !== id));
    setRoutes([]);
  };

  const calculate = async () => {
    setError("");
    if (!origin) {
      setError("Defina a origem digitando o endereço ou clicando no mapa.");
      onRequestOriginHint?.();
      return;
    }
    if (places.length === 0) {
      setError("Adicione pelo menos um lugar que você frequenta.");
      return;
    }
    setLoading(true);
    try {
      const legs = await buildFrequentRoutes(origin, places);
      if (!legs.length) {
        setError(
          "Não foi possível calcular rotas. Tente outros nomes de lugares.",
        );
      }
      setRoutes(legs);
    } catch {
      setError("Falha ao calcular rotas. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in space-y-4 p-4">
      <div>
        <h2 className="text-xl font-bold text-[#2a2a33]">
          Tempo de deslocamento
        </h2>
        <p className="mt-1 text-sm text-[#6a6a72]">
          Digite a origem e os destinos do dia a dia. Também pode marcar a
          origem clicando no mapa — veja o caminho e o tempo aproximado.
        </p>
      </div>

      <div className="rounded-xl border border-[#d1d1d5] bg-[#e8f1ff]/50 p-3">
        <label
          htmlFor="route-origin"
          className="block text-xs font-bold uppercase tracking-wide text-[#6a6a72]"
        >
          Origem no mapa
        </label>
        <div className="relative mt-1.5">
          <div className="flex gap-2">
            <input
              id="route-origin"
              value={originDraft}
              onChange={(e) => {
                setOriginDraft(e.target.value);
                setOriginOpen(true);
                setError("");
              }}
              onFocus={() => setOriginOpen(true)}
              onBlur={() => {
                window.setTimeout(() => setOriginOpen(false), 150);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void applyOriginFromText();
                }
              }}
              placeholder="Ex.: Pituba, Av. Oceânica, Imbuí..."
              autoComplete="off"
              disabled={originBusy}
              className="min-w-0 flex-1 rounded-lg border border-[#c3c3c8] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#006aff] focus:ring-2 focus:ring-[#006aff]/20 disabled:opacity-60"
            />
            <button
              type="button"
              onClick={() => void applyOriginFromText()}
              disabled={originBusy}
              className="shrink-0 rounded-full bg-[#006aff] px-4 py-2 text-sm font-bold text-white hover:bg-[#0058d6] disabled:opacity-60"
            >
              {originBusy ? "..." : "Definir"}
            </button>
          </div>

          {originOpen && originDraft.trim().length >= 2 && (
            <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-[#d1d1d5] bg-white py-1 shadow-lg">
              {originSuggestions.length === 0 ? (
                <li className="px-3 py-2.5 text-xs text-[#6a6a72]">
                  Sem resultado no banco. Pressione Definir para buscar, ou
                  clique no mapa.
                </li>
              ) : (
                originSuggestions.map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => applyOriginFromSuggestion(s)}
                      className="flex w-full flex-col px-3 py-2 text-left hover:bg-[#e8f1ff]"
                    >
                      <span className="text-sm font-semibold text-[#2a2a33]">
                        {s.kind === "rua" ? s.street : s.neighborhoodName}
                      </span>
                      <span className="text-[11px] text-[#6a6a72]">
                        {s.kind === "rua"
                          ? `Endereço · ${s.neighborhoodName}`
                          : "Bairro · banco ConverGeo"}
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
        {origin ? (
          <p className="mt-2 text-xs font-semibold text-[#006aff]">
            Atual: {originLabel || "Ponto selecionado"} ·{" "}
            {origin.lat.toFixed(4)}, {origin.lng.toFixed(4)}
          </p>
        ) : (
          <p className="mt-2 text-xs text-[#6a6a72]">
            Ou clique em qualquer ponto do mapa para definir a origem.
          </p>
        )}
      </div>

      <div className="rounded-xl border border-[#d1d1d5] bg-white p-3">
        <label
          htmlFor="frequent-place"
          className="block text-xs font-bold uppercase tracking-wide text-[#6a6a72]"
        >
          Digite os lugares que você mais frequenta
        </label>
        <div className="mt-1.5 flex gap-2">
          <input
            id="frequent-place"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void addPlace();
              }
            }}
            placeholder="Ex.: Shopping da Bahia, trabalho, praia..."
            className="min-w-0 flex-1 rounded-lg border border-[#c3c3c8] px-3 py-2.5 text-sm outline-none focus:border-[#006aff] focus:ring-2 focus:ring-[#006aff]/20"
          />
          <button
            type="button"
            onClick={() => void addPlace()}
            className="shrink-0 rounded-full bg-[#006aff] px-4 py-2 text-sm font-bold text-white hover:bg-[#0058d6]"
          >
            Adicionar
          </button>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => void addPlace(s)}
              className="rounded-full border border-[#c3c3c8] px-2.5 py-1 text-[11px] font-semibold text-[#2a2a33] hover:border-[#006aff] hover:bg-[#e8f1ff]"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {places.length > 0 && (
        <ul className="space-y-2">
          {places.map((p, i) => (
            <li
              key={p.id}
              className="flex items-center justify-between rounded-xl border border-[#d1d1d5] bg-white px-3 py-2.5"
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{
                    backgroundColor: [
                      "#006aff",
                      "#ea580c",
                      "#059669",
                      "#9333ea",
                      "#dc2626",
                      "#0891b2",
                    ][i % 6],
                  }}
                />
                <span className="text-sm font-semibold text-[#2a2a33]">
                  {p.label}
                </span>
              </div>
              <button
                type="button"
                onClick={() => removePlace(p.id)}
                className="text-xs font-bold text-[#6a6a72] hover:text-rose-600"
              >
                Remover
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}

      <button
        type="button"
        onClick={() => void calculate()}
        disabled={loading}
        className="w-full rounded-full bg-[#006aff] py-3.5 text-sm font-bold text-white hover:bg-[#0058d6] disabled:opacity-60"
      >
        {loading ? "Calculando caminhos..." : "Calcular caminhos e tempos"}
      </button>

      {routes.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wide text-[#6a6a72]">
            Tempos aproximados de chegada
          </p>
          {routes.map((r) => (
            <div
              key={r.placeId}
              className="rounded-xl border border-[#d1d1d5] bg-white p-3 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className="mt-0.5 h-3 w-3 shrink-0 rounded-full"
                    style={{
                      backgroundColor: `rgb(${r.color.join(",")})`,
                    }}
                  />
                  <div>
                    <p className="text-sm font-bold text-[#2a2a33]">{r.label}</p>
                    <p className="text-xs text-[#6a6a72]">
                      {r.distanceKm} km · de carro (aprox.)
                    </p>
                  </div>
                </div>
                <p className="text-lg font-black tabular-nums text-[#006aff]">
                  {formatDuration(r.durationMin)}
                </p>
              </div>
            </div>
          ))}
          <p className="text-[11px] leading-snug text-[#6a6a72]">
            Tempos estimados em condições médias de trânsito. Os caminhos
            aparecem coloridos no mapa.
          </p>
        </div>
      )}
    </div>
  );
}
