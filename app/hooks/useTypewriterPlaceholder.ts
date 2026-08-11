"use client";

import { useEffect, useState } from "react";

const DEFAULT_TEXT = "Busque um endereço";

/**
 * Placeholder com efeito de digitação.
 * Reinicia quando `replayKey` muda (ex.: troca de ferramenta) ou no mount.
 */
export function useTypewriterPlaceholder(
  text: string = DEFAULT_TEXT,
  replayKey?: string | number,
) {
  const [display, setDisplay] = useState("");

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setDisplay(text);
      return;
    }

    setDisplay("");
    let i = 0;
    let deleted = false;
    let timer: ReturnType<typeof setTimeout>;

    const tick = () => {
      if (!deleted) {
        i += 1;
        setDisplay(text.slice(0, i));
        if (i >= text.length) {
          deleted = true;
          timer = setTimeout(tick, 2200);
          return;
        }
        timer = setTimeout(tick, 55 + Math.random() * 35);
        return;
      }
      // pause then restart typing (loop suave)
      i = 0;
      deleted = false;
      setDisplay("");
      timer = setTimeout(tick, 400);
    };

    timer = setTimeout(tick, 350);
    return () => clearTimeout(timer);
  }, [text, replayKey]);

  return display;
}
