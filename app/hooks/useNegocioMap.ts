"use client";

import { useEffect, useState } from "react";
import { FlyToInterpolator } from "@deck.gl/core";
import type { AppMode } from "../utils/realEstate";
import { fetchNegocioHex } from "../../lib/negocio/fetchHexScores";
import { getDynamicScore, type ScoreWeights } from "../utils/dynamicScore";
import type { SearchHistoryItem } from "../utils/constants";

type ViewMode = "single" | "top" | "compare" | "heatmap" | null;
type LatLng = { lat: number; lng: number };

export function useMapCamera(appMode: AppMode) {
  const [viewState, setViewState] = useState({
    longitude: -38.48,
    latitude: -12.98,
    zoom: 11.2,
    pitch: appMode === "negocio" ? 42 : 0,
    bearing: appMode === "negocio" ? -12 : 0,
  });

  const flyTo = (lat: number, lng: number, zoom = 14) => {
    setViewState((prev) => ({
      ...prev,
      longitude: lng,
      latitude: lat,
      zoom,
      pitch: appMode === "imovel" ? 0 : 45,
      transitionDuration: 1200,
      transitionInterpolator: new FlyToInterpolator(),
    }));
  };

  const flyToMid = (a: LatLng, b: LatLng, zoom = 11.6) => {
    setViewState((vs) => ({
      ...vs,
      latitude: (a.lat + b.lat) / 2,
      longitude: (a.lng + b.lng) / 2,
      zoom,
      pitch: 35,
      transitionDuration: 1000,
      transitionInterpolator: new FlyToInterpolator(),
    }));
  };

  return { viewState, setViewState, flyTo, flyToMid };
}

export function useNegocioHexData(opts: {
  appMode: AppMode;
  viewMode: ViewMode;
  activeSegment: string;
  lastCoordinate: LatLng | null;
  compareLocations: LatLng[];
  weights: ScoreWeights;
}) {
  const {
    appMode,
    viewMode,
    activeSegment,
    lastCoordinate,
    compareLocations,
    weights,
  } = opts;

  const [hexData, setHexData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [competitorPins, setCompetitorPins] = useState<LatLng[]>([]);
  const [addressMap, setAddressMap] = useState<Record<string, string>>({});
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);

  useEffect(() => {
    if (appMode !== "negocio" || viewMode === null) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const result = await fetchNegocioHex({
          viewMode,
          segment: activeSegment,
          lastCoordinate,
          compareLocations,
        });
        if (cancelled) return;
        setHexData(result.hexData);
        setCompetitorPins(result.competitorPins);
      } catch {
        if (!cancelled) {
          setHexData([]);
          setCompetitorPins([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [appMode, viewMode, activeSegment, lastCoordinate, compareLocations]);

  useEffect(() => {
    if (appMode !== "negocio" || viewMode === "heatmap" || !hexData.length) {
      return;
    }

    let cancelled = false;

    (async () => {
      const next = { ...addressMap };
      let updated = false;

      for (const hex of hexData) {
        if (cancelled || !hex.lat || !hex.lng || next[hex.h3_index]) continue;
        try {
          const res = await fetch(
            `/api/geo/reverse?lat=${hex.lat}&lng=${hex.lng}`,
            { headers: { Accept: "application/json" } },
          );
          const data = (await res.json()) as {
            neighbourhood?: string;
            suburb?: string;
            displayName?: string;
          };
          const localName =
            data.suburb ||
            data.neighbourhood ||
            data.displayName?.split(",")[0] ||
            "Salvador";
          next[hex.h3_index] = localName;
          updated = true;

          if (hexData.length === 1 && viewMode === "single") {
            const score = getDynamicScore(hex, weights);
            setSearchHistory((prev) => {
              if (prev.some((item) => item.h3_index === hex.h3_index)) return prev;
              return [
                {
                  h3_index: hex.h3_index,
                  name: localName,
                  score,
                  lat: hex.lat,
                  lng: hex.lng,
                },
                ...prev,
              ].slice(0, 5);
            });
          }
        } catch {
          next[hex.h3_index] = "Área Analisada";
          updated = true;
        }
        await new Promise((r) => setTimeout(r, 1000));
      }

      if (!cancelled && updated) setAddressMap(next);
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hexData, viewMode, appMode]);

  return {
    hexData,
    setHexData,
    loading,
    competitorPins,
    setCompetitorPins,
    addressMap,
    searchHistory,
    setSearchHistory,
  };
}
