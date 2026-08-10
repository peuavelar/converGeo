"use client";

import {
  AMENITY_GROUPS,
  PLUS_OPTIONS,
  STATUS_OPTIONS,
  type ConstructionStatus,
  type ImovelListingFilters,
  type PlusCount,
} from "../data/imovelFilters";

type Props = {
  filters: ImovelListingFilters;
  onChange: (next: ImovelListingFilters) => void;
};

function Chip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md px-2.5 py-1.5 text-xs font-semibold transition ${
        active
          ? "bg-blue-600 text-white"
          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
      }`}
    >
      {label}
    </button>
  );
}

function MoneyInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="block min-w-0 flex-1 text-[11px] font-semibold text-slate-500">
      {label}
      <div className="mt-1 flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2 py-1.5">
        <span className="text-xs text-slate-400">R$</span>
        <input
          type="text"
          inputMode="numeric"
          value={value === 0 ? "" : String(value)}
          placeholder="0"
          onChange={(e) => {
            const n = Number(e.target.value.replace(/[^\d]/g, ""));
            onChange(Number.isFinite(n) ? n : 0);
          }}
          className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none"
        />
      </div>
    </label>
  );
}

function AreaInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="block min-w-0 flex-1 text-[11px] font-semibold text-slate-500">
      {label}
      <div className="mt-1 flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2 py-1.5">
        <input
          type="text"
          inputMode="numeric"
          value={value === 0 ? "" : String(value)}
          placeholder="0"
          onChange={(e) => {
            const n = Number(e.target.value.replace(/[^\d]/g, ""));
            onChange(Number.isFinite(n) ? n : 0);
          }}
          className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none"
        />
        <span className="text-xs text-slate-400">m²</span>
      </div>
    </label>
  );
}

export default function ImovelListingFiltersPanel({
  filters,
  onChange,
}: Props) {
  const patch = (partial: Partial<ImovelListingFilters>) =>
    onChange({ ...filters, ...partial });

  const togglePlus = (key: "quartos" | "banheiros" | "vagas", value: PlusCount) => {
    patch({ [key]: filters[key] === value ? 0 : value });
  };

  const toggleStatus = (value: ConstructionStatus) => {
    const has = filters.status.includes(value);
    patch({
      status: has
        ? filters.status.filter((s) => s !== value)
        : [...filters.status, value],
    });
  };

  const toggleAmenity = (item: string) => {
    const has = filters.amenities.includes(item);
    patch({
      amenities: has
        ? filters.amenities.filter((a) => a !== item)
        : [...filters.amenities, item],
    });
  };

  const activeCount =
    (filters.quartos ? 1 : 0) +
    (filters.banheiros ? 1 : 0) +
    (filters.vagas ? 1 : 0) +
    (filters.precoMin || filters.precoMax ? 1 : 0) +
    (filters.otimoPreco ? 1 : 0) +
    (filters.condominioMin || filters.condominioMax ? 1 : 0) +
    (filters.areaMin || filters.areaMax ? 1 : 0) +
    (filters.proximoMetro ? 1 : 0) +
    filters.status.length +
    filters.amenities.length +
    (filters.codigoImovel.trim() ? 1 : 0);

  return (
    <details className="rounded-xl border border-slate-200 bg-white p-2.5">
      <summary className="cursor-pointer text-sm font-semibold text-slate-800">
        Filtros do imóvel
        {activeCount > 0 ? (
          <span className="ml-1.5 rounded-full bg-blue-100 px-1.5 py-0.5 text-[11px] font-bold text-blue-700">
            {activeCount}
          </span>
        ) : null}
      </summary>

      <div className="mt-3 space-y-3">
        <div>
          <p className="mb-1.5 text-xs font-semibold text-slate-600">Quartos</p>
          <div className="flex flex-wrap gap-1.5">
            {PLUS_OPTIONS.map((o) => (
              <Chip
                key={`q-${o.value}`}
                label={o.label}
                active={filters.quartos === o.value}
                onClick={() => togglePlus("quartos", o.value)}
              />
            ))}
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-xs font-semibold text-slate-600">Banheiros</p>
          <div className="flex flex-wrap gap-1.5">
            {PLUS_OPTIONS.map((o) => (
              <Chip
                key={`b-${o.value}`}
                label={o.label}
                active={filters.banheiros === o.value}
                onClick={() => togglePlus("banheiros", o.value)}
              />
            ))}
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-xs font-semibold text-slate-600">Vagas</p>
          <div className="flex flex-wrap gap-1.5">
            {PLUS_OPTIONS.map((o) => (
              <Chip
                key={`v-${o.value}`}
                label={o.label}
                active={filters.vagas === o.value}
                onClick={() => togglePlus("vagas", o.value)}
              />
            ))}
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-xs font-semibold text-slate-600">Preço</p>
          <div className="flex gap-2">
            <MoneyInput
              label="Mínimo"
              value={filters.precoMin}
              onChange={(precoMin) => patch({ precoMin })}
            />
            <MoneyInput
              label="Máximo"
              value={filters.precoMax}
              onChange={(precoMax) => patch({ precoMax })}
            />
          </div>
          <label className="mt-2 flex items-center gap-2 text-xs font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={filters.otimoPreco}
              onChange={(e) => patch({ otimoPreco: e.target.checked })}
              className="rounded border-slate-300"
            />
            Ótimo preço
          </label>
        </div>

        <div>
          <p className="mb-1.5 text-xs font-semibold text-slate-600">
            Preço do condomínio
          </p>
          <div className="flex gap-2">
            <MoneyInput
              label="Mínimo"
              value={filters.condominioMin}
              onChange={(condominioMin) => patch({ condominioMin })}
            />
            <MoneyInput
              label="Máximo"
              value={filters.condominioMax}
              onChange={(condominioMax) => patch({ condominioMax })}
            />
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-xs font-semibold text-slate-600">
            Área do imóvel
          </p>
          <div className="flex gap-2">
            <AreaInput
              label="Mínimo"
              value={filters.areaMin}
              onChange={(areaMin) => patch({ areaMin })}
            />
            <AreaInput
              label="Máximo"
              value={filters.areaMax}
              onChange={(areaMax) => patch({ areaMax })}
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          <input
            type="checkbox"
            checked={filters.proximoMetro}
            onChange={(e) => patch({ proximoMetro: e.target.checked })}
            className="rounded border-slate-300"
          />
          Próximo ao metrô/trem
        </label>

        <div>
          <p className="mb-1.5 text-xs font-semibold text-slate-600">Situação</p>
          <div className="flex flex-wrap gap-1.5">
            {STATUS_OPTIONS.map((o) => (
              <Chip
                key={o.value}
                label={o.label}
                active={filters.status.includes(o.value)}
                onClick={() => toggleStatus(o.value)}
              />
            ))}
          </div>
        </div>

        <details className="rounded-lg border border-slate-100 bg-slate-50 p-2">
          <summary className="cursor-pointer text-xs font-semibold text-slate-700">
            Características e comodidades
            {filters.amenities.length > 0
              ? ` (${filters.amenities.length})`
              : ""}
          </summary>
          <div className="mt-2 space-y-3">
            {AMENITY_GROUPS.map((group) => (
              <div key={group.title}>
                <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                  {group.title}
                </p>
                <div className="grid grid-cols-1 gap-1">
                  {group.items.map((item) => (
                    <label
                      key={item}
                      className="flex items-center gap-2 text-xs text-slate-700"
                    >
                      <input
                        type="checkbox"
                        checked={filters.amenities.includes(item)}
                        onChange={() => toggleAmenity(item)}
                        className="rounded border-slate-300"
                      />
                      {item}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </details>

        <label className="block text-xs font-semibold text-slate-600">
          Código do imóvel
          <input
            type="text"
            value={filters.codigoImovel}
            onChange={(e) => patch({ codigoImovel: e.target.value })}
            placeholder="Digite o código do imóvel"
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-900 outline-none focus:border-blue-500"
          />
        </label>
      </div>
    </details>
  );
}
