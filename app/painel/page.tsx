"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";

export default function PainelIndex() {
  const router = useRouter();
  useEffect(() => {
    const sb = createClient();
    if (!sb) {
      router.replace("/entrar?next=/painel");
      return;
    }
    void (async () => {
      const { data } = await sb.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        router.replace("/entrar?next=/painel");
        return;
      }
      const res = await fetch("/backend/v2/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        router.replace("/painel/comprador");
        return;
      }
      const body = (await res.json()) as { perfil?: { papel?: string } };
      const papel = body.perfil?.papel;
      if (papel === "admin") router.replace("/painel/admin");
      else if (
        papel === "imobiliaria" ||
        papel === "corretor" ||
        papel === "proprietario" ||
        papel === "incorporadora"
      ) {
        router.replace("/painel/anunciante");
      } else router.replace("/painel/comprador");
    })();
  }, [router]);
  return (
    <main className="p-8 text-sm text-[#3a3a42]">Abrindo seu painel…</main>
  );
}
