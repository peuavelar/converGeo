"use client";

import { useEffect, useState } from "react";

export type MarketplaceScoreItem = {
  id: string;
  baseScore: number;
  opportunityScore: number;
  pricePositionPercentile: number | null;
  benchmarkAvailable: boolean;
  explain: string | null;
  valorizacaoPct: number | null;
};

const flagOn =
  typeof process !== "undefined" &&
  ["1", "true", "yes"].includes(
    (
      process.env.NEXT_PUBLIC_ENABLE_EXTERNAL_BENCHMARK ||
      ""
    ).toLowerCase(),
  );

export function useMarketplaceScores() {
  const [byId, setById] = useState<Record<string, MarketplaceScoreItem>>({});

  useEffect(() => {
    if (!flagOn) return;
    let cancelled = false;
    fetch("/api/marketplace/scores")
      .then((r) => r.json())
      .then((data: { items?: MarketplaceScoreItem[] }) => {
        if (cancelled || !data.items) return;
        const map: Record<string, MarketplaceScoreItem> = {};
        for (const item of data.items) map[item.id] = item;
        setById(map);
      })
      .catch(() => {
        /* silencioso — UI cai no score base */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { enabled: flagOn, byId };
}

export function displayOppScore(
  listingId: string,
  baseScore: number,
  byId: Record<string, MarketplaceScoreItem>,
): number {
  return byId[listingId]?.opportunityScore ?? baseScore;
}
