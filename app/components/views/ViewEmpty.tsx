"use client";

import React from "react";
import { FlyToInterpolator } from "@deck.gl/core";
import { SearchHistoryItem } from "../../utils/constants";

interface ViewEmptyProps {
  searchHistory: SearchHistoryItem[];
  setViewState: (updater: (prev: any) => any) => void;
  setLastCoordinate: (coord: { lat: number; lng: number }) => void;
  setViewMode: (mode: "single" | "top" | "compare" | "heatmap" | null) => void;
}

export default function ViewEmpty({
  searchHistory,
  setViewState,
  setLastCoordinate,
  setViewMode,
}: ViewEmptyProps) {
  return (
    <div className="mt-4 flex flex-col items-center rounded-2xl border border-dashed border-[#d4d4d8] bg-white p-5 text-center">
      <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-[#0a0a0b] text-white">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
          <path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z" />
        </svg>
      </div>
      <p className="text-sm font-bold text-[#0a0a0b]">Pronto para a Descoberta</p>
      <p className="mt-1 max-w-[240px] text-[11px] leading-relaxed text-[#6a6a72]">
        Explore Salvador e Lauro de Freitas: busque um endereço ou use Top 5 /
        Raio-X / Comparar (digitando os locais A e B).
      </p>
      {searchHistory.length > 0 && (
        <div className="mt-5 w-full text-left animate-fade-in">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[#8a8a93]">
            Buscas recentes
          </p>
          <div className="flex flex-col gap-2">
            {searchHistory.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setViewState((prev: any) => ({
                    ...prev,
                    longitude: item.lng,
                    latitude: item.lat,
                    zoom: 15,
                    transitionDuration: 1500,
                    transitionInterpolator: new FlyToInterpolator(),
                  }));
                  setLastCoordinate({ lat: item.lat, lng: item.lng });
                  setViewMode("single");
                }}
                className="flex items-center justify-between rounded-xl border border-[#e6e6ea] bg-white p-2.5 text-left shadow-sm transition hover:border-[#0a0a0b] hover:bg-[#fafafa]"
              >
                <span
                  className="mr-2 truncate text-[11px] font-semibold text-[#0a0a0b]"
                  title={item.name}
                >
                  {item.name}
                </span>
                <span className="rounded-full bg-[#0a0a0b] px-2 py-0.5 text-[10px] font-bold text-white">
                  {item.score.toFixed(1)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
