"use client";

import { useMemo, useState } from "react";
import { METRIC_LABELS, NEIGHBORHOODS, type Neighborhood } from "../../data/neighborhoods";
import { neighborhoodPhoto } from "../../data/neighborhoodPhotos";
import {
  buildAddressSuggestions,
  type AddressSuggestion,
} from "../../data/streets";
import { getRegionByIdSync } from "../../services/regionsApi";
import {
  formatBRL,
  livabilityScore,
  priceIndexForBudget,
  referencePrice,
  type PropertyType,
} from "../../utils/realEstate";

type Props = {
  selected: Neighborhood[];
  budget: number;
  propertyType: PropertyType;
  onAdd: (n: Neighborhood) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
};

export default function ViewBairroCompare({
  selected,
  budget,
  propertyType,
  onAdd,
  onRemove,
  onClear,
}: Props) {
  const [typed, setTyped] = useState("");
  const [error, setError] = useState("");
  const [listOpen, setListOpen] = useState(false);

  const selectedIds = useMemo(
    () => new Set(selected.map((s) => s.id)),
    [selected],
  );

  /** Busca no banco local (bairros + ruas) — depois troca pela API. */
  const suggestions = useMemo(() => {
    return buildAddressSuggestions(typed, 10).filter(
      (s) => !selectedIds.has(s.neighborhoodId),
    );
  }, [typed, selectedIds]);

  const resolveNeighborhood = (s: AddressSuggestion): Neighborhood | null => {
    return NEIGHBORHOODS.find((n) => n.id === s.neighborhoodId) ?? null;
  };

  const addSuggestion = (s: AddressSuggestion) => {
    setError("");
    if (selected.length >= 3) {
      setError("Você pode comparar no máximo 3 bairros.");
      return;
    }
    const match = resolveNeighborhood(s);
    if (!match) {
      setError("Local ainda não cadastrado no banco.");
      return;
    }
    onAdd(match);
    setTyped("");
    setListOpen(false);
  };

  const addByName = () => {
    setError("");
    const q = typed.trim();
    if (!q) {
      setError("Digite o nome de um bairro ou endereço.");
      return;
    }
    if (selected.length >= 3) {
      setError("Você pode comparar no máximo 3 bairros.");
      return;
    }
    const first = suggestions[0];
    if (first) {
      addSuggestion(first);
      return;
    }
    setError("Nenhum resultado no banco. Continue digitando ou tente outro nome.");
  };

  const keys = [
    "consumo",
    "transporte",
    "educacao",
    "seguranca",
    "rouboFurto",
  ] as const;

  const winner =
    selected.length > 0
      ? [...selected].sort(
          (a, b) => livabilityScore(b) - livabilityScore(a),
        )[0]
      : null;

  return (
    <div className="animate-fade-in space-y-4 p-4">
      <div>
        <h2 className="text-xl font-bold text-[#2a2a33]">Comparar bairros</h2>
        <p className="mt-1 text-sm text-[#6a6a72]">
          Digite o bairro ou endereço. Compare até 3 regiões.
        </p>
      </div>

      <div className="rounded-xl border border-[#d1d1d5] bg-white p-3">
        <label
          htmlFor="compare-bairro-input"
          className="block text-xs font-bold uppercase tracking-wide text-[#6a6a72]"
        >
          Digite o nome do bairro ou endereço
        </label>
        <div className="relative mt-1.5">
          <div className="flex gap-2">
            <input
              id="compare-bairro-input"
              value={typed}
              onChange={(e) => {
                setTyped(e.target.value);
                setError("");
                setListOpen(true);
              }}
              onFocus={() => setListOpen(true)}
              onBlur={() => {
                // Delay para permitir clique na sugestão
                window.setTimeout(() => setListOpen(false), 150);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addByName();
                } else if (e.key === "Escape") {
                  setListOpen(false);
                }
              }}
              placeholder="Ex.: Pituba, Av. Paulo VI, Paralela..."
              autoComplete="off"
              className="min-w-0 flex-1 rounded-lg border border-[#c3c3c8] px-3 py-2.5 text-sm outline-none focus:border-[#006aff] focus:ring-2 focus:ring-[#006aff]/20"
            />
            <button
              type="button"
              onClick={addByName}
              disabled={selected.length >= 3}
              className="shrink-0 rounded-full bg-[#006aff] px-4 py-2 text-sm font-bold text-white hover:bg-[#0058d6] disabled:opacity-50"
            >
              Adicionar
            </button>
          </div>

          {listOpen && typed.trim().length >= 2 && (
            <ul className="absolute z-20 mt-1 max-h-52 w-full overflow-y-auto rounded-lg border border-[#d1d1d5] bg-white py-1 shadow-lg">
              {suggestions.length === 0 ? (
                <li className="px-3 py-2.5 text-xs text-[#6a6a72]">
                  Nenhum bairro ou endereço no banco para “{typed.trim()}”.
                </li>
              ) : (
                suggestions.map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => addSuggestion(s)}
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
      </div>

      {error && (
        <p className="text-xs font-semibold text-rose-600">{error}</p>
      )}

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wide text-[#6a6a72]">
            Na comparação ({selected.length}/3)
          </p>
          {selected.length > 0 && (
            <button
              type="button"
              onClick={onClear}
              className="text-xs font-semibold text-[#006aff] hover:underline"
            >
              Limpar tudo
            </button>
          )}
        </div>
        {selected.length === 0 ? (
          <p className="rounded-lg border border-dashed border-[#d1d1d5] bg-[#f5f5f7] px-3 py-4 text-center text-sm text-[#6a6a72]">
            Nenhum bairro adicionado ainda.
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {selected.map((n) => {
              const region = getRegionByIdSync(n.id);
              return (
                <li
                  key={n.id}
                  className="overflow-hidden rounded-xl border border-[#d1d1d5] bg-white shadow-sm"
                >
                  <div className="relative h-32 w-full">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={neighborhoodPhoto(n.id)}
                      alt={`Vista de ${n.name}`}
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => onRemove(n.id)}
                      className="absolute right-2 top-2 rounded-full bg-white/95 px-2 py-1 text-xs font-bold text-[#2a2a33] shadow hover:bg-white"
                      aria-label={`Remover ${n.name}`}
                    >
                      ✕
                    </button>
                    {region && (
                      <span className="absolute bottom-2 left-2 rounded bg-[#006aff] px-2 py-0.5 text-[11px] font-bold text-white">
                        Opp {region.score}
                      </span>
                    )}
                  </div>
                  <div className="p-2.5">
                    <p className="text-sm font-bold text-[#2a2a33]">{n.name}</p>
                    <p className="mt-0.5 text-xs text-[#6a6a72]">
                      {formatBRL(n.precoM2)}/m² · Índice de vida{" "}
                      {livabilityScore(n).toFixed(1)}
                    </p>
                    {region && (
                      <p className="mt-1 text-[11px] font-semibold text-[#1a7f37]">
                        Valorização +{region.valorizacao12m.toFixed(1)}%
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {selected.length >= 2 && winner && (
        <div className="space-y-2">
          <p className="text-sm font-bold text-[#2a2a33]">
            Melhor equilíbrio:{" "}
            <span className="text-[#006aff]">{winner.name}</span>
          </p>
          <div className="overflow-x-auto rounded-xl border border-[#d1d1d5]">
            <table className="w-full min-w-[280px] border-collapse text-left text-xs">
              <thead>
                <tr className="bg-[#f5f5f7]">
                  <th className="px-2 py-2 font-bold text-[#6a6a72]">
                    Indicador
                  </th>
                  {selected.map((n) => (
                    <th
                      key={n.id}
                      className="px-2 py-2 font-bold text-[#2a2a33]"
                    >
                      {n.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-[#e8e8ed]">
                  <td className="px-2 py-2 text-[#6a6a72]">Opportunity</td>
                  {selected.map((n) => {
                    const r = getRegionByIdSync(n.id);
                    return (
                      <td
                        key={n.id}
                        className="px-2 py-2 font-bold text-[#006aff]"
                      >
                        {r?.score ?? "—"}
                      </td>
                    );
                  })}
                </tr>
                <tr className="border-t border-[#e8e8ed]">
                  <td className="px-2 py-2 text-[#6a6a72]">Índice de vida</td>
                  {selected.map((n) => (
                    <td
                      key={n.id}
                      className="px-2 py-2 font-bold text-[#2a2a33]"
                    >
                      {livabilityScore(n).toFixed(1)}
                    </td>
                  ))}
                </tr>
                <tr className="border-t border-[#e8e8ed]">
                  <td className="px-2 py-2 text-[#6a6a72]">Índice de preço</td>
                  {selected.map((n) => (
                    <td
                      key={n.id}
                      className="px-2 py-2 font-semibold text-[#2a2a33]"
                    >
                      {priceIndexForBudget(n, budget, propertyType)}
                    </td>
                  ))}
                </tr>
                <tr className="border-t border-[#e8e8ed]">
                  <td className="px-2 py-2 text-[#6a6a72]">Preço ref.</td>
                  {selected.map((n) => (
                    <td key={n.id} className="px-2 py-2 text-[#2a2a33]">
                      {formatBRL(referencePrice(n, propertyType))}
                    </td>
                  ))}
                </tr>
                {keys.map((key) => (
                  <tr key={key} className="border-t border-[#e8e8ed]">
                    <td className="px-2 py-2 text-[#6a6a72]">
                      {METRIC_LABELS[key]}
                    </td>
                    {selected.map((n) => (
                      <td
                        key={n.id}
                        className="px-2 py-2 font-semibold text-[#2a2a33]"
                      >
                        {n.metrics[key].toFixed(1)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selected.length === 1 && (
        <p className="text-center text-xs text-[#6a6a72]">
          Adicione mais 1 bairro para ver a comparação.
        </p>
      )}
    </div>
  );
}
