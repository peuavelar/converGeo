"use client";

import { NearbyCategoryIcon } from "./NearbyCategoryIcon";
import {
  NEARBY_CATEGORY_META,
  type NearbyPlace,
} from "../../services/nearbyPlaces";

type Props = {
  /** POI sob hover/tap — mostra nome + categoria. */
  active: NearbyPlace | null;
  className?: string;
};

/** Tooltip do local próximo no mapa (direita). */
export default function MapNearbyLegend({
  active,
  className = "",
}: Props) {
  if (!active) return null;

  return (
    <div
      className={`pointer-events-none absolute right-2 z-20 max-w-[min(100%-1rem,260px)] sm:right-3 ${className}`}
    >
      <div className="rounded-lg border border-[#d1d1d5] bg-white/95 px-2.5 py-2 shadow-md backdrop-blur-sm animate-fade-in">
        <div className="flex items-center gap-2">
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-white"
            style={{
              backgroundColor: `rgb(${NEARBY_CATEGORY_META[active.category].color.join(",")})`,
            }}
          >
            <NearbyCategoryIcon
              category={active.category}
              className="h-3.5 w-3.5"
            />
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs font-bold text-[#2a2a33]">
              {active.name}
            </p>
            <p className="text-[10px] font-medium text-[#6a6a72]">
              {NEARBY_CATEGORY_META[active.category].label}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
