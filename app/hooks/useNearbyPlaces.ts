"use client";

import { useCallback, useRef, useState } from "react";
import {
  fetchNearbyAmenities,
  DEFAULT_NEARBY_RADIUS_M,
  DEFAULT_NEARBY_FILTERS,
  type NearbyFilters,
  type NearbyPlace,
} from "../services/nearbyPlaces";
import type { LatLng } from "../services/routing";

export function useNearbyPlaces() {
  const [nearbyCenter, setNearbyCenter] = useState<LatLng | null>(null);
  const [nearbyCenterLabel, setNearbyCenterLabel] = useState<string | null>(
    null,
  );
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlace[]>([]);
  const [nearbyFilters, setNearbyFilters] = useState<NearbyFilters>(
    DEFAULT_NEARBY_FILTERS,
  );
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [nearbySource, setNearbySource] = useState<
    "osm" | "mock" | "backend" | null
  >(null);
  const [nearbyRadiusM, setNearbyRadiusM] = useState(DEFAULT_NEARBY_RADIUS_M);
  const [hoveredPoi, setHoveredPoi] = useState<NearbyPlace | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const reqIdRef = useRef(0);

  const clearNearby = useCallback(() => {
    abortRef.current?.abort();
    setNearbyCenter(null);
    setNearbyCenterLabel(null);
    setNearbyPlaces([]);
    setNearbySource(null);
    setNearbyLoading(false);
    setHoveredPoi(null);
  }, []);

  /** Pin de foco sem carregar POIs. */
  const setMapFocusPin = useCallback((lat: number, lng: number, label: string) => {
    abortRef.current?.abort();
    setNearbyCenter({ lat, lng });
    setNearbyCenterLabel(label);
    setNearbyPlaces([]);
    setNearbySource(null);
    setNearbyLoading(false);
    setHoveredPoi(null);
  }, []);

  const loadNearby = useCallback(
    async (lat: number, lng: number, label: string, radiusM = nearbyRadiusM) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      const reqId = ++reqIdRef.current;

      setNearbyCenter({ lat, lng });
      setNearbyCenterLabel(label);
      setNearbyLoading(true);
      setNearbySource(null);
      setNearbyPlaces([]);

      try {
        const result = await fetchNearbyAmenities(lat, lng, {
          signal: controller.signal,
          radiusM,
          onInstant: (places) => {
            if (reqId === reqIdRef.current) setNearbyPlaces(places);
          },
        });
        if (reqId !== reqIdRef.current) return;
        setNearbyPlaces(result.places);
        setNearbySource(result.source);
      } catch {
        if (reqId === reqIdRef.current) setNearbySource("mock");
      } finally {
        if (reqId === reqIdRef.current) setNearbyLoading(false);
      }
    },
    [nearbyRadiusM],
  );

  return {
    nearbyCenter,
    setNearbyCenter,
    nearbyCenterLabel,
    setNearbyCenterLabel,
    nearbyPlaces,
    nearbyFilters,
    setNearbyFilters,
    nearbyLoading,
    nearbySource,
    nearbyRadiusM,
    setNearbyRadiusM,
    hoveredPoi,
    setHoveredPoi,
    clearNearby,
    setMapFocusPin,
    loadNearby,
  };
}
