"use client";

import type { RegionDetail } from "../../types/region";
import {
  bandLabel,
  formatPct,
  scoreCss,
} from "../../utils/opportunity";
import OpportunityScore from "./OpportunityScore";
import MetricCard from "./MetricCard";
import ScoreBreakdownBars from "./ScoreBreakdownBars";
import PriceChart from "./PriceChart";
import DevelopmentChart from "./DevelopmentChart";
import BudgetSimulator from "./BudgetSimulator";

type Props = {
  region: RegionDetail;
  onBack?: () => void;
  onSelectRegion?: (id: string) => void;
};

function formatBRL(n: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(n);
}

export default function RegionAnalysis({
  region,
  onBack,
  onSelectRegion,
}: Props) {
  const ind = region.indicators;
  const vs = ind.precoVsMediaSalvador;

  return (
    <div className="mt-3 space-y-3 animate-fade-in">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="text-xs font-semibold text-blue-600 hover:underline"
        >
          ← Voltar ao ranking
        </button>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">
              {region.name}
            </h2>
            <p
              className="mt-0.5 text-xs font-bold"
              style={{ color: scoreCss(region.score) }}
            >
              {bandLabel(region.band)}
            </p>
          </div>
          <OpportunityScore
            score={region.score}
            band={region.band}
            size="lg"
            showLabel={false}
          />
        </div>
        <p className="mt-2 text-xs leading-relaxed text-slate-600">
          {region.summary}
        </p>
      </div>

      <ScoreBreakdownBars breakdown={region.breakdown} />

      <div>
        <h3 className="mb-1.5 text-xs font-bold text-slate-800">
          Indicadores da região
        </h3>
        <div className="grid grid-cols-2 gap-1.5">
          <MetricCard
            label="Preço médio/m²"
            value={formatBRL(ind.precoM2)}
            hint={`${vs >= 0 ? "↑" : "↓"} ${Math.abs(vs).toFixed(1)}% vs média Salvador`}
            tone={vs < 0 ? "up" : "down"}
          />
          <MetricCard
            label="Valorização"
            value={formatPct(ind.valorizacao12m)}
            hint="últimos 12 meses"
            tone="up"
          />
          <MetricCard
            label="Novos empreendimentos"
            value={String(ind.novosEmpreendimentos)}
            hint="lançamentos identificados"
          />
          <MetricCard label="Oferta de imóveis" value={ind.oferta} />
          <MetricCard
            label="Crescimento empresarial"
            value={formatPct(ind.crescimentoEmpresarial)}
            tone="up"
          />
          <MetricCard
            label="Crescimento populacional"
            value={formatPct(ind.crescimentoPopulacional)}
            tone="up"
          />
        </div>
      </div>

      <PriceChart data={region.priceHistory} regionName={region.name} />
      <DevelopmentChart data={region.developmentHistory} />

      <BudgetSimulator
        regionId={region.id}
        regionName={region.name}
        initialBudget={500000}
        onSelectRegion={onSelectRegion}
      />
    </div>
  );
}
