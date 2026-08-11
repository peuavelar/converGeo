"use client";

import React from "react";
import { MAP_STYLES } from "../utils/constants";

interface MapControlsProps {
  currentStyle: keyof typeof MAP_STYLES;
  setCurrentStyle: (style: keyof typeof MAP_STYLES) => void;
  colorMode: "total" | "ocean";
  setColorMode: (mode: "total" | "ocean") => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onTempoDeslocamento?: () => void;
  tempoDeslocamentoActive?: boolean;
}

export default function MapControls({
  currentStyle,
  setCurrentStyle,
  colorMode,
  setColorMode,
  onZoomIn,
  onZoomOut,
  onTempoDeslocamento,
  tempoDeslocamentoActive,
}: MapControlsProps) {
  const isDark = currentStyle === "dark";

  return (
    <div className="flex flex-col items-end gap-1.5 print:hidden">
      <div className="flex items-end gap-1.5">
        {onTempoDeslocamento && (
          <button
            type="button"
            onClick={onTempoDeslocamento}
            className={`rounded-xl border px-2 py-1.5 text-left text-[10px] font-bold shadow-md transition ${
              tempoDeslocamentoActive
                ? "border-[#006aff] bg-[#006aff] text-white"
                : "border-[#d1d1d5] bg-white text-[#2a2a33] hover:border-[#006aff] hover:bg-[#e8f1ff] hover:text-[#006aff]"
            }`}
            title="Tempo de deslocamento"
          >
            Tempo
          </button>
        )}

        <div className="flex flex-col overflow-hidden rounded-xl border border-[#d1d1d5] bg-white shadow-md">
          <button
            type="button"
            onClick={onZoomIn}
            className="flex h-8 w-8 items-center justify-center border-b border-[#e8e8ed] text-base font-bold text-[#2a2a33] hover:bg-[#e8f1ff] hover:text-[#006aff]"
            aria-label="Aumentar zoom"
            title="Zoom +"
          >
            +
          </button>
          <button
            type="button"
            onClick={onZoomOut}
            className="flex h-8 w-8 items-center justify-center text-base font-bold text-[#2a2a33] hover:bg-[#e8f1ff] hover:text-[#006aff]"
            aria-label="Diminuir zoom"
            title="Zoom −"
          >
            −
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setCurrentStyle(isDark ? "positron" : "dark")}
        className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[10px] font-bold shadow-md transition sm:px-3 sm:text-[11px] ${
          isDark
            ? "border-[#1a2a44] bg-[#0a1220] text-white"
            : "border-[#d1d1d5] bg-white text-[#2a2a33] hover:border-[#006aff]"
        }`}
        title={isDark ? "Ativar modo claro" : "Ativar modo noturno"}
        aria-label={isDark ? "Modo claro" : "Modo noturno"}
      >
        {isDark ? (
          <>
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" strokeLinecap="round" />
            </svg>
            Modo claro
          </>
        ) : (
          <>
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
              <path d="M21 14.5A8.5 8.5 0 0 1 9.5 3 7 7 0 1 0 21 14.5Z" />
            </svg>
            Modo noturno
          </>
        )}
      </button>

      <button
        type="button"
        onClick={() => setColorMode(colorMode === "total" ? "ocean" : "total")}
        className={`rounded-full border px-2.5 py-1 text-[10px] font-bold shadow-md sm:px-3 sm:py-1.5 sm:text-[11px] ${
          colorMode === "ocean"
            ? "border-[#006aff] bg-[#e8f1ff] text-[#006aff]"
            : "border-[#d1d1d5] bg-white text-[#6a6a72]"
        }`}
      >
        {colorMode === "ocean" ? "Camada oceano" : "Camada padrão"}
      </button>
    </div>
  );
}
