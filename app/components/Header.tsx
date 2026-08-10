"use client";

import { useState } from "react";
import type { AppMode } from "../utils/realEstate";

interface HeaderProps {
  reportMeta: { id: string; date: string };
  appMode: AppMode;
  setAppMode: (mode: AppMode) => void;
}

export default function Header({
  reportMeta,
  appMode,
  setAppMode,
}: HeaderProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="mb-3 border-b border-[var(--zg-line)] pb-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--zg-blue)] text-sm font-black text-white"
            aria-hidden
          >
            C
          </span>
          <div>
            <h1 className="text-xl font-black tracking-tight text-[var(--zg-navy)]">
              Conver<span className="text-[var(--zg-blue)]">Geo</span>
            </h1>
            <p className="text-[11px] font-medium text-[var(--zg-muted)]">
              {appMode === "imovel"
                ? "Comprar em Salvador com dados"
                : "Empreendimento · inteligência"}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowDetails((v) => !v)}
          className="rounded-full border border-[var(--zg-line)] px-3 py-1 text-[11px] font-semibold text-[var(--zg-muted)] hover:bg-[var(--zg-canvas)]"
          aria-expanded={showDetails}
        >
          {showDetails ? "Fechar" : "Ajuda"}
        </button>
      </div>

      {showDetails && (
        <div className="mt-2 rounded-xl border border-[var(--zg-line)] bg-[var(--zg-canvas)] p-2.5 text-[11px] text-[var(--zg-muted)]">
          <p>ID: {reportMeta.id || "------"}</p>
          <p className="mt-0.5">Data: {reportMeta.date || "--/--/----"}</p>
        </div>
      )}

      <div
        className="mt-3 flex rounded-full border border-[var(--zg-line)] bg-[var(--zg-canvas)] p-1"
        role="tablist"
        aria-label="Tipo de busca"
      >
        {(
          [
            { id: "imovel", label: "Comprar" },
            { id: "negocio", label: "Empreender" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={appMode === tab.id}
            onClick={() => setAppMode(tab.id)}
            className={`flex-1 rounded-full py-2 text-xs font-bold transition ${
              appMode === tab.id
                ? "bg-white text-[var(--zg-blue)] shadow-sm"
                : "text-[var(--zg-muted)] hover:text-[var(--zg-ink)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
