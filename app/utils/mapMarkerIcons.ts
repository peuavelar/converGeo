/** Ícones de mapa (SVG data-URL) — badges modernos, sem bolas. */

export type MapIconDef = {
  url: string;
  width: number;
  height: number;
  anchorY: number;
};

function svgDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** Badge arredondado com pictograma branco. */
function categoryBadge(
  fill: string,
  pictogram: string,
  size = 56,
): MapIconDef {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <filter id="sh" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="1.5" stdDeviation="1.8" flood-color="#0a1220" flood-opacity="0.22"/>
    </filter>
  </defs>
  <rect x="3" y="3" width="${size - 6}" height="${size - 6}" rx="14" fill="${fill}" stroke="#fff" stroke-width="3" filter="url(#sh)"/>
  ${pictogram}
</svg>`;
  return {
    url: svgDataUrl(svg),
    width: size,
    height: size,
    anchorY: size / 2,
  };
}

const CROSS = `<g fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round">
  <path d="M28 16v24M16 28h24"/>
</g>`;

const UTENSILS = `<g fill="none" stroke="#fff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">
  <path d="M20 16v10a4 4 0 0 0 4 4v10"/>
  <path d="M20 16c0 4 4 4 4 10"/>
  <path d="M18 16h4"/>
  <path d="M34 16v24"/>
  <path d="M30 16h8v6a4 4 0 0 1-4 4h0"/>
</g>`;

const SHIELD = `<g fill="none" stroke="#fff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">
  <path d="M28 12l14 6v8c0 9-6.5 15-14 18-7.5-3-14-9-14-18v-8l14-6z"/>
  <path d="M28 22v10M24 27h8"/>
</g>`;

const SCHOOL = `<g fill="none" stroke="#fff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">
  <path d="M10 26l18-8 18 8-18 8-18-8z"/>
  <path d="M18 30v8c0 2.5 4 5 10 5s10-2.5 10-5v-8"/>
  <path d="M46 26v12"/>
</g>`;

export const NEARBY_MAP_ICONS = {
  restaurante: categoryBadge("#e24b4b", UTENSILS),
  hospital: categoryBadge("#0d9f6e", CROSS),
  delegacia: categoryBadge("#2563eb", SHIELD),
  escola: categoryBadge("#ea8814", SCHOOL),
} as const;

/** Pin de seleção (clique no mapa) — teardrop limpo. */
export const MAP_CLICK_PIN: MapIconDef = (() => {
  const size = 48;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${Math.round(size * 1.35)}" viewBox="0 0 48 65">
  <defs>
    <filter id="sh" x="-25%" y="-15%" width="150%" height="150%">
      <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#0a1220" flood-opacity="0.28"/>
    </filter>
  </defs>
  <path d="M24 62s-18-17.5-18-34a18 18 0 1 1 36 0c0 16.5-18 34-18 34z" fill="#006aff" stroke="#fff" stroke-width="2.5" filter="url(#sh)"/>
  <circle cx="24" cy="24" r="7.5" fill="#fff"/>
  <circle cx="24" cy="24" r="3.2" fill="#006aff"/>
</svg>`;
  return {
    url: svgDataUrl(svg),
    width: size,
    height: Math.round(size * 1.35),
    anchorY: Math.round(size * 1.35),
  };
})();

/** Destino de rota / ponto frequente. */
export const ROUTE_DEST_ICON: MapIconDef = categoryBadge(
  "#006aff",
  `<g fill="none" stroke="#fff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="28" cy="26" r="8"/>
  <path d="M28 18v16M20 26h16"/>
</g>`,
  48,
);

export const ROUTE_ORIGIN_ICON: MapIconDef = (() => {
  const size = 44;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <filter id="sh" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" flood-color="#0a1220" flood-opacity="0.25"/>
    </filter>
  </defs>
  <circle cx="22" cy="22" r="14" fill="#fff" stroke="#006aff" stroke-width="3.5" filter="url(#sh)"/>
  <circle cx="22" cy="22" r="6" fill="#006aff"/>
</svg>`;
  return {
    url: svgDataUrl(svg),
    width: size,
    height: size,
    anchorY: size / 2,
  };
})();
