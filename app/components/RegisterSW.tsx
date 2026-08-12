"use client";

import { useEffect } from "react";

/** Registra service worker para uso como app no Android / iPhone (PWA). */
export default function RegisterSW() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    // Em desenvolvimento: remove SW residual (evita cache lento no localhost)
    if (process.env.NODE_ENV !== "production") {
      void navigator.serviceWorker
        .getRegistrations()
        .then((regs) => Promise.all(regs.map((r) => r.unregister())))
        .then(() =>
          caches.keys().then((keys) =>
            Promise.all(keys.map((k) => caches.delete(k))),
          ),
        )
        .catch(() => undefined);
      return;
    }

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
