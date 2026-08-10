"use client";

import { useEffect } from "react";

/** Registra service worker para uso como app no Android / iPhone (PWA). */
export default function RegisterSW() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;

    const register = async () => {
      try {
        await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      } catch {
        // silencioso — PWA é opcional
      }
    };

    void register();
  }, []);

  return null;
}
