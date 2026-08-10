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
  const shortName: Record<string, string> = {
    dark: "Escuro",
    positron: "Claro",
    voyager: "Ruas",
  };

  return (
    <div className="flex flex-col items-end gap-2 print:hidden">
      <div className="flex items-end gap-2">
        {onTempoDeslocamento && (
          <button
            type="button"
            onClick={onTempoDeslocamento}
            className={`rounded-xl border px-3 py-2 text-left text-[11px] font-bold shadow-md transition ${
              tempoDeslocamentoActive
                ? "border-[#006aff] bg-[#006aff] text-white"
                : "border-[#d1d1d5] bg-white text-[#2a2a33] hover:border-[#006aff] hover:bg-[#e8f1ff] hover:text-[#006aff]"
            }`}
            title="Tempo de deslocamento"
          >
            <span className="block leading-tight">Tempo de</span>
            <span className="block leading-tight">deslocamento</span>
          </button>
        )}

        <div className="flex flex-col overflow-hidden rounded-xl border border-[#d1d1d5] bg-white shadow-md">
          <button
            type="button"
            onClick={onZoomIn}
            className="flex h-9 w-9 items-center justify-center border-b border-[#e8e8ed] text-lg font-bold text-[#2a2a33] hover:bg-[#e8f1ff] hover:text-[#006aff]"
            aria-label="Aumentar zoom"
            title="Zoom +"
          >
            +
          </button>
          <button
            type="button"
            onClick={onZoomOut}
            className="flex h-9 w-9 items-center justify-center text-lg font-bold text-[#2a2a33] hover:bg-[#e8f1ff] hover:text-[#006aff]"
            aria-label="Diminuir zoom"
            title="Zoom −"
          >
            −
          </button>
        </div>
      </div>

      <div className="flex rounded-full border border-[#d1d1d5] bg-white p-1 shadow-md">
        {Object.entries(MAP_STYLES).map(([key]) => (
          <button
            key={key}
            type="button"
            onClick={() => setCurrentStyle(key as keyof typeof MAP_STYLES)}
            className={`rounded-full px-3 py-1.5 text-[11px] font-bold transition ${
              currentStyle === key
                ? "bg-[#006aff] text-white"
                : "text-[#6a6a72] hover:text-[#2a2a33]"
            }`}
          >
            {shortName[key] || key}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setColorMode(colorMode === "total" ? "ocean" : "total")}
        className={`rounded-full border px-3 py-1.5 text-[11px] font-bold shadow-md ${
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
