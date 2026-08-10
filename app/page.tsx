"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import DeckGL from "@deck.gl/react";
import { H3HexagonLayer } from "@deck.gl/geo-layers";
import { ScatterplotLayer, PathLayer, PolygonLayer, TextLayer } from "@deck.gl/layers";
import { FlyToInterpolator } from "@deck.gl/core";
import { Map } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";

import { MAP_STYLES, SearchHistoryItem } from "./utils/constants";
import {
  type AppMode,
  type ImovelTool,
  type PropertyType,
  defaultPropertyType,
  findNearestNeighborhood,
} from "./utils/realEstate";
import { NEIGHBORHOODS, type Neighborhood } from "./data/neighborhoods";

import MapControls from "./components/MapControls";
import FilterPanel from "./components/FilterPanel";
import ViewHeatmap from "./components/views/ViewHeatmap";
import ViewCompare from "./components/views/ViewCompare";
import ViewSingle from "./components/views/ViewSingle";
import ViewTop from "./components/views/ViewTop";
import ViewEmpty from "./components/views/ViewEmpty";
import ViewBairroCompare from "./components/views/ViewBairroCompare";
import ViewBudgetFirst from "./components/views/ViewBudgetFirst";
import ViewFrequentPlaces from "./components/views/ViewFrequentPlaces";
import ZillowTopNav from "./components/zillow/ZillowTopNav";
import ZillowFilterBar from "./components/zillow/ZillowFilterBar";
import ZillowSideRail, {
  type SideRailTab,
} from "./components/zillow/ZillowSideRail";
import type {
  FrequentPlace,
  LatLng,
  RouteLeg,
} from "./services/routing";
import {
  fetchNearbyAmenities,
  radiusCirclePolygon,
  NEARBY_CATEGORY_META,
  DEFAULT_NEARBY_RADIUS_M,
  nextNearbyRadius,
  type NearbyFilters,
  type NearbyPlace,
} from "./services/nearbyPlaces";
import { DEFAULT_NEARBY_FILTERS } from "./services/nearbyPlaces";
import {
  findNearestRegion,
  getRegionByIdSync,
} from "./services/regionsApi";
import RegionHexSheet from "./components/opportunity/RegionHexSheet";
import ViewOpportunityHome, {
  resolveRegionFromQuery,
} from "./components/views/ViewOpportunityHome";
import MarketplaceListPanel, {
  MarketplaceMapTrigger,
} from "./components/marketplace/MarketplaceGateway";
import PropertyDetailOverlay from "./components/marketplace/PropertyDetailOverlay";
import {
  MARKETPLACE_LISTINGS,
  marketplacePriceLabel,
  type MarketplaceListing,
} from "./data/marketplaceListings";
import {
  DEFAULT_IMOVEL_FILTERS,
  type ImovelListingFilters,
} from "./data/imovelFilters";

export default function App() {
  const [appMode, setAppMode] = useState<AppMode>("imovel");
  const [imovelTool, setImovelTool] = useState<ImovelTool>("orcamento");
  const [activeNeighborhood, setActiveNeighborhood] =
    useState<Neighborhood | null>(null);
  const [activeRegionId, setActiveRegionId] = useState<string | null>(null);
  const [compareBairros, setCompareBairros] = useState<Neighborhood[]>([]);
  const [compareRegionIds, setCompareRegionIds] = useState<string[]>([]);
  const [matchHighlightIds, setMatchHighlightIds] = useState<string[]>([]);
  const [budget, setBudget] = useState(500000);
  const [filterQuartos, setFilterQuartos] = useState(2);
  const [searchTrigger, setSearchTrigger] = useState(0);
  const [propertyType, setPropertyType] =
    useState<PropertyType>("apartamento");
  const [listingFilters, setListingFilters] = useState<ImovelListingFilters>(
    DEFAULT_IMOVEL_FILTERS,
  );
  const [regionSheetOpen, setRegionSheetOpen] = useState(false);
  const [frequentPlaces, setFrequentPlaces] = useState<FrequentPlace[]>([]);
  const [routeLegs, setRouteLegs] = useState<RouteLeg[]>([]);
  const [routeOrigin, setRouteOrigin] = useState<LatLng | null>(null);
  const [routeOriginLabel, setRouteOriginLabel] = useState<string | null>(null);
  const [nearbyCenter, setNearbyCenter] = useState<LatLng | null>(null);
  const [nearbyCenterLabel, setNearbyCenterLabel] = useState<string | null>(
    null,
  );
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlace[]>([]);
  const [nearbyFilters, setNearbyFilters] = useState<NearbyFilters>(
    DEFAULT_NEARBY_FILTERS,
  );
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [nearbySource, setNearbySource] = useState<"osm" | "mock" | null>(
    null,
  );
  const [nearbyRadiusM, setNearbyRadiusM] = useState(DEFAULT_NEARBY_RADIUS_M);
  const [selectedListingId, setSelectedListingId] = useState<string | null>(
    null,
  );
  const [openMarketListingId, setOpenMarketListingId] = useState<string | null>(
    null,
  );
  const [marketplaceOpen, setMarketplaceOpen] = useState(false);
  const [sideRailTab, setSideRailTab] = useState<SideRailTab>("procurar");
  const [detailListingId, setDetailListingId] = useState<string | null>(null);
  const nearbyAbortRef = useRef<AbortController | null>(null);
  const nearbyReqIdRef = useRef(0);

  const [hexData, setHexData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentStyle, setCurrentStyle] =
    useState<keyof typeof MAP_STYLES>("voyager");
  const [activeSegment, setActiveSegment] = useState("food_service");
  const [viewState, setViewState] = useState({
    longitude: -38.4813,
    latitude: -12.9515,
    zoom: 12,
    pitch: 0,
    bearing: 0,
  });
  const [viewMode, setViewMode] = useState<
    "single" | "top" | "compare" | "heatmap" | null
  >(null);
  const [lastCoordinate, setLastCoordinate] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [compareLocations, setCompareLocations] = useState<
    { lat: number; lng: number }[]
  >([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchError, setSearchError] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [colorMode, setColorMode] = useState<"total" | "ocean">("total");
  const [minHeatmapScore, setMinHeatmapScore] = useState(0);
  const [competitorPins, setCompetitorPins] = useState<
    { lat: number; lng: number }[]
  >([]);
  const [addressMap, setAddressMap] = useState<Record<string, string>>({});
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [reportMeta, setReportMeta] = useState({ id: "", date: "" });
  const [copied, setCopied] = useState(false);
  const [weightDemografia, setWeightDemografia] = useState(35);
  const [weightMercado, setWeightMercado] = useState(40);
  const [weightFluxo, setWeightFluxo] = useState(25);
  const [showSliders, setShowSliders] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setReportMeta({
        id: Date.now().toString().slice(-6),
        date: new Date().toLocaleDateString("pt-BR"),
      });
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const getDynamicScore = (hex: any) => {
    const totalWeight = weightDemografia + weightMercado + weightFluxo;
    if (totalWeight === 0) return 0;
    const bd = hex.breakdown || {};
    return (
      ((bd.estrutural || 0) * weightDemografia +
        (bd.macroeconomico || 0) * weightMercado +
        (bd.comportamental || 0) * weightFluxo) /
      totalWeight
    );
  };

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

  const selectNeighborhood = (n: Neighborhood) => {
    setActiveNeighborhood(n);
    setActiveRegionId(n.id);
    setImovelTool("explorar");
    setRegionSheetOpen(true);
    flyTo(n.lat, n.lng, 14.2);
    void loadNearby(n.lat, n.lng, n.name);
  };

  const selectRegion = (id: string) => {
    const region = getRegionByIdSync(id);
    if (!region) return;
    setActiveRegionId(id);
    const n = NEIGHBORHOODS.find((x) => x.id === id);
    setActiveNeighborhood(n ?? null);
    setImovelTool("explorar");
    setRegionSheetOpen(true);
    flyTo(region.lat, region.lng, 14.2);
    void loadNearby(region.lat, region.lng, region.name);
  };

  const clearRegion = () => {
    setActiveRegionId(null);
    setActiveNeighborhood(null);
    setRegionSheetOpen(false);
    setNearbyCenter(null);
    setNearbyCenterLabel(null);
    setNearbyPlaces([]);
    setNearbySource(null);
  };

  const selectMapPoint = (lat: number, lng: number) => {
    const nearest = findNearestRegion(lat, lng);
    setActiveRegionId(nearest.id);
    const n = NEIGHBORHOODS.find((x) => x.id === nearest.id);
    setActiveNeighborhood(n ?? null);
    setRegionSheetOpen(true);
    setSideRailTab("procurar");
    setMarketplaceOpen(true);
    // Marca o ponto clicado (livre) e carrega serviços no raio de 2 km
    void loadNearby(lat, lng, nearest.name);
  };

  const previewRegion = (id: string) => {
    const region = getRegionByIdSync(id);
    if (!region) return;
    setActiveRegionId(id);
    const n = NEIGHBORHOODS.find((x) => x.id === id);
    setActiveNeighborhood(n ?? null);
    setRegionSheetOpen(true);
    flyTo(region.lat, region.lng, 13.8);
    void loadNearby(region.lat, region.lng, region.name);
  };

  const handlePickAddress = (suggestion: {
    neighborhoodId: string;
  }) => {
    const region = getRegionByIdSync(suggestion.neighborhoodId);
    if (region) {
      selectRegion(region.id);
      return;
    }
    const n = NEIGHBORHOODS.find((x) => x.id === suggestion.neighborhoodId);
    if (n) selectNeighborhood(n);
  };

  const addCompareBairro = (n: Neighborhood) => {
    setCompareBairros((prev) => {
      if (prev.some((x) => x.id === n.id) || prev.length >= 3) return prev;
      return [...prev, n];
    });
    setCompareRegionIds((prev) => {
      if (prev.includes(n.id) || prev.length >= 3) return prev;
      return [...prev, n.id];
    });
    flyTo(n.lat, n.lng, 13.5);
  };

  const removeCompareBairro = (id: string) => {
    setCompareBairros((prev) => prev.filter((x) => x.id !== id));
    setCompareRegionIds((prev) => prev.filter((x) => x !== id));
  };

  const toggleCompareBairro = (n: Neighborhood) => {
    setCompareBairros((prev) => {
      if (prev.some((x) => x.id === n.id)) {
        return prev.filter((x) => x.id !== n.id);
      }
      if (prev.length >= 3) return [...prev.slice(1), n];
      return [...prev, n];
    });
    setCompareRegionIds((prev) => {
      if (prev.includes(n.id)) return prev.filter((x) => x !== n.id);
      if (prev.length >= 3) return [...prev.slice(1), n.id];
      return [...prev, n.id];
    });
    setImovelTool("comparar");
  };

  const toggleCompareRegion = (id: string) => {
    setCompareRegionIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return [...prev.slice(1), id];
      return [...prev, id];
    });
    const n = NEIGHBORHOODS.find((x) => x.id === id);
    if (n) {
      setCompareBairros((prev) => {
        if (prev.some((x) => x.id === n.id)) {
          return prev.filter((x) => x.id !== n.id);
        }
        if (prev.length >= 3) return [...prev.slice(1), n];
        return [...prev, n];
      });
    }
    setImovelTool("comparar");
  };

  const handleAddressSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchError("");

    if (appMode === "imovel") {
      const regionId = await resolveRegionFromQuery(searchQuery);
      if (regionId) {
        selectRegion(regionId);
        setSearchQuery("");
        setIsSearching(false);
        return;
      }
      const local = NEIGHBORHOODS.find((n) =>
        n.name.toLowerCase().includes(searchQuery.trim().toLowerCase()),
      );
      if (local) {
        selectNeighborhood(local);
        setSearchQuery("");
        setIsSearching(false);
        return;
      }
    }

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery + ", Salvador, Bahia",
        )}&limit=1`,
      );
      const data = await res.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        flyTo(lat, lng, 15);
        if (appMode === "imovel") {
          selectNeighborhood(findNearestNeighborhood(lat, lng));
        } else {
          setLastCoordinate({ lat, lng });
          setViewMode("single");
        }
        setSearchQuery("");
      } else {
        setSearchError("Endereço não encontrado.");
        setTimeout(() => setSearchError(""), 4000);
      }
    } catch {
      setSearchError("Erro na geolocalização.");
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (appMode !== "negocio" || viewMode === null) return;

    const fetchDadosDaAPI = async () => {
      setLoading(true);
      try {
        const rawUrl = process.env.NEXT_PUBLIC_API_URL || "/backend";
        const baseUrl = rawUrl.replace(/\/$/, "");

        if (viewMode === "heatmap") {
          const res = await fetch(
            `${baseUrl}/top?segmento=${activeSegment}&limit=300`,
          );
          const data = await res.json();
          setHexData(data.status === "sucesso" ? data.recomendacoes : []);
        } else if (viewMode === "top") {
          const res = await fetch(
            `${baseUrl}/top?segmento=${activeSegment}&limit=5`,
          );
          const data = await res.json();
          setHexData(data.status === "sucesso" ? data.recomendacoes : []);
        } else if (viewMode === "single" && lastCoordinate) {
          const res = await fetch(
            `${baseUrl}/score?lat=${lastCoordinate.lat}&lng=${lastCoordinate.lng}&segmento=${activeSegment}`,
          );
          const data = await res.json();
          const singleHex = data.status === "sucesso" ? [data] : [];
          setHexData(singleHex);
          if (singleHex.length > 0) {
            const macroScore = singleHex[0].breakdown?.macroeconomico || 0;
            const numPins = Math.max(0, Math.floor((10 - macroScore) * 2.5));
            const pins = [];
            for (let i = 0; i < numPins; i++) {
              const radius = 0.005 * Math.sqrt(Math.random());
              const theta = Math.random() * 2 * Math.PI;
              pins.push({
                lat: singleHex[0].lat + radius * Math.cos(theta),
                lng: singleHex[0].lng + radius * Math.sin(theta),
              });
            }
            setCompetitorPins(pins);
          } else {
            setCompetitorPins([]);
          }
        } else if (viewMode === "compare" && compareLocations.length > 0) {
          setCompetitorPins([]);
          const promises = compareLocations.map((loc) =>
            fetch(
              `${baseUrl}/score?lat=${loc.lat}&lng=${loc.lng}&segmento=${activeSegment}`,
            ).then((r) => r.json()),
          );
          const results = await Promise.all(promises);
          setHexData(results.filter((d) => d.status === "sucesso"));
        }
      } catch {
        setHexData([]);
      } finally {
        setLoading(false);
      }
    };

    void fetchDadosDaAPI();
  }, [
    appMode,
    viewMode,
    activeSegment,
    lastCoordinate,
    compareLocations,
  ]);

  useEffect(() => {
    if (appMode !== "negocio" || viewMode === "heatmap") return;
    const fetchAddresses = async () => {
      const newAddresses = { ...addressMap };
      let updated = false;
      for (const hex of hexData) {
        if (hex.lat && hex.lng && !newAddresses[hex.h3_index]) {
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${hex.lat}&lon=${hex.lng}&zoom=14`,
            );
            const data = await res.json();
            const addr = data.address || {};
            const localName =
              addr.suburb ||
              addr.neighbourhood ||
              addr.road ||
              addr.city_district ||
              "Salvador";
            newAddresses[hex.h3_index] = localName;
            updated = true;
            if (hexData.length === 1 && viewMode === "single") {
              const dynScore = getDynamicScore(hex);
              setSearchHistory((prev) => {
                if (prev.some((item) => item.h3_index === hex.h3_index))
                  return prev;
                return [
                  {
                    h3_index: hex.h3_index,
                    name: localName,
                    score: dynScore,
                    lat: hex.lat,
                    lng: hex.lng,
                  },
                  ...prev,
                ].slice(0, 5);
              });
            }
          } catch {
            newAddresses[hex.h3_index] = "Área Analisada";
            updated = true;
          }
          await new Promise((r) => setTimeout(r, 1000));
        }
      }
      if (updated) setAddressMap(newAddresses);
    };
    if (hexData.length > 0) void fetchAddresses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hexData, viewMode, appMode]);

  const loadNearby = async (
    lat: number,
    lng: number,
    label: string,
    radiusM = nearbyRadiusM,
  ) => {
    nearbyAbortRef.current?.abort();
    const controller = new AbortController();
    nearbyAbortRef.current = controller;
    const reqId = ++nearbyReqIdRef.current;

    setNearbyCenter({ lat, lng });
    setNearbyCenterLabel(label);
    setNearbyLoading(true);
    setNearbySource("mock");

    try {
      const result = await fetchNearbyAmenities(lat, lng, {
        signal: controller.signal,
        radiusM,
        onInstant: (places) => {
          if (reqId !== nearbyReqIdRef.current) return;
          setNearbyPlaces(places);
        },
      });
      if (reqId !== nearbyReqIdRef.current) return;
      setNearbyPlaces(result.places);
      setNearbySource(result.source);
    } catch {
      if (reqId !== nearbyReqIdRef.current) return;
      setNearbySource("mock");
    } finally {
      if (reqId === nearbyReqIdRef.current) {
        setNearbyLoading(false);
      }
    }
  };

  const adjustNearbyRadius = (dir: 1 | -1) => {
    if (!nearbyCenter) return;
    const next = nextNearbyRadius(nearbyRadiusM, dir);
    if (next === nearbyRadiusM) return;
    setNearbyRadiusM(next);
    void loadNearby(
      nearbyCenter.lat,
      nearbyCenter.lng,
      nearbyCenterLabel || "Ponto selecionado",
      next,
    );
  };

  const handleMapClick = (info: any) => {
    if (appMode === "imovel") {
      // Clique em pin de preço do marketplace
      const listing = info.object as MarketplaceListing | undefined;
      if (listing?.price != null && listing?.regionId && listing?.id?.startsWith("mkt-")) {
        setSelectedListingId(listing.id);
        setDetailListingId(listing.id);
        setOpenMarketListingId(listing.id);
        setSideRailTab("procurar");
        setMarketplaceOpen(true);
        setActiveRegionId(listing.regionId);
        const n = NEIGHBORHOODS.find((x) => x.id === listing.regionId);
        setActiveNeighborhood(n ?? null);
        setRegionSheetOpen(true);
        flyTo(listing.lat, listing.lng, 14.2);
        void loadNearby(listing.lat, listing.lng, listing.title);
        return;
      }

      if (!info.coordinate) return;
      const [lng, lat] = info.coordinate;

      if (imovelTool === "rotas") {
        const nearest = findNearestRegion(lat, lng);
        setRouteOrigin({ lat, lng });
        setRouteOriginLabel(`Perto de ${nearest.name}`);
        setActiveRegionId(nearest.id);
        setRouteLegs([]);
        return;
      }

      if (imovelTool === "comparar") {
        const nearest = findNearestRegion(lat, lng);
        toggleCompareRegion(nearest.id);
        return;
      }

      // Clique livre: região + dados + abre marketplace
      setSelectedListingId(null);
      setOpenMarketListingId(null);
      selectMapPoint(lat, lng);
      return;
    }

    if (!info.coordinate) return;
    const [lng, lat] = info.coordinate;

    if (viewMode === "compare") {
      setCompareLocations((prev) =>
        prev.length >= 2 ? [{ lat, lng }] : [...prev, { lat, lng }],
      );
    } else {
      setLastCoordinate({ lat, lng });
      setViewMode("single");
    }
  };

  const handleExportCSV = () => {
    const headers = [
      "ID_H3",
      "Localizacao",
      "Nota_Personalizada",
      "Demografia",
      "Saturacao_Mercado",
      "Fluxo",
    ];
    const dataToExport =
      viewMode === "heatmap"
        ? hexData.filter((h) => getDynamicScore(h) >= minHeatmapScore)
        : hexData;
    const rows = dataToExport.map((hex) => [
      hex.h3_index,
      `"${addressMap[hex.h3_index] || "Salvador"}"`,
      getDynamicScore(hex).toFixed(2),
      hex.breakdown?.estrutural?.toFixed(2) || 0,
      hex.breakdown?.macroeconomico?.toFixed(2) || 0,
      hex.breakdown?.comportamental?.toFixed(2) || 0,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `ConverGeo_Analise_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = () => {
    try {
      const url = typeof window !== "undefined" ? window.location.href : "";
      if (navigator.clipboard) navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const visibleHexData =
    viewMode === "heatmap"
      ? hexData.filter((d) => getDynamicScore(d) >= minHeatmapScore)
      : hexData;

  const layers = useMemo(() => {
    if (appMode === "imovel") {
      return [
        ...(nearbyCenter
          ? [
              new PolygonLayer({
                id: "nearby-radius",
                data: [
                  {
                    polygon: radiusCirclePolygon(
                      nearbyCenter.lat,
                      nearbyCenter.lng,
                      nearbyRadiusM,
                    ),
                  },
                ],
                pickable: false,
                stroked: true,
                filled: true,
                getPolygon: (d: { polygon: [number, number][] }) => d.polygon,
                getFillColor: [0, 106, 255, 28],
                getLineColor: [0, 106, 255, 160],
                lineWidthMinPixels: 2,
              }),
              new ScatterplotLayer({
                id: "map-click-pin",
                data: [nearbyCenter],
                pickable: false,
                radiusUnits: "meters",
                getPosition: (d: LatLng) => [d.lng, d.lat],
                getRadius: 80,
                getFillColor: [0, 106, 255, 255],
                stroked: true,
                getLineColor: [255, 255, 255, 255],
                lineWidthMinPixels: 3,
              }),
              new ScatterplotLayer({
                id: "nearby-pois",
                data: nearbyPlaces.filter((p) => nearbyFilters[p.category]),
                pickable: false,
                radiusUnits: "meters",
                getPosition: (d: NearbyPlace) => [d.lng, d.lat],
                getRadius: 70,
                getFillColor: (d: NearbyPlace) => [
                  ...NEARBY_CATEGORY_META[d.category].color,
                  230,
                ],
                stroked: true,
                getLineColor: [255, 255, 255, 255],
                lineWidthMinPixels: 2,
                updateTriggers: {
                  getFillColor: [JSON.stringify(nearbyFilters)],
                  data: [nearbyPlaces.length, JSON.stringify(nearbyFilters)],
                },
              }),
              new TextLayer({
                id: "nearby-symbols",
                data: nearbyPlaces.filter((p) => nearbyFilters[p.category]),
                pickable: false,
                getPosition: (d: NearbyPlace) => [d.lng, d.lat],
                getText: (d: NearbyPlace) =>
                  NEARBY_CATEGORY_META[d.category].symbol,
                getSize: 18,
                getColor: [20, 20, 30, 255],
                getPixelOffset: [0, -16],
                billboard: true,
                fontSettings: { sdf: false },
                updateTriggers: {
                  getText: [nearbyPlaces.length],
                  data: [nearbyPlaces.length, JSON.stringify(nearbyFilters)],
                },
              }),
            ]
          : []),
        ...(routeOrigin
          ? [
              new ScatterplotLayer({
                id: "route-origin",
                data: [routeOrigin],
                pickable: false,
                radiusUnits: "meters",
                getPosition: (d: LatLng) => [d.lng, d.lat],
                getRadius: 90,
                getFillColor: [0, 106, 255, 255],
                getLineColor: [255, 255, 255, 255],
                lineWidthMinPixels: 2,
                stroked: true,
                filled: true,
              }),
            ]
          : []),
        ...(routeLegs.length
          ? [
              new PathLayer({
                id: "frequent-routes",
                data: routeLegs,
                pickable: true,
                widthMinPixels: 4,
                getPath: (d: RouteLeg) => d.path,
                getColor: (d: RouteLeg) => [...d.color, 220],
                getWidth: 5,
              }),
              new ScatterplotLayer({
                id: "frequent-destinations",
                data: routeLegs,
                pickable: true,
                radiusUnits: "meters",
                getPosition: (d: RouteLeg) => d.path[d.path.length - 1],
                getRadius: 70,
                getFillColor: (d: RouteLeg) => [...d.color, 255],
                stroked: true,
                getLineColor: [255, 255, 255, 255],
                lineWidthMinPixels: 2,
              }),
            ]
          : []),
        // Pins de preço estilo Airbnb (casas à venda no marketplace)
        new TextLayer({
          id: "marketplace-price-pills",
          data: MARKETPLACE_LISTINGS,
          pickable: true,
          getPosition: (d: MarketplaceListing) => [d.lng, d.lat],
          getText: (d: MarketplaceListing) => marketplacePriceLabel(d.price),
          getSize: 13,
          sizeUnits: "pixels",
          fontFamily: "Segoe UI, Helvetica, Arial, sans-serif",
          fontWeight: 700,
          getTextAnchor: "middle",
          getAlignmentBaseline: "center",
          billboard: true,
          background: true,
          backgroundPadding: [12, 6, 12, 6],
          backgroundBorderRadius: 20,
          getColor: (d: MarketplaceListing) =>
            d.id === selectedListingId
              ? [255, 255, 255, 255]
              : [34, 34, 34, 255],
          getBackgroundColor: (d: MarketplaceListing) =>
            d.id === selectedListingId
              ? [0, 106, 255, 255]
              : [255, 255, 255, 255],
          getBorderColor: (d: MarketplaceListing) =>
            d.id === selectedListingId
              ? [0, 88, 214, 255]
              : [220, 220, 225, 255],
          getBorderWidth: 1,
          updateTriggers: {
            getColor: [selectedListingId],
            getBackgroundColor: [selectedListingId],
            getBorderColor: [selectedListingId],
          },
        }),
      ];
    }

    return [
      new H3HexagonLayer({
        id: "h3-hexagon-layer",
        data: visibleHexData,
        pickable: true,
        extruded: true,
        elevationScale: 50,
        stroked: true,
        filled: true,
        lineWidthMinPixels: 1,
        coverage: 0.95,
        getHexagon: (d: any) => d.h3_index,
        getElevation: (d: any) => getDynamicScore(d) * 10,
        getFillColor: (d: any) => {
          if (colorMode === "ocean") {
            const s = d.breakdown?.macroeconomico || 0;
            return s >= 7
              ? [14, 165, 233, 200]
              : s >= 4
                ? [168, 85, 247, 200]
                : [239, 68, 68, 200];
          }
          const s = getDynamicScore(d);
          return s >= 7
            ? [16, 185, 129, 200]
            : s >= 4
              ? [245, 158, 11, 200]
              : [239, 68, 68, 200];
        },
        getLineColor: () => [255, 255, 255, 50],
        updateTriggers: {
          getElevation: [weightDemografia, weightMercado, weightFluxo],
          getFillColor: [
            weightDemografia,
            weightMercado,
            weightFluxo,
            colorMode,
          ],
        },
      }),
      new ScatterplotLayer({
        id: "competitor-pins-layer",
        data: competitorPins,
        pickable: false,
        opacity: 0.8,
        stroked: true,
        filled: true,
        radiusScale: 10,
        radiusMinPixels: 3,
        radiusMaxPixels: 10,
        lineWidthMinPixels: 1,
        getPosition: (d: any) => [d.lng, d.lat],
        getFillColor: [239, 68, 68],
        getLineColor: [255, 255, 255],
      }),
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    appMode,
    routeOrigin,
    routeLegs,
    nearbyCenter,
    nearbyRadiusM,
    nearbyPlaces,
    nearbyFilters,
    selectedListingId,
    visibleHexData,
    competitorPins,
    colorMode,
    weightDemografia,
    weightMercado,
    weightFluxo,
  ]);

  const mapPane = (
    <div className="relative min-h-0 min-w-0 flex-1 bg-[#e8e8ed]">
      <DeckGL
        viewState={viewState}
        onViewStateChange={(e: any) => setViewState(e.viewState)}
        controller={{
          dragRotate: appMode !== "imovel",
          touchRotate: appMode !== "imovel",
        }}
        onClick={handleMapClick}
        layers={layers}
        getCursor={({ isDragging }: any) =>
          isDragging ? "grabbing" : appMode === "imovel" ? "crosshair" : "grab"
        }
      >
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <Map mapStyle={MAP_STYLES[currentStyle].url as any} />
      </DeckGL>

      <div className="absolute bottom-4 right-4 z-10">
        <MapControls
          currentStyle={currentStyle}
          setCurrentStyle={setCurrentStyle}
          colorMode={colorMode}
          setColorMode={setColorMode}
          onZoomIn={() =>
            setViewState((vs) => ({
              ...vs,
              zoom: Math.min(20, (vs.zoom ?? 12) + 1),
              transitionDuration: 250,
            }))
          }
          onZoomOut={() =>
            setViewState((vs) => ({
              ...vs,
              zoom: Math.max(8, (vs.zoom ?? 12) - 1),
              transitionDuration: 250,
            }))
          }
          onTempoDeslocamento={
            appMode === "imovel"
              ? () => {
                  setMarketplaceOpen(false);
                  setSideRailTab("procurar");
                  setImovelTool("rotas");
                }
              : undefined
          }
          tempoDeslocamentoActive={
            appMode === "imovel" && imovelTool === "rotas"
          }
        />
      </div>

      {appMode === "imovel" && (
        <MarketplaceMapTrigger
          hidden={marketplaceOpen}
          onRequestOpen={() => setMarketplaceOpen(true)}
        />
      )}

      {appMode === "imovel" && regionSheetOpen && imovelTool !== "rotas" && (
        <RegionHexSheet
          regionId={activeRegionId}
          onClose={clearRegion}
          onOpenFull={(id) => {
            selectRegion(id);
          }}
          nearbyPlaces={nearbyPlaces}
          nearbyLoading={nearbyLoading}
          nearbyFilters={nearbyFilters}
          setNearbyFilters={setNearbyFilters}
          nearbySource={nearbySource}
          nearbyRadiusM={nearbyRadiusM}
          onNearbyRadiusChange={adjustNearbyRadius}
        />
      )}
    </div>
  );

  return (
    <main className="flex h-screen w-full flex-col overflow-hidden bg-white print:h-auto print:overflow-visible">
      <ZillowTopNav
        appMode={appMode}
        setAppMode={(mode) => {
          setAppMode(mode);
          setPropertyType(defaultPropertyType(mode));
          setSearchError("");
        }}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSearch={handleAddressSearch}
        isSearching={isSearching}
      />

      {appMode === "imovel" && (
        <ZillowFilterBar
          tool={imovelTool}
          setTool={setImovelTool}
          budget={budget}
          setBudget={setBudget}
          quartos={filterQuartos}
          setQuartos={setFilterQuartos}
          onFind={() => {
            setImovelTool("orcamento");
            setSearchTrigger((n) => n + 1);
          }}
        />
      )}

      {searchError && (
        <p className="border-b border-rose-100 bg-rose-50 px-4 py-1.5 text-xs font-semibold text-rose-600">
          {searchError}
        </p>
      )}

      <div className="flex min-h-0 flex-1">
        {appMode === "imovel" && (
          <ZillowSideRail
            active={sideRailTab}
            onChange={(tab) => {
              setSideRailTab(tab);
              if (tab === "procurar") {
                setMarketplaceOpen(false);
                setImovelTool("orcamento");
              } else {
                setMarketplaceOpen(false);
              }
            }}
          />
        )}
        <aside
          className={`flex shrink-0 flex-col border-r border-[#d1d1d5] bg-white print:max-w-none print:border-none ${
            marketplaceOpen && appMode === "imovel" && sideRailTab === "procurar"
              ? "w-full max-w-[720px] overflow-hidden"
              : "w-full max-w-[440px] overflow-y-auto custom-scrollbar"
          }`}
        >
          {appMode === "imovel" && sideRailTab === "atualizacoes" ? (
            <SideRailPlaceholder
              title="Atualizações"
              body="Acompanhe mudanças de preço e novos anúncios nas regiões que você segue."
            />
          ) : appMode === "imovel" && sideRailTab === "plano" ? (
            <SideRailPlaceholder
              title="Plano"
              body="Monte seu plano de compra: orçamento, regiões alvo e próximos passos."
            />
          ) : appMode === "imovel" && sideRailTab === "inbox" ? (
            <SideRailPlaceholder
              title="Caixa de entrada"
              body="Mensagens de corretores e alertas do Sino Mobile aparecem aqui."
            />
          ) : appMode === "imovel" &&
            marketplaceOpen &&
            sideRailTab === "procurar" ? (
            <MarketplaceListPanel
              selectedListingId={selectedListingId}
              focusListingId={openMarketListingId}
              onFocusListingHandled={() => setOpenMarketListingId(null)}
              onSelectListing={(listing) => {
                setSelectedListingId(listing.id);
                flyTo(listing.lat, listing.lng, 14.2);
              }}
              onOpenDetail={(listing) => {
                setSelectedListingId(listing.id);
                setDetailListingId(listing.id);
                flyTo(listing.lat, listing.lng, 14.2);
              }}
              onClose={() => {
                setMarketplaceOpen(false);
                setOpenMarketListingId(null);
                setSelectedListingId(null);
                setSideRailTab("procurar");
              }}
              budget={budget}
              setBudget={setBudget}
              quartos={filterQuartos}
              setQuartos={setFilterQuartos}
            />
          ) : appMode === "imovel" && sideRailTab === "favoritos" ? (
            <SideRailPlaceholder
              title="Favoritos"
              body="Salve imóveis e regiões para comparar depois. Os pins do marketplace também podem ir para cá."
            />
          ) : appMode === "imovel" ? (
            imovelTool === "comparar" ? (
              <ViewBairroCompare
                selected={compareBairros}
                budget={budget}
                propertyType={propertyType}
                onAdd={addCompareBairro}
                onRemove={removeCompareBairro}
                onClear={() => {
                  setCompareBairros([]);
                  setCompareRegionIds([]);
                }}
              />
            ) : imovelTool === "rotas" ? (
              <ViewFrequentPlaces
                origin={routeOrigin}
                originLabel={routeOriginLabel}
                places={frequentPlaces}
                setPlaces={setFrequentPlaces}
                routes={routeLegs}
                setRoutes={setRouteLegs}
                onSetOrigin={(point, label) => {
                  setRouteOrigin(point);
                  setRouteOriginLabel(label);
                  flyTo(point.lat, point.lng, 13.5);
                }}
              />
            ) : imovelTool === "orcamento" ? (
              <ViewBudgetFirst
                budget={budget}
                setBudget={setBudget}
                quartos={filterQuartos}
                setQuartos={setFilterQuartos}
                triggerSearch={searchTrigger}
                onSelectRegion={previewRegion}
                onHighlightRegions={setMatchHighlightIds}
                selectedRegionId={activeRegionId}
              />
            ) : (
              <div className="p-3">
                <ViewOpportunityHome
                  activeRegionId={activeRegionId}
                  compareIds={compareRegionIds}
                  onSelectRegion={previewRegion}
                  onToggleCompare={toggleCompareRegion}
                  onClearRegion={clearRegion}
                />
              </div>
            )
          ) : (
            <div className="space-y-3 p-4">
              <FilterPanel
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                handleAddressSearch={handleAddressSearch}
                onPickAddress={(suggestion) => {
                  const n = NEIGHBORHOODS.find(
                    (x) => x.id === suggestion.neighborhoodId,
                  );
                  if (!n) return;
                  flyTo(n.lat, n.lng, 14.2);
                  setLastCoordinate({ lat: n.lat, lng: n.lng });
                  setViewMode("single");
                }}
                isSearching={isSearching}
                searchError={searchError}
                activeSegment={activeSegment}
                setActiveSegment={setActiveSegment}
                propertyType={propertyType}
                setPropertyType={setPropertyType}
                showSliders={showSliders}
                setShowSliders={setShowSliders}
                weightDemografia={weightDemografia}
                setWeightDemografia={setWeightDemografia}
                weightMercado={weightMercado}
                setWeightMercado={setWeightMercado}
                weightFluxo={weightFluxo}
                setWeightFluxo={setWeightFluxo}
                viewMode={viewMode}
                handleTop5Click={() => {
                  setViewMode("top");
                  setCompetitorPins([]);
                }}
                handleHeatmapClick={() => {
                  setViewMode("heatmap");
                  setCompetitorPins([]);
                }}
                handleCompareClick={() => {
                  setViewMode("compare");
                  setCompareLocations([]);
                  setHexData([]);
                  setCompetitorPins([]);
                }}
              />
              {loading ? (
                <div className="flex flex-col items-center py-10">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#006aff] border-t-transparent" />
                </div>
              ) : viewMode === "heatmap" ? (
                <ViewHeatmap
                  minHeatmapScore={minHeatmapScore}
                  setMinHeatmapScore={setMinHeatmapScore}
                  handleExportCSV={handleExportCSV}
                />
              ) : viewMode === "compare" ? (
                <ViewCompare
                  compareLocations={compareLocations}
                  hexData={hexData}
                  addressMap={addressMap}
                  getDynamicScore={getDynamicScore}
                  handlePrintPDF={() => window.print()}
                  handleCompareClick={() => {
                    setViewMode("compare");
                    setCompareLocations([]);
                    setHexData([]);
                    setCompetitorPins([]);
                  }}
                  handleShare={handleShare}
                  copied={copied}
                />
              ) : hexData.length === 1 && viewMode === "single" ? (
                <ViewSingle
                  hexData={hexData}
                  addressMap={addressMap}
                  getDynamicScore={getDynamicScore}
                  activeSegment={activeSegment}
                  competitorPins={competitorPins}
                  handlePrintPDF={() => window.print()}
                  handleShare={handleShare}
                  handleExportCSV={handleExportCSV}
                  copied={copied}
                />
              ) : hexData.length > 1 && viewMode === "top" ? (
                <ViewTop
                  hexData={hexData}
                  addressMap={addressMap}
                  getDynamicScore={getDynamicScore}
                  handleExportCSV={handleExportCSV}
                  activeSegment={activeSegment}
                />
              ) : (
                <ViewEmpty
                  searchHistory={searchHistory}
                  setViewState={setViewState}
                  setLastCoordinate={setLastCoordinate}
                  setViewMode={setViewMode}
                />
              )}
            </div>
          )}
        </aside>

        {mapPane}
      </div>

      {detailListingId && (() => {
        const detail = MARKETPLACE_LISTINGS.find((l) => l.id === detailListingId);
        if (!detail) return null;
        return (
          <PropertyDetailOverlay
            listing={detail}
            onClose={() => setDetailListingId(null)}
            onAskSino={() => {
              setDetailListingId(null);
              setImovelTool("explorar");
              setSideRailTab("procurar");
            }}
          />
        );
      })()}
    </main>
  );
}

function SideRailPlaceholder({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="flex flex-1 flex-col items-start justify-center gap-2 p-6 animate-fade-in">
      <h2 className="text-xl font-bold text-[#2a2a33]">{title}</h2>
      <p className="max-w-sm text-sm leading-relaxed text-[#6a6a72]">{body}</p>
      <p className="mt-2 text-xs font-semibold text-[#006aff]">
        Em breve no ConverGeo
      </p>
    </div>
  );
}
