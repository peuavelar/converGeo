"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase/client";

export default function AuthMenu() {
  const [email, setEmail] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const sb = createClient();
    if (!sb) return;
    void sb.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
    });
  }, []);

  if (!email) {
    return (
      <a
        href="/entrar"
        className="rounded-full bg-[#0a0a0b] px-2.5 py-1 text-[10px] font-semibold text-white md:px-3 md:text-xs"
      >
        Entrar
      </a>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0a0a0b] text-[10px] font-bold text-white"
        aria-label="Menu da conta"
      >
        {email.slice(0, 1).toUpperCase()}
      </button>
      {open ? (
        <div className="absolute right-0 mt-1 w-40 rounded-xl border border-[#e6e6ea] bg-white p-1 text-xs shadow-sm">
          <a href="/painel" className="block rounded-lg px-2 py-1.5 hover:bg-[#f4f4f5]">
            Painel
          </a>
          <button
            type="button"
            className="block w-full rounded-lg px-2 py-1.5 text-left hover:bg-[#f4f4f5]"
            onClick={async () => {
              const sb = createClient();
              await sb?.auth.signOut();
              window.location.href = "/";
            }}
          >
            Sair
          </button>
        </div>
      ) : null}
    </div>
  );
}
