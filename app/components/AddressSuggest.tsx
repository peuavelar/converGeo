"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  buildAddressSuggestions,
  type AddressSuggestion,
} from "../data/streets";

type Props = {
  value: string;
  onChange: (v: string) => void;
  onPick: (suggestion: AddressSuggestion) => void;
  inputId?: string;
  isSearching?: boolean;
};

export default function AddressSuggest({
  value,
  onChange,
  onPick,
  inputId,
  isSearching = false,
}: Props) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const suggestions = buildAddressSuggestions(value);

  useEffect(() => {
    setActiveIndex(0);
  }, [value]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const showList = open && suggestions.length > 0;

  const choose = (item: AddressSuggestion) => {
    onChange(
      item.street
        ? `${item.street}, ${item.neighborhoodName}`
        : item.neighborhoodName,
    );
    onPick(item);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative min-w-0 flex-1">
      <input
        id={inputId || "endereco"}
        type="text"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        placeholder="Digite bairro ou rua"
        value={value}
        disabled={isSearching}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (!showList) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIndex((i) => Math.max(i - 1, 0));
          } else if (e.key === "Enter" && suggestions[activeIndex]) {
            e.preventDefault();
            choose(suggestions[activeIndex]);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 disabled:opacity-60"
      />

      {showList && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-30 mt-1 max-h-52 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
        >
          {suggestions.map((item, idx) => (
            <li key={item.id} role="option" aria-selected={idx === activeIndex}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(item)}
                className={`flex w-full flex-col px-3 py-2 text-left ${
                  idx === activeIndex ? "bg-blue-50" : "hover:bg-slate-50"
                }`}
              >
                <span className="text-sm font-semibold text-slate-900">
                  {item.kind === "rua" ? item.street : item.neighborhoodName}
                </span>
                <span className="text-[11px] text-slate-500">
                  {item.kind === "rua"
                    ? `Rua em ${item.neighborhoodName}`
                    : "Bairro"}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && value.trim().length >= 2 && suggestions.length === 0 && (
        <p className="absolute z-30 mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500 shadow-lg">
          Nenhuma rua ou bairro encontrado. Tente outro nome.
        </p>
      )}
    </div>
  );
}
