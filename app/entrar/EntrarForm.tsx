"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient, isAuthConfigured } from "../../lib/supabase/client";
import { safeNextPath } from "../../lib/auth/safeNext";

export default function EntrarForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNextPath(params.get("next"));
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const sb = createClient();
    if (!sb) return;
    void sb.auth.getSession().then(({ data }) => {
      if (data.session) router.replace(next);
    });
  }, [next, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    setBusy(true);
    try {
      const sb = createClient();
      if (!sb) {
        setMsg("Não foi possível entrar. Verifique e-mail e senha.");
        return;
      }
      const { error } = await sb.auth.signInWithPassword({
        email,
        password: senha,
      });
      if (error) {
        setMsg("Não foi possível entrar. Verifique e-mail e senha.");
        return;
      }
      router.replace(next);
    } finally {
      setBusy(false);
    }
  }

  async function forgot() {
    setMsg("Se o e-mail existir, enviaremos instruções.");
    const sb = createClient();
    if (!sb || !email) return;
    await sb.auth.resetPasswordForEmail(email);
  }

  return (
    <main className="mx-auto min-h-dvh max-w-md px-4 py-12">
      <p className="text-xs font-bold uppercase tracking-wide text-[#006aff]">
        Conta
      </p>
      <h1 className="mt-1 text-2xl font-black text-[#0a0a0b]">Entrar</h1>
      <p className="mt-2 text-sm text-[#3a3a42]">
        Mapa e scores continuam públicos. Login só para anunciar e gerir.
      </p>
      {!isAuthConfigured() ? (
        <p className="mt-6 rounded-xl border border-[#e6e6ea] bg-[#f4f4f5] p-3 text-sm text-[#3a3a42]">
          Autenticação ainda não configurada neste ambiente.
        </p>
      ) : null}
      <form onSubmit={onSubmit} className="mt-6 space-y-3">
        <label className="block text-sm font-medium">
          E-mail
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-xl border border-[#e6e6ea] px-3 py-2"
          />
        </label>
        <label className="block text-sm font-medium">
          Senha
          <input
            type="password"
            required
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="mt-1 w-full rounded-xl border border-[#e6e6ea] px-3 py-2"
          />
        </label>
        {msg ? <p className="text-sm text-[#b42318]">{msg}</p> : null}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-full bg-[#0a0a0b] py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          Entrar
        </button>
      </form>
      <button
        type="button"
        onClick={() => void forgot()}
        className="mt-3 text-sm text-[#006aff]"
      >
        Esqueci minha senha
      </button>
      <p className="mt-6 text-sm">
        Não tem conta?{" "}
        <a href="/cadastro" className="font-semibold text-[#006aff]">
          Cadastre-se
        </a>
      </p>
    </main>
  );
}
