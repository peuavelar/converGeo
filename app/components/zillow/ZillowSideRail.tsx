"use client";

import type { ReactNode } from "react";

export type SideRailTab =
  | "procurar"
  | "atualizacoes"
  | "favoritos"
  | "plano"
  | "inbox";

type Props = {
  active: SideRailTab;
  onChange: (tab: SideRailTab) => void;
};

const ITEMS: {
  id: SideRailTab;
  label: string;
  icon: (active: boolean) => ReactNode;
}[] = [
  {
    id: "procurar",
    label: "Procurar",
    icon: (active) => (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden>
        <circle
          cx="11"
          cy="11"
          r="6.5"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          d="m16.5 16.5 3.5 3.5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    id: "atualizacoes",
    label: "Atualizações",
    icon: () => (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden>
        <circle
          cx="11"
          cy="11"
          r="6.5"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          d="M11 8.5v3l2 1.2"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M16.8 16.2c.55.35 1.2.8 1.7 1.35.2.22.18.55-.05.73l-1.1.85c-.2.15-.48.12-.66-.07-.45-.5-.95-.9-1.5-1.2"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    id: "favoritos",
    label: "Favoritos",
    icon: () => (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden>
        <path d="M12 20.2 10.45 18.8C5.4 14.25 2 11.2 2 7.5 2 4.5 4.4 2.2 7.3 2.2c1.7 0 3.3.8 4.7 2.1C13.4 3 15 2.2 16.7 2.2 19.6 2.2 22 4.5 22 7.5c0 3.7-3.4 6.75-8.45 11.3L12 20.2Z" />
      </svg>
    ),
  },
  {
    id: "plano",
    label: "Plano",
    icon: () => (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden>
        <path
          d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5.2v-5.2H10.2V21H5a1 1 0 0 1-1-1v-9.5Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="m14.2 11.2 1.6 1.6 3-3"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: "inbox",
    label: "Caixa de entrada",
    icon: () => (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden>
        <path
          d="M3.5 12.5V6.8A1.8 1.8 0 0 1 5.3 5h13.4a1.8 1.8 0 0 1 1.8 1.8v5.7"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M3.5 12.5h4.2l1.3 2.2h6l1.3-2.2h4.2V18a1.8 1.8 0 0 1-1.8 1.8H5.3A1.8 1.8 0 0 1 3.5 18v-5.5Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

/** Rail vertical estilo Zillow — ícone + rótulo (desktop). */
export default function ZillowSideRail({ active, onChange }: Props) {
  return (
    <nav
      className="hidden w-[76px] shrink-0 flex-col items-stretch border-r border-[#d1d1d5] bg-white py-2 print:hidden lg:flex"
      aria-label="Navegação principal"
    >
      {ITEMS.map((item) => {
        const isActive = active === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={`mx-1.5 flex flex-col items-center gap-1 rounded-lg px-1 py-2.5 transition ${
              isActive
                ? "bg-[#e8f1ff] text-[#006aff]"
                : "text-[#3a3a42] hover:bg-[#f5f5f7]"
            }`}
          >
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                isActive ? "bg-[#d6e8ff] text-[#006aff]" : "text-[#2a2a33]"
              }`}
            >
              {item.icon(isActive)}
            </span>
            <span
              className={`max-w-[68px] text-center text-[10px] font-semibold leading-tight ${
                isActive ? "text-[#006aff]" : "text-[#3a3a42]"
              }`}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

/** Barra inferior para iPhone / Android. */
export function ZillowMobileTabBar({ active, onChange }: Props) {
  return (
    <nav
      className="safe-pb z-40 flex shrink-0 border-t border-[#d1d1d5] bg-white px-1 pt-1 lg:hidden print:hidden"
      aria-label="Navegação principal"
    >
      {ITEMS.map((item) => {
        const isActive = active === item.id;
        const short =
          item.id === "atualizacoes"
            ? "Alertas"
            : item.id === "inbox"
              ? "Inbox"
              : item.label;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={`flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 transition ${
              isActive ? "text-[#006aff]" : "text-[#6a6a72]"
            }`}
          >
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                isActive ? "bg-[#e8f1ff] text-[#006aff]" : "text-[#3a3a42]"
              }`}
            >
              {item.icon(isActive)}
            </span>
            <span className="max-w-full truncate text-center text-[10px] font-semibold leading-tight">
              {short}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
