"use client";

import { useMemo, useState } from "react";
import type { Neighborhood } from "../../data/neighborhoods";
import type { ImovelListingFilters } from "../../data/imovelFilters";
import {
  formatBRL,
  livabilityScore,
  neighborhoodsInBudget,
  priceIndexForBudget,
  referencePrice,
  type PropertyType,
} from "../../utils/realEstate";

type Props = {
  budget: number;
  propertyType: PropertyType;
  listingFilters?: ImovelListingFilters;
  onSelect: (n: Neighborhood) => void;
};

export default function ViewBudgetMatch({
  budget,
  propertyType,
  listingFilters,
  onSelect,
}: Props) {
  const effectiveMax =
    listingFilters?.precoMax && listingFilters.precoMax > 0
      ? Math.min(budget, listingFilters.precoMax)
      : budget;
  const precoMin = listingFilters?.precoMin ?? 0;

  const matches = useMemo(() => {
    return neighborhoodsInBudget(effectiveMax, propertyType).filter((n) => {
      const price = referencePrice(n, propertyType);
      if (precoMin > 0 && price < precoMin) return false;
      if (listingFilters?.otimoPreco) {
        const idx = priceIndexForBudget(n, effectiveMax, propertyType);
        if (idx > 85) return false;
      }
      if (listingFilters?.proximoMetro && n.metrics.transporte < 7) return false;
      return true;
    });
  }, [effectiveMax, propertyType, precoMin, listingFilters]);

  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="mt-3 space-y-2 animate-fade-in">
      <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2.5">
        <p className="text-sm font-bold text-slate-900">
          {matches.length} bairros no seu orçamento
        </p>
        <p className="text-xs text-slate-600">{formatBRL(effectiveMax)}</p>
      </div>

      {matches.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3 text-center text-sm text-slate-600">
          Nenhum bairro cabe neste valor. Aumente o orçamento.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {matches.map((n) => {
            const open = openId === n.id;
            return (
              <li
                key={n.id}
                className="rounded-lg border border-slate-200 bg-white"
              >
                <button
                  type="button"
                  onClick={() => onSelect(n)}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left"
                >
                  <span className="text-sm font-semibold text-slate-900">
                    {n.name}
                  </span>
                  <span className="text-sm font-bold text-blue-700">
                    {formatBRL(referencePrice(n, propertyType))}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : n.id)}
                  className="w-full border-t border-slate-100 px-3 py-1.5 text-left text-xs font-semibold text-slate-500 hover:bg-slate-50"
                >
                  {open ? "Ocultar detalhes" : "Ver detalhes"}
                </button>
                {open && (
                  <div className="space-y-0.5 border-t border-slate-100 px-3 py-2 text-xs text-slate-600">
                    <p>
                      Qualidade de vida:{" "}
                      <strong>{livabilityScore(n).toFixed(1)}/10</strong>
                    </p>
                    <p>
                      Índice de preço:{" "}
                      <strong>
                        {priceIndexForBudget(n, budget, propertyType)}
                      </strong>
                    </p>
                    <p>
                      Segurança: <strong>{n.metrics.seguranca.toFixed(1)}</strong>
                    </p>
                    <p>
                      Educação: <strong>{n.metrics.educacao.toFixed(1)}</strong>
                    </p>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
