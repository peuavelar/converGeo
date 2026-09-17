"use client";

import { useEffect, useState } from "react";

export default function DemoBanner() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    void fetch("/backend/health")
      .then((r) => r.json())
      .then((body: { demo?: boolean }) => {
        if (body?.demo) setShow(true);
      })
      .catch(() => undefined);
  }, []);
  if (!show) return null;
  return (
    <p className="bg-[#fff6e5] px-3 py-1 text-center text-[11px] font-medium text-[#7a5a00]">
      Dados de demonstração
    </p>
  );
}
