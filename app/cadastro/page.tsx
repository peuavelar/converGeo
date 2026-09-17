"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient, isAuthConfigured } from "../../lib/supabase/client";

const TIPOS = [
  { id: "comprador", label: "Comprador" },
  { id: "proprietario", label: "Proprietário" },
  { id: "imobiliaria", label: "Imobiliária / corretor" },
  { id: "incorporadora", label: "Incorporadora" },
] as const;

export default function CadastroPage() {
  const router = useRouter();
  const [tipo, setTipo] = useState<(typeof TIPOS)[number]["id"]>("comprador");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [creci, setCreci] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    setBusy(true);
    try {
      const sb = createClient();
      if (!sb) {
        setMsg("Não foi possível concluir o cadastro.");
        return;
      }
      const { data, error } = await sb.auth.signUp({
        email,
        password: senha,
        options: { data: { nome, tipo, creci, cnpj } },
      });
      if (error || !data.session) {
        setMsg("Não foi possível concluir o cadastro.");
        return;
      }
      const papel =
        tipo === "imobiliaria" || tipo === "incorporadora" ? tipo : tipo;
      await fetch("/backend/v2/cadastro", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${data.session.access_token}`,
        },
        body: JSON.stringify({ papel, nome, creci, documento: cnpj }),
      });
      router.replace("/painel");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto min-h-dvh max-w-md px-4 py-12">
      <h1 className="text-2xl font-black text-[#0a0a0b]">Criar conta</h1>
      {!isAuthConfigured() ? (
        <p className="mt-4 text-sm text-[#3a3a42]">
          Autenticação ainda não configurada neste ambiente.
        </p>
      ) : null}
      <form onSubmit={onSubmit} className="mt-6 space-y-3">
        <label className="block text-sm font-medium">
          Tipo de conta
          <select
            value={tipo}
            onChange={(e) =>
              setTipo(e.target.value as (typeof TIPOS)[number]["id"])
            }
            className="mt-1 w-full rounded-xl border border-[#e6e6ea] px-3 py-2"
          >
            {TIPOS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium">
          Nome
          <input
            required
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="mt-1 w-full rounded-xl border border-[#e6e6ea] px-3 py-2"
          />
        </label>
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
            minLength={8}
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="mt-1 w-full rounded-xl border border-[#e6e6ea] px-3 py-2"
          />
        </label>
        {tipo === "imobiliaria" || tipo === "incorporadora" ? (
          <>
            <label className="block text-sm font-medium">
              CRECI
              <input
                value={creci}
                onChange={(e) => setCreci(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#e6e6ea] px-3 py-2"
              />
            </label>
            <label className="block text-sm font-medium">
              CNPJ
              <input
                value={cnpj}
                onChange={(e) => setCnpj(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#e6e6ea] px-3 py-2"
              />
            </label>
          </>
        ) : null}
        {msg ? <p className="text-sm text-[#b42318]">{msg}</p> : null}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-full bg-[#0a0a0b] py-2 text-sm font-semibold text-white"
        >
          Cadastrar
        </button>
      </form>
    </main>
  );
}
