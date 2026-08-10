"use client";

import { useEffect, useState } from "react";
import AddressSuggest from "./AddressSuggest";
import { NEIGHBORHOODS, type Neighborhood } from "../data/neighborhoods";
import type { AddressSuggestion } from "../data/streets";
import {
  RESIDENTIAL_PROPERTY_TYPES,
  formatBRL,
  type ImovelTool,
  type PropertyType,
} from "../utils/realEstate";
import type { ImovelListingFilters } from "../data/imovelFilters";
import ImovelListingFiltersPanel from "./ImovelListingFilters";

type Props = {
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  onSearch: (e: React.FormEvent) => void;
  onPickAddress: (suggestion: AddressSuggestion) => void;
  isSearching: boolean;
  searchError: string;
  tool: ImovelTool;
  setTool: (t: ImovelTool) => void;
  budget: number;
  setBudget: (v: number) => void;
  propertyType: PropertyType;
  setPropertyType: (v: PropertyType) => void;
  listingFilters: ImovelListingFilters;
  setListingFilters: (v: ImovelListingFilters) => void;
  compareList: Neighborhood[];
  onToggleCompare: (n: Neighborhood) => void;
};

function parseBudgetInput(raw: string): number | null {
  const cleaned = raw.replace(/[^\d]/g, "");
  if (!cleaned) return null;
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : null;
}

export default function ImovelPanel({
  searchQuery,
  setSearchQuery,
  onSearch,
  onPickAddress,
  isSearching,
  searchError,
  tool,
  setTool,
  budget,
  setBudget,
  propertyType,
  setPropertyType,
  listingFilters,
  setListingFilters,
  compareList,
  onToggleCompare,
}: Props) {
  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetDraft, setBudgetDraft] = useState(String(budget));

  useEffect(() => {
    if (!editingBudget) setBudgetDraft(String(budget));
  }, [budget, editingBudget]);

  const sliderMin = 80000;
  const sliderMax = Math.max(5000000, budget);

  const commitBudget = () => {
    const parsed = parseBudgetInput(budgetDraft);
    if (parsed !== null && parsed > 0) setBudget(parsed);
    else setBudgetDraft(String(budget));
    setEditingBudget(false);
  };

  return (
    <div className="flex flex-col space-y-3 print:hidden">
      {tool !== "orcamento" && (
        <form onSubmit={onSearch} className="space-y-1">
          <label
            htmlFor="endereco-imovel"
            className="block text-xs font-semibold text-slate-600"
          >
            Endereço
          </label>
          <div className="flex gap-1.5">
            <AddressSuggest
              inputId="endereco-imovel"
              value={searchQuery}
              onChange={setSearchQuery}
              onPick={onPickAddress}
              isSearching={isSearching}
            />
            <button
              type="submit"
              disabled={isSearching}
              className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {isSearching ? "..." : "OK"}
            </button>
          </div>
        </form>
      )}
      {searchError && (
        <p className="text-xs font-semibold text-rose-600">{searchError}</p>
      )}

      <label className="block text-xs font-semibold text-slate-600">
        O que deseja fazer?
        <select
          value={tool}
          onChange={(e) => setTool(e.target.value as ImovelTool)}
          className="mt-1 w-full rounded-full border border-[var(--zg-line)] bg-white px-3 py-2.5 text-sm font-semibold text-[var(--zg-ink)] outline-none focus:border-[var(--zg-blue)] focus:ring-2 focus:ring-[var(--zg-blue)]/20"
        >
          <option value="orcamento">Analisar pelo meu orçamento</option>
          <option value="explorar">Ranking e mapa de oportunidade</option>
          <option value="comparar">Comparação entre bairros</option>
        </select>
      </label>

      {tool !== "orcamento" && (
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <label className="block text-xs font-semibold text-slate-600">
            Tipo de imóvel
            <select
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value as PropertyType)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-900 outline-none focus:border-blue-500"
            >
              <optgroup label="Residencial">
                {RESIDENTIAL_PROPERTY_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </optgroup>
            </select>
          </label>

          <div className="mt-3 flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-slate-600">Seu orçamento</p>
            <button
              type="button"
              onClick={() => {
                setBudgetDraft(String(budget));
                setEditingBudget(true);
              }}
              className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              aria-label="Editar orçamento"
              title="Editar orçamento"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-3.5 w-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
              </svg>
              Editar
            </button>
          </div>

          {editingBudget ? (
            <div className="mt-1.5 flex gap-1.5">
              <input
                type="text"
                inputMode="numeric"
                value={budgetDraft}
                onChange={(e) => setBudgetDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    commitBudget();
                  }
                  if (e.key === "Escape") {
                    setEditingBudget(false);
                    setBudgetDraft(String(budget));
                  }
                }}
                className="min-w-0 flex-1 rounded-lg border border-blue-400 px-2.5 py-1.5 text-base font-bold text-slate-900 outline-none"
                aria-label="Valor do orçamento"
                autoFocus
              />
              <button
                type="button"
                onClick={commitBudget}
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-500"
              >
                Salvar
              </button>
            </div>
          ) : (
            <p className="mt-0.5 text-xl font-bold text-slate-900">
              {formatBRL(budget)}
            </p>
          )}

          <input
            type="range"
            min={sliderMin}
            max={sliderMax}
            step={10000}
            value={Math.min(Math.max(budget, sliderMin), sliderMax)}
            onChange={(e) => setBudget(Number(e.target.value))}
            className="mt-2 w-full accent-blue-600"
            aria-label="Ajustar orçamento"
          />
          <p className="mt-1.5 text-[11px] text-slate-500">
            Digite o valor com o lápis (sem limite máximo).
          </p>
        </div>
      )}

      {tool !== "orcamento" && (
        <ImovelListingFiltersPanel
          filters={listingFilters}
          onChange={setListingFilters}
        />
      )}

      {tool === "comparar" && (
        <details open className="rounded-xl border border-slate-200 bg-white p-2.5">
          <summary className="cursor-pointer text-sm font-semibold text-slate-800">
            Escolher bairros (até 3)
          </summary>
          <div className="mt-2 max-h-40 space-y-0.5 overflow-y-auto">
            {NEIGHBORHOODS.map((n) => {
              const active = compareList.some((c) => c.id === n.id);
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => onToggleCompare(n)}
                  className={`flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-sm font-medium ${
                    active
                      ? "bg-blue-600 text-white"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span>{n.name}</span>
                  <span className={active ? "text-blue-100" : "text-slate-400"}>
                    {formatBRL(n.precoM2)}/m²
                  </span>
                </button>
              );
            })}
          </div>
        </details>
      )}
    </div>
  );
}
