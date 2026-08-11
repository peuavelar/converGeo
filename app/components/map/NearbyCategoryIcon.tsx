"use client";

import type { NearbyCategory } from "../../services/nearbyPlaces";

/** Pictogramas inline (UI) — mesmos significados dos pins do mapa. */
export function NearbyCategoryIcon({
  category,
  className = "h-3.5 w-3.5",
}: {
  category: NearbyCategory;
  className?: string;
}) {
  const common = {
    viewBox: "0 0 24 24",
    className,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };

  if (category === "restaurante") {
    return (
      <svg {...common}>
        <path d="M8 3v7a2 2 0 0 0 2 2v9" />
        <path d="M8 3c0 3 2 3 2 7" />
        <path d="M16 3v18" />
        <path d="M14 3h4v4a2 2 0 0 1-2 2" />
      </svg>
    );
  }
  if (category === "hospital") {
    return (
      <svg {...common}>
        <path d="M12 5v14M5 12h14" />
      </svg>
    );
  }
  if (category === "delegacia") {
    return (
      <svg {...common}>
        <path d="M12 3l8 4v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V7l8-4z" />
        <path d="M12 10v5M9.5 12.5h5" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M3 10l9-5 9 5-9 5-9-5z" />
      <path d="M7 12.5V17c0 1.5 2.2 3 5 3s5-1.5 5-3v-4.5" />
    </svg>
  );
}
