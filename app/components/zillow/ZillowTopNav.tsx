"use client";

import type { AppMode } from "../../utils/realEstate";

type Props = {
  appMode?: AppMode;
  setAppMode?: (mode: AppMode) => void;
  /** Bloqueia clique enquanto o mapa troca de modo. */
  transitioning?: boolean;
};

function GeoLogoIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      aria-hidden
      fill="none"
    >
      <rect width="32" height="32" rx="8" fill="#0a0a0b" />
      <path
        d="M16 7.5c-3.4 0-6.1 2.6-6.1 5.9 0 4.4 5.2 9.7 5.7 10.2a.6.6 0 0 0 .8 0c.5-.5 5.7-5.8 5.7-10.2 0-3.3-2.7-5.9-6.1-5.9Z"
        fill="white"
      />
      <circle cx="16" cy="13.2" r="2.35" fill="#0a0a0b" />
      <circle
        cx="16"
        cy="13.2"
        r="3.6"
        stroke="white"
        strokeWidth="1.1"
        strokeOpacity="0.4"
      />
    </svg>
  );
}

export default function ZillowTopNav({ transitioning = false }: Props) {
  return (
    <header className="safe-pt relative z-30 grid h-11 shrink-0 grid-cols-[1fr_auto_1fr] items-center border-b border-[#e6e6ea] bg-white px-3 md:h-12 md:px-4">
      <div className="flex shrink-0 items-center gap-1.5 justify-self-start md:gap-2">
        <GeoLogoIcon className="h-6 w-6 shrink-0 md:h-7 md:w-7" />
        <span className="text-sm font-bold tracking-tight text-[#0a0a0b] md:text-[15px]">
          ConverGeo
        </span>
      </div>

      <div className="justify-self-center rounded-full bg-[#f4f4f5] px-3 py-1">
        <p
          className="text-[10px] font-semibold text-[#0a0a0b] md:text-xs"
          aria-busy={transitioning}
        >
          Abrir meu Negócio
        </p>
      </div>

      <div className="flex shrink-0 items-center justify-end gap-1 justify-self-end md:gap-1.5">
        <button
          type="button"
          className="hidden rounded-full px-2.5 py-1 text-xs font-medium text-[#3a3a42] hover:bg-[#f4f4f5] hover:text-[#0a0a0b] md:inline-flex"
        >
          Ajuda
        </button>
        <button
          type="button"
          className="rounded-full bg-[#0a0a0b] px-2.5 py-1 text-[10px] font-semibold text-white transition hover:bg-[#1c1c1f] active:scale-[0.98] md:px-3 md:py-1 md:text-xs"
        >
          Entrar
        </button>
      </div>
    </header>
  );
}
