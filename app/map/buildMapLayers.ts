import { H3HexagonLayer } from "@deck.gl/geo-layers";
import {
  ScatterplotLayer,
  PathLayer,
  PolygonLayer,
  TextLayer,
  IconLayer,
} from "@deck.gl/layers";
import { radiusCirclePolygon } from "../services/nearbyPlaces";
import type { NearbyFilters, NearbyPlace } from "../services/nearbyPlaces";
import type { LatLng, RouteLeg } from "../services/routing";
import {
  MARKETPLACE_LISTINGS,
  marketplacePriceLabel,
  type MarketplaceListing,
} from "../data/marketplaceListings";
import {
  MAP_CLICK_PIN,
  NEARBY_MAP_ICONS,
  ROUTE_DEST_ICON,
  ROUTE_ORIGIN_ICON,
} from "../utils/mapMarkerIcons";
import { getDynamicScore, type ScoreWeights } from "../utils/dynamicScore";

type ImovelLayerOpts = {
  nearbyCenter: LatLng | null;
  nearbyPlaces: NearbyPlace[];
  nearbyFilters: NearbyFilters;
  nearbyRadiusM: number;
  routeOrigin: LatLng | null;
  routeLegs: RouteLeg[];
  selectedListingId: string | null;
  activeRegionId: string | null;
};

export function buildImovelLayers(o: ImovelLayerOpts) {
  const layers: unknown[] = [];

  if (o.nearbyCenter) {
    layers.push(
      new IconLayer({
        id: "map-click-pin",
        data: [o.nearbyCenter],
        pickable: false,
        getPosition: (d: LatLng) => [d.lng, d.lat],
        getIcon: () => MAP_CLICK_PIN,
        getSize: 40,
        sizeUnits: "pixels",
        sizeMinPixels: 28,
        sizeMaxPixels: 48,
        billboard: true,
      }),
    );

    if (o.nearbyPlaces.length > 0) {
      layers.push(
        new PolygonLayer({
          id: "nearby-radius",
          data: [
            {
              polygon: radiusCirclePolygon(
                o.nearbyCenter.lat,
                o.nearbyCenter.lng,
                o.nearbyRadiusM,
              ),
            },
          ],
          pickable: false,
          stroked: true,
          filled: true,
          getPolygon: (d: { polygon: [number, number][] }) => d.polygon,
          getFillColor: [0, 106, 255, 22],
          getLineColor: [0, 106, 255, 140],
          lineWidthMinPixels: 1.5,
        }),
        new IconLayer({
          id: "nearby-pois-icons",
          data: o.nearbyPlaces.filter((p) => o.nearbyFilters[p.category]),
          pickable: true,
          getPosition: (d: NearbyPlace) => [d.lng, d.lat],
          getIcon: (d: NearbyPlace) => NEARBY_MAP_ICONS[d.category],
          getSize: 34,
          sizeUnits: "pixels",
          sizeMinPixels: 26,
          sizeMaxPixels: 42,
          billboard: true,
          updateTriggers: {
            getIcon: [JSON.stringify(o.nearbyFilters)],
            data: [o.nearbyPlaces.length, JSON.stringify(o.nearbyFilters)],
          },
        }),
      );
    }
  }

  if (o.routeOrigin) {
    layers.push(
      new IconLayer({
        id: "route-origin",
        data: [o.routeOrigin],
        pickable: false,
        getPosition: (d: LatLng) => [d.lng, d.lat],
        getIcon: () => ROUTE_ORIGIN_ICON,
        getSize: 32,
        sizeUnits: "pixels",
        billboard: true,
      }),
    );
  }

  if (o.routeLegs.length) {
    layers.push(
      new PathLayer({
        id: "frequent-routes",
        data: o.routeLegs,
        pickable: true,
        widthMinPixels: 4,
        getPath: (d: RouteLeg) => d.path,
        getColor: (d: RouteLeg) => [...d.color, 220],
        getWidth: 5,
      }),
      new IconLayer({
        id: "frequent-destinations",
        data: o.routeLegs,
        pickable: true,
        getPosition: (d: RouteLeg) => d.path[d.path.length - 1],
        getIcon: () => ROUTE_DEST_ICON,
        getSize: 32,
        sizeUnits: "pixels",
        billboard: true,
      }),
    );
  }

  layers.push(
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
      getColor: (d: MarketplaceListing) => {
        if (d.id === o.selectedListingId) return [255, 255, 255, 255];
        if (o.activeRegionId && d.regionId !== o.activeRegionId) {
          return [90, 90, 98, 200];
        }
        return [34, 34, 34, 255];
      },
      getBackgroundColor: (d: MarketplaceListing) => {
        if (d.id === o.selectedListingId) return [0, 106, 255, 255];
        if (o.activeRegionId && d.regionId === o.activeRegionId) {
          return [255, 255, 255, 255];
        }
        if (o.activeRegionId) return [245, 245, 247, 220];
        return [255, 255, 255, 255];
      },
      getBorderColor: (d: MarketplaceListing) => {
        if (d.id === o.selectedListingId) return [0, 88, 214, 255];
        if (o.activeRegionId && d.regionId === o.activeRegionId) {
          return [0, 106, 255, 200];
        }
        return [220, 220, 225, 255];
      },
      getBorderWidth: 1,
      updateTriggers: {
        getColor: [o.selectedListingId, o.activeRegionId],
        getBackgroundColor: [o.selectedListingId, o.activeRegionId],
        getBorderColor: [o.selectedListingId, o.activeRegionId],
      },
    }),
  );

  return layers;
}

type NegocioLayerOpts = {
  visibleHexData: any[];
  competitorPins: LatLng[];
  colorMode: "total" | "ocean";
  weights: ScoreWeights;
};

export function buildNegocioLayers(o: NegocioLayerOpts) {
  const { demografia, mercado, fluxo } = o.weights;
  const score = (d: any) => getDynamicScore(d, o.weights);

  return [
    new H3HexagonLayer({
      id: "h3-hexagon-layer",
      data: o.visibleHexData,
      pickable: true,
      extruded: true,
      elevationScale: 50,
      stroked: true,
      filled: true,
      lineWidthMinPixels: 1,
      coverage: 0.95,
      getHexagon: (d: any) => d.h3_index,
      getElevation: (d: any) => score(d) * 10,
      getFillColor: (d: any) => {
        if (o.colorMode === "ocean") {
          const s = d.breakdown?.macroeconomico || 0;
          if (s >= 7) return [14, 165, 233, 200];
          if (s >= 4) return [168, 85, 247, 200];
          return [239, 68, 68, 200];
        }
        const s = score(d);
        if (s >= 7) return [16, 185, 129, 200];
        if (s >= 4) return [245, 158, 11, 200];
        return [239, 68, 68, 200];
      },
      getLineColor: () => [255, 255, 255, 50],
      updateTriggers: {
        getElevation: [demografia, mercado, fluxo],
        getFillColor: [demografia, mercado, fluxo, o.colorMode],
      },
    }),
    new ScatterplotLayer({
      id: "competitor-pins-layer",
      data: o.competitorPins,
      pickable: false,
      opacity: 0.8,
      stroked: true,
      filled: true,
      radiusScale: 10,
      radiusMinPixels: 3,
      radiusMaxPixels: 10,
      lineWidthMinPixels: 1,
      getPosition: (d: LatLng) => [d.lng, d.lat],
      getFillColor: [239, 68, 68],
      getLineColor: [255, 255, 255],
    }),
  ];
}

/** Classes do painel do mapa (mobile/desktop). */
export function mapPaneClassName(opts: {
  panelOpen: boolean;
  marketplaceOpen: boolean;
  sideRailTab: string;
  pinCardOpen: boolean;
  imovelTool: string;
}) {
  const base =
    "map-touch relative min-h-0 min-w-0 bg-[#e8e8ed] order-1 lg:order-2";
  const { panelOpen, marketplaceOpen, sideRailTab, pinCardOpen, imovelTool } =
    opts;

  if (panelOpen && marketplaceOpen && sideRailTab === "procurar" && !pinCardOpen) {
    return `${base} hidden lg:flex lg:flex-1`;
  }
  if (panelOpen && pinCardOpen && marketplaceOpen) {
    return `${base} flex max-lg:h-[52%] max-lg:flex-none lg:flex-1`;
  }
  if (panelOpen && imovelTool === "explorar") {
    return `${base} flex max-lg:h-[46%] max-lg:flex-none lg:flex-1`;
  }
  if (panelOpen) {
    return `${base} flex max-lg:h-[40%] max-lg:flex-none lg:flex-1`;
  }
  return `${base} flex flex-1`;
}
