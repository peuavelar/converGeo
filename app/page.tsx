"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import DeckGL from "@deck.gl/react";
import { Map } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";

import { MAP_STYLES } from "./utils/constants";
import {
  type AppMode,
  type ImovelTool,
  type PropertyType,
  findNearestNeighborhood,
} from "./utils/realEstate";
import { type Neighborhood } from "./data/neighborhoods";
import {
  neighborhoodById,
  neighborhoodByNameQuery,
} from "./utils/regionLookup";
import {
  pushCappedId,
  pushCappedItem,
  toggleCappedId,
  toggleCappedItem,
} from "./utils/compareList";
import { getDynamicScore } from "./utils/dynamicScore";
import { downloadHexCsv } from "./utils/exportHexCsv";
import { useMapCamera, useNegocioHexData } from "./hooks/useNegocioMap";
import { useNearbyPlaces } from "./hooks/useNearbyPlaces";
import {
  buildImovelLayers,
  buildNegocioLayers,
  mapPaneClassName,
} from "./map/buildMapLayers";

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
import {
  resolveCompareRegion,
  type CompareRegionPoint,
} from "../lib/negocio/compareRegions";
import ZillowTopNav from "./components/zillow/ZillowTopNav";
import ZillowFilterBar from "./components/zillow/ZillowFilterBar";
import {
  ADVANCED_FILTER_OPEN,
  type AdvancedFilters,
} from "./components/zillow/FiltroSheet";
import ZillowSideRail, {
  ZillowMobileTabBar,
  type SideRailTab,
} from "./components/zillow/ZillowSideRail";
import type { FrequentPlace, LatLng, RouteLeg } from "./services/routing";
import type { NearbyPlace } from "./services/nearbyPlaces";
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
import MapNearbyLegend from "./components/map/MapNearbyLegend";
import MapPinListingsCard from "./components/map/MapPinListingsCard";
import ModeTransitionOverlay from "./components/map/ModeTransitionOverlay";
import {
  MARKETPLACE_LISTINGS,
  type MarketplaceListing,
} from "./data/marketplaceListings";
export default function App() {
  const [appMode] = useState<AppMode>("negocio");
  const [imovelTool, setImovelTool] = useState<ImovelTool>("orcamento");
  const [, setActiveNeighborhood] = useState<Neighborhood | null>(null);
  const [activeRegionId, setActiveRegionId] = useState<string | null>(null);
  const [compareBairros, setCompareBairros] = useState<Neighborhood[]>([]);
  const [compareRegionIds, setCompareRegionIds] = useState<string[]>([]);
  const [, setMatchHighlightIds] = useState<string[]>([]);
  const [budget, setBudget] = useState(500000);
  const [filterQuartos, setFilterQuartos] = useState(2);
  const [advancedFilters, setAdvancedFilters] =
    useState<AdvancedFilters>(ADVANCED_FILTER_OPEN);
  const [searchTrigger] = useState(0);
  const [propertyType, setPropertyType] =
    useState<PropertyType>("ponto_comercial");

  const [regionSheetOpen, setRegionSheetOpen] = useState(false);
  const [frequentPlaces, setFrequentPlaces] = useState<FrequentPlace[]>([]);
  const [routeLegs, setRouteLegs] = useState<RouteLeg[]>([]);
  const [routeOrigin, setRouteOrigin] = useState<LatLng | null>(null);
  const [routeOriginLabel, setRouteOriginLabel] = useState<string | null>(null);

  const nearby = useNearbyPlaces();
  const {
    nearbyCenter,
    setNearbyCenter,
    nearbyCenterLabel,
    setNearbyCenterLabel,
    nearbyPlaces,
    nearbyFilters,
    nearbyLoading,
    nearbySource,
    nearbyRadiusM,
    hoveredPoi,
    setHoveredPoi,
    clearNearby,
    setMapFocusPin,
    loadNearby,
  } = nearby;

  const [selectedListingId, setSelectedListingId] = useState<string | null>(
    null,
  );
  const [openMarketListingId, setOpenMarketListingId] = useState<string | null>(
    null,
  );
  const [marketplaceOpen, setMarketplaceOpen] = useState(false);
  const [sideRailTab, setSideRailTab] = useState<SideRailTab>("procurar");
  const [detailListingId, setDetailListingId] = useState<string | null>(null);
  const [pinCardOpen, setPinCardOpen] = useState(false);
  const [mapSize, setMapSize] = useState({ width: 0, height: 0 });
  const [marketplaceRegionId, setMarketplaceRegionId] = useState<string | null>(
    null,
  );
  const [, setMobilePane] = useState<"content" | "map">("map");
  const [panelOpen, setPanelOpen] = useState(false);
  const mapPaneRef = useRef<HTMLDivElement | null>(null);
  const [modeTransitionTo, setModeTransitionTo] = useState<AppMode | null>(
    null,
  );
  const [modeTransitionExiting, setModeTransitionExiting] = useState(false);
  const modeTransitionTimer = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => {
      setPanelOpen(mq.matches);
      setMobilePane(mq.matches ? "content" : "map");
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    return () => {
      if (modeTransitionTimer.current) clearTimeout(modeTransitionTimer.current);
    };
  }, []);

  useEffect(() => {
    const el = mapPaneRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      setMapSize({ width: Math.round(r.width), height: Math.round(r.height) });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [panelOpen, marketplaceOpen, appMode, imovelTool]);

  const [currentStyle, setCurrentStyle] =
    useState<keyof typeof MAP_STYLES>("voyager");
  const [activeSegment, setActiveSegment] = useState("food_service");
  const { viewState, setViewState, flyTo, flyToMid } = useMapCamera(appMode);
  const [viewMode, setViewMode] = useState<
    "single" | "top" | "compare" | "heatmap" | null
  >("heatmap");
  const [lastCoordinate, setLastCoordinate] = useState<LatLng | null>(null);
  const [compareLocations, setCompareLocations] = useState<
    CompareRegionPoint[]
  >([]);
  const [compareRunning, setCompareRunning] = useState(false);
  const [compareError, setCompareError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchError, setSearchError] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [colorMode, setColorMode] = useState<"total" | "ocean">("total");
  const [minHeatmapScore, setMinHeatmapScore] = useState(0);
  const [copied, setCopied] = useState(false);
  const [weightDemografia, setWeightDemografia] = useState(35);
  const [weightMercado, setWeightMercado] = useState(40);
  const [weightFluxo, setWeightFluxo] = useState(25);
  const [showSliders, setShowSliders] = useState(false);

  const weights = useMemo(
    () => ({
      demografia: weightDemografia,
      mercado: weightMercado,
      fluxo: weightFluxo,
    }),
    [weightDemografia, weightMercado, weightFluxo],
  );

  const scoreOf = (hex: any) => getDynamicScore(hex, weights);

  const {
    hexData,
    setHexData,
    loading,
    competitorPins,
    setCompetitorPins,
    addressMap,
    searchHistory,
  } = useNegocioHexData({
    appMode,
    viewMode,
    activeSegment,
    lastCoordinate,
    compareLocations,
    weights,
  });

  const openContent = () => {
    setPanelOpen(true);
    setMobilePane("content");
  };

  const bindRegion = (id: string) => {
    setActiveRegionId(id);
    setActiveNeighborhood(neighborhoodById(id) ?? null);
  };

  const focusRegionOnMap = (
    id: string,
    opts: { zoom?: number; sheet?: boolean; pin?: boolean } = {},
  ) => {
    const region = getRegionByIdSync(id);
    if (!region) return false;
    bindRegion(id);
    if (opts.sheet !== false) setRegionSheetOpen(true);
    if (opts.pin !== false) setMapFocusPin(region.lat, region.lng, region.name);
    flyTo(region.lat, region.lng, opts.zoom ?? 14.2);
    return true;
  };

  const selectNeighborhood = (n: Neighborhood) => {
    setActiveNeighborhood(n);
    setActiveRegionId(n.id);
    setImovelTool("explorar");
    setRegionSheetOpen(true);
    setPinCardOpen(false);
    flyTo(n.lat, n.lng, 14.2);
    setMapFocusPin(n.lat, n.lng, n.name);
  };

  const selectRegion = (id: string) => {
    if (!focusRegionOnMap(id, { zoom: 14.2 })) return;
    setImovelTool("explorar");
    setPinCardOpen(false);
  };

  const clearRegion = () => {
    setActiveRegionId(null);
    setActiveNeighborhood(null);
    setRegionSheetOpen(false);
    setPinCardOpen(false);
    clearNearby();
  };

  const openRegionMarketplace = (regionId: string | null, label?: string) => {
    if (!regionId) return;
    const region = getRegionByIdSync(regionId);
    setMarketplaceRegionId(regionId);
    setActiveRegionId(regionId);
    setNearbyCenterLabel(label || region?.name || nearbyCenterLabel);
    setPinCardOpen(true);
    setRegionSheetOpen(true);
    setMarketplaceOpen(true);
    setSideRailTab("procurar");
    openContent();
    if (region && !nearbyCenter) {
      setMapFocusPin(region.lat, region.lng, region.name);
      flyTo(region.lat, region.lng, 13.8);
    }
  };

  const openListingDetail = (listing: MarketplaceListing) => {
    setSelectedListingId(listing.id);
    setDetailListingId(listing.id);
    setOpenMarketListingId(listing.id);
    setSideRailTab("procurar");
    setMarketplaceOpen(false);
    setPanelOpen(false);
    setPinCardOpen(false);
    bindRegion(listing.regionId);
    setRegionSheetOpen(false);
    flyTo(listing.lat, listing.lng, 14.2);
    void loadNearby(listing.lat, listing.lng, listing.title);
  };

  const selectMapPoint = (lat: number, lng: number) => {
    const nearest = findNearestRegion(lat, lng);
    bindRegion(nearest.id);
    setRegionSheetOpen(false);
    setPinCardOpen(true);
    setSideRailTab("procurar");
    setMarketplaceOpen(false);
    setPanelOpen(false);
    setSelectedListingId(null);
    void loadNearby(lat, lng, nearest.name);
    flyTo(lat, lng, 14.2);
  };

  const previewRegion = (id: string) => {
    if (!focusRegionOnMap(id, { zoom: 13.8 })) return;
    openContent();
  };

  const runNegocioCompare = async (textA: string, textB: string) => {
    setCompareError("");
    setCompareRunning(true);
    try {
      const [a, b] = await Promise.all([
        resolveCompareRegion(textA),
        resolveCompareRegion(textB),
      ]);
      if (!a || !b) {
        setCompareError(
          "Não encontramos uma ou ambas as regiões. Use bairros de Salvador ou Lauro de Freitas.",
        );
        return;
      }
      if (a.neighborhoodId === b.neighborhoodId) {
        setCompareError("Escolha duas regiões diferentes para comparar.");
        return;
      }
      setCompareLocations([a, b]);
      setViewMode("compare");
      setCompetitorPins([]);
      setHexData([]);
      flyToMid(a, b);
    } finally {
      setCompareRunning(false);
    }
  };

  const resetNegocioCompare = () => {
    setCompareLocations([]);
    setHexData([]);
    setCompetitorPins([]);
    setCompareError("");
    setViewMode("compare");
  };

  const addCompareBairro = (n: Neighborhood) => {
    setCompareBairros((prev) => pushCappedItem(prev, n));
    setCompareRegionIds((prev) => pushCappedId(prev, n.id));
    flyTo(n.lat, n.lng, 13.5);
  };

  const removeCompareBairro = (id: string) => {
    setCompareBairros((prev) => prev.filter((x) => x.id !== id));
    setCompareRegionIds((prev) => prev.filter((x) => x !== id));
  };

  const toggleCompareRegion = (id: string) => {
    setCompareRegionIds((prev) => toggleCappedId(prev, id));
    const n = neighborhoodById(id);
    if (n) setCompareBairros((prev) => toggleCappedItem(prev, n));
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
      const local = neighborhoodByNameQuery(searchQuery);
      if (local) {
        selectNeighborhood(local);
        setSearchQuery("");
        setIsSearching(false);
        return;
      }
    }

    try {
      const res = await fetch(
        `/api/geo/geocode?q=${encodeURIComponent(searchQuery)}&limit=1`,
        { headers: { Accept: "application/json" } },
      );
      const data = (await res.json()) as {
        hits?: { lat: number; lng: number; name: string }[];
      };
      const hit = data.hits?.[0];
      if (!hit) {
        setSearchError("Endereço não encontrado.");
        setTimeout(() => setSearchError(""), 4000);
        return;
      }
      flyTo(hit.lat, hit.lng, 15);
      if (appMode === "imovel") {
        selectNeighborhood(findNearestNeighborhood(hit.lat, hit.lng));
      } else {
        setLastCoordinate({ lat: hit.lat, lng: hit.lng });
        setViewMode("single");
      }
      setSearchQuery("");
    } catch {
      setSearchError("Erro na geolocalização.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleMapClick = (info: any) => {
    if (appMode === "imovel") {
      const listing = info.object as MarketplaceListing | undefined;
      if (
        listing?.price != null &&
        listing?.regionId &&
        listing?.id?.startsWith("mkt-")
      ) {
        openListingDetail(listing);
        return;
      }

      const poi = info.object as NearbyPlace | undefined;
      if (poi?.category && poi?.id) {
        setHoveredPoi(poi);
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
        toggleCompareRegion(findNearestRegion(lat, lng).id);
        return;
      }

      setSelectedListingId(null);
      setOpenMarketListingId(null);
      selectMapPoint(lat, lng);
      return;
    }

    if (!info.coordinate || viewMode === "compare") return;
    const [lng, lat] = info.coordinate;
    setLastCoordinate({ lat, lng });
    setViewMode("single");
  };

  const handleExportCSV = () => {
    downloadHexCsv(
      hexData,
      addressMap,
      weights,
      viewMode === "heatmap" ? minHeatmapScore : undefined,
    );
  };

  const handleShare = () => {
    try {
      const url = typeof window !== "undefined" ? window.location.href : "";
      if (navigator.clipboard) void navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const visibleHexData =
    viewMode === "heatmap"
      ? hexData.filter((d) => scoreOf(d) >= minHeatmapScore)
      : hexData;

  const layers = useMemo(() => {
    if (appMode === "imovel") {
      return buildImovelLayers({
        nearbyCenter,
        nearbyPlaces,
        nearbyFilters,
        nearbyRadiusM,
        routeOrigin,
        routeLegs,
        selectedListingId,
        activeRegionId,
      });
    }
    return buildNegocioLayers({
      visibleHexData,
      competitorPins,
      colorMode,
      weights,
    });
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
    detailListingId,
    activeRegionId,
    visibleHexData,
    competitorPins,
    colorMode,
    weights,
  ]);

  const showPinCard =
    appMode === "imovel" &&
    pinCardOpen &&
    nearbyCenter &&
    !detailListingId &&
    imovelTool !== "rotas" &&
    !(mapSize.width > 0 && mapSize.width < 768 && regionSheetOpen) &&
    !(regionSheetOpen && marketplaceOpen);

  const mapPane = (
    <div
      ref={mapPaneRef}
      className={mapPaneClassName({
        panelOpen,
        marketplaceOpen,
        sideRailTab,
        pinCardOpen,
        imovelTool,
      })}
    >
      <DeckGL
        viewState={viewState}
        onViewStateChange={(e: any) => setViewState(e.viewState)}
        controller={{
          dragPan: true,
          scrollZoom: true,
          doubleClickZoom: true,
          touchZoom: true,
          touchRotate: appMode !== "imovel",
          dragRotate: appMode !== "imovel",
          keyboard: true,
        }}
        onClick={handleMapClick}
        onHover={(info: any) => {
          if (appMode !== "imovel" || nearbyPlaces.length === 0) {
            if (hoveredPoi) setHoveredPoi(null);
            return;
          }
          if (info.layer?.id === "nearby-pois-icons" && info.object) {
            setHoveredPoi(info.object as NearbyPlace);
          } else if (!info.object) {
            setHoveredPoi(null);
          }
        }}
        layers={layers as any}
        getCursor={({ isDragging }: any) =>
          isDragging ? "grabbing" : "grab"
        }
        style={{ width: "100%", height: "100%", touchAction: "none" }}
      >
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <Map mapStyle={MAP_STYLES[currentStyle].url as any} />
      </DeckGL>

      <div className="absolute z-10 safe-map-controls">
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
                  openContent();
                }
              : undefined
          }
          tempoDeslocamentoActive={
            appMode === "imovel" && imovelTool === "rotas"
          }
        />
      </div>

      {appMode === "negocio" && (
        <div className="pointer-events-none absolute bottom-3 left-3 z-20 max-w-[220px] rounded-xl border border-[#d1d1d5] bg-white/95 px-3 py-2 shadow-md backdrop-blur-sm">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#6a6a72]">
            Mapa H3 Uber
          </p>
          <p className="mt-0.5 text-[11px] font-semibold text-[#0a0a0b]">
            Scores reais do banco ConverGeo
          </p>
          <div className="mt-1.5 flex items-center gap-2 text-[10px] font-semibold">
            <span className="inline-flex items-center gap-1 text-emerald-600">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Alta
            </span>
            <span className="inline-flex items-center gap-1 text-amber-600">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              Média
            </span>
            <span className="inline-flex items-center gap-1 text-rose-600">
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              Baixa
            </span>
          </div>
        </div>
      )}

      {showPinCard && nearbyCenter && (
        <MapPinListingsCard
          lat={nearbyCenter.lat}
          lng={nearbyCenter.lng}
          regionId={activeRegionId}
          regionName={nearbyCenterLabel}
          viewState={viewState}
          mapSize={mapSize}
          onSelect={openListingDetail}
          onClose={() => {
            setPinCardOpen(false);
            setNearbyCenter(null);
            setNearbyCenterLabel(null);
          }}
          onSeeAll={() =>
            openRegionMarketplace(
              activeRegionId,
              nearbyCenterLabel || undefined,
            )
          }
          onOpenNeighborhood={() => {
            setRegionSheetOpen(true);
            if (mapSize.width > 0 && mapSize.width < 768) setPinCardOpen(false);
          }}
        />
      )}

      {appMode === "imovel" &&
        nearbyCenter &&
        (nearbyLoading || nearbyPlaces.length > 0) && (
          <div className="pointer-events-none absolute right-2 top-3 z-20 sm:right-3 sm:top-4">
            <div className="rounded-full border border-[#d1d1d5] bg-white/95 px-2.5 py-1 text-[10px] font-bold shadow-md backdrop-blur-sm">
              {nearbyLoading && !nearbyPlaces.length ? (
                <span className="text-[#006aff]">
                  Buscando no OpenStreetMap…
                </span>
              ) : nearbySource === "osm" ? (
                <span className="text-[#1a7f37]">Dados: OpenStreetMap</span>
              ) : nearbySource === "backend" ? (
                <span className="text-[#006aff]">Dados: motor Python</span>
              ) : (
                <span className="text-[#b45309]">
                  Estimativa (OSM indisponível)
                </span>
              )}
            </div>
          </div>
        )}

      {appMode === "imovel" &&
        !detailListingId &&
        nearbyPlaces.length > 0 && (
          <MapNearbyLegend active={hoveredPoi} className="top-14 sm:top-16" />
        )}

      {appMode === "imovel" && (
        <MarketplaceMapTrigger
          hidden={marketplaceOpen && panelOpen}
          onRequestOpen={() => {
            setMarketplaceOpen(true);
            setSideRailTab("procurar");
            openContent();
          }}
        />
      )}

      {appMode === "imovel" && regionSheetOpen && imovelTool !== "rotas" && (
        <RegionHexSheet
          regionId={activeRegionId}
          onClose={() => setRegionSheetOpen(false)}
          onOpenFull={(id) => {
            selectRegion(id);
            openContent();
          }}
        />
      )}

      <ModeTransitionOverlay
        targetMode={modeTransitionTo}
        exiting={modeTransitionExiting}
      />
    </div>
  );

  const openSideTab = (tab: SideRailTab) => {
    setSideRailTab(tab);
    openContent();
    setMarketplaceOpen(false);
    if (tab === "procurar") setImovelTool("orcamento");
  };

  const closeSidePanel = () => {
    setPanelOpen(false);
    setMobilePane("map");
  };

  const switchAppMode = (_mode: AppMode) => {
    // MVP: somente Abrir meu Negócio. Comprar/imobiliária desativados.
  };

  const panelWidthClass =
    marketplaceOpen && appMode === "imovel" && sideRailTab === "procurar"
      ? "w-full lg:w-[560px] lg:max-w-[560px]"
      : "w-full lg:w-[340px] lg:max-w-[340px]";

  const panelHeightClass = !panelOpen
    ? "hidden"
    : marketplaceOpen && sideRailTab === "procurar" && pinCardOpen
      ? "flex max-lg:h-[48%] max-lg:flex-none lg:h-full"
      : marketplaceOpen && sideRailTab === "procurar"
        ? "flex max-lg:h-full max-lg:flex-1 max-lg:rounded-none max-lg:shadow-none lg:h-full"
        : imovelTool === "explorar"
          ? "flex max-lg:h-[54%] max-lg:flex-none lg:h-full"
          : "flex max-lg:h-[60%] max-lg:flex-none lg:h-full";

  const detail = detailListingId
    ? MARKETPLACE_LISTINGS.find((l) => l.id === detailListingId)
    : null;

  return (
    <main className="flex h-dvh max-h-dvh w-full max-w-[100vw] flex-col overflow-hidden bg-white print:h-auto print:overflow-visible">
      <ZillowTopNav
        appMode={appMode}
        setAppMode={switchAppMode}
        transitioning={Boolean(modeTransitionTo)}
      />

      {appMode === "imovel" && (
        <ZillowFilterBar
          tool={imovelTool}
          setTool={(t) => {
            setImovelTool(t);
            openContent();
          }}
          filters={advancedFilters}
          setFilters={setAdvancedFilters}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onSearch={(e) => {
            setMobilePane("content");
            void handleAddressSearch(e);
          }}
          isSearching={isSearching}
        />
      )}

      {searchError && (
        <p className="border-b border-rose-100 bg-rose-50 px-4 py-1.5 text-xs font-semibold text-rose-600">
          {searchError}
        </p>
      )}

      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-[#e8e8ed] lg:flex-row">
        {appMode === "imovel" && (
          <ZillowSideRail active={sideRailTab} onChange={openSideTab} />
        )}

        <div
          className={`relative z-20 order-2 min-h-0 flex-col bg-white shadow-[0_-6px_24px_rgba(0,0,0,0.12)] max-lg:rounded-t-2xl lg:order-1 lg:rounded-none lg:shadow-none ${panelHeightClass} lg:shrink-0 ${panelWidthClass}`}
        >
          {!(
            marketplaceOpen &&
            sideRailTab === "procurar" &&
            !pinCardOpen
          ) && (
            <button
              type="button"
              onClick={closeSidePanel}
              className="flex w-full shrink-0 flex-col items-center gap-1 border-b border-[#eef0f3] px-3 pb-1.5 pt-2 lg:hidden"
              aria-label="Recolher painel e ver mapa"
            >
              <span className="h-1 w-10 rounded-full bg-[#c8c8d0]" />
              <span className="text-[10px] font-semibold text-[#8a8a93]">
                Toque para ver o mapa inteiro
              </span>
            </button>
          )}

          <aside
            className={`flex min-h-0 w-full flex-1 flex-col bg-white print:max-w-none print:border-none lg:border-r lg:border-[#d1d1d5] ${
              marketplaceOpen &&
              appMode === "imovel" &&
              sideRailTab === "procurar"
                ? "overflow-hidden"
                : "overflow-y-auto overscroll-contain custom-scrollbar pb-4 lg:pb-3"
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
                body="Mensagens de corretores e alertas do Sino Analytics aparecem aqui."
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
                onOpenDetail={openListingDetail}
                onClose={() => {
                  setMarketplaceOpen(false);
                  setMarketplaceRegionId(null);
                  setOpenMarketListingId(null);
                  setSelectedListingId(null);
                  setDetailListingId(null);
                  setSideRailTab("procurar");
                  if (
                    typeof window !== "undefined" &&
                    !window.matchMedia("(min-width: 1024px)").matches &&
                    !pinCardOpen
                  ) {
                    setPanelOpen(false);
                    setMobilePane("map");
                  }
                }}
                budget={budget}
                quartos={filterQuartos}
                advancedFilters={advancedFilters}
                setAdvancedFilters={setAdvancedFilters}
                regionFilterId={marketplaceRegionId}
                regionFilterLabel={
                  marketplaceRegionId
                    ? getRegionByIdSync(marketplaceRegionId)?.name ||
                      nearbyCenterLabel
                    : null
                }
                onClearRegionFilter={() => setMarketplaceRegionId(null)}
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
                  advancedAmenities={advancedFilters.amenities}
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
                    const n = neighborhoodById(suggestion.neighborhoodId);
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
                  onRunCompare={runNegocioCompare}
                  compareRunning={compareRunning}
                  compareError={compareError}
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
                    getDynamicScore={scoreOf}
                    handlePrintPDF={() => window.print()}
                    handleResetCompare={resetNegocioCompare}
                    handleShare={handleShare}
                    copied={copied}
                    loading={loading || compareRunning}
                  />
                ) : hexData.length === 1 && viewMode === "single" ? (
                  <ViewSingle
                    hexData={hexData}
                    addressMap={addressMap}
                    getDynamicScore={scoreOf}
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
                    getDynamicScore={scoreOf}
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

          <button
            type="button"
            onClick={closeSidePanel}
            className="absolute right-0 top-1/2 z-40 hidden h-14 w-7 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full border border-[#d1d1d5] bg-white text-[#006aff] shadow-md transition hover:bg-[#e8f1ff] hover:shadow-lg lg:flex"
            title="Recolher painel"
            aria-label="Recolher painel"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
            >
              <path
                d="M15 6 9 12l6 6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {mapPane}

        {!panelOpen && (
          <button
            type="button"
            onClick={openContent}
            className={`absolute z-40 flex items-center justify-center border border-[#d1d1d5] bg-[#0a1220] text-white shadow-lg transition hover:bg-[#122038] max-lg:bottom-4 max-lg:left-1/2 max-lg:-translate-x-1/2 max-lg:gap-1.5 max-lg:rounded-full max-lg:px-2.5 max-lg:py-1.5 lg:top-1/2 lg:h-14 lg:w-7 lg:-translate-y-1/2 lg:rounded-full lg:border-[#d1d1d5] lg:bg-white lg:text-[#006aff] lg:shadow-md lg:hover:bg-[#e8f1ff] ${
              appMode === "imovel" ? "lg:left-[68px]" : "lg:left-2"
            }`}
            title="Abrir painel"
            aria-label="Abrir painel"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4 max-lg:hidden"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
            >
              <path
                d="m9 6 6 6-6 6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <svg
              viewBox="0 0 24 24"
              className="h-3.5 w-3.5 lg:hidden"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
            >
              <path
                d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"
                strokeLinecap="round"
              />
            </svg>
            <span className="text-[11px] font-bold lg:hidden">Menu</span>
          </button>
        )}
      </div>

      {appMode === "imovel" && (
        <ZillowMobileTabBar active={sideRailTab} onChange={openSideTab} />
      )}

      {detail && (
        <PropertyDetailOverlay
          listing={detail}
          nearbyPlaces={nearbyPlaces}
          nearbyLoading={nearbyLoading}
          onClose={() => {
            setDetailListingId(null);
            setHoveredPoi(null);
          }}
          onAskSino={() => {
            setDetailListingId(null);
            setHoveredPoi(null);
            setImovelTool("explorar");
            setSideRailTab("procurar");
            setMobilePane("content");
          }}
        />
      )}
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
    <div className="flex min-h-full flex-1 flex-col items-start justify-center gap-2 bg-white p-6 animate-fade-in">
      <h2 className="text-xl font-bold text-[#2a2a33]">{title}</h2>
      <p className="max-w-sm text-sm leading-relaxed text-[#6a6a72]">{body}</p>
      <p className="mt-2 text-xs font-semibold text-[#006aff]">
        Em breve no ConverGeo
      </p>
    </div>
  );
}
