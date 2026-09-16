"use client";

import Link from "next/link";
import { useState } from "react";

export default function AnunciePage() {
  const [msg, setMsg] = useState("");
  const [feedUrl, setFeedUrl] = useState("");
  const [anuncianteId, setAnuncianteId] = useState("imobiliaria-demo");
  const [apiKey, setApiKey] = useState("");
  const [busy, setBusy] = useState(false);

  async function uploadCsv(file: File) {
    setBusy(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch(
        `/backend/v2/ingest/planilha?anunciante_id=${encodeURIComponent(anuncianteId)}`,
        {
          method: "POST",
          headers: apiKey ? { "X-API-Key": apiKey } : undefined,
          body,
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(
          `Motor indisponível ou recusou o envio (${res.status}). Rode o engine local ou use o CLI.`,
        );
        return;
      }
      setMsg(
        `Ingestão ok: ${data.created ?? 0} criados, ${data.updated ?? 0} atualizados, ${data.errors?.length ?? 0} erros de linha.`,
      );
    } catch {
      setMsg("Não foi possível falar com o motor. Confira BACKEND_ORIGIN e `cli serve`.");
    } finally {
      setBusy(false);
    }
  }

  async function cadastrarFeed() {
    if (!feedUrl.trim()) {
      setMsg("Informe a URL do feed.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/backend/v2/anunciantes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(apiKey ? { "X-API-Key": apiKey } : {}),
        },
        body: JSON.stringify({
          id: anuncianteId,
          tipo: "imobiliaria",
          nome: anuncianteId,
          feed_url: feedUrl,
          feed_formato: "vrsync",
        }),
      });
      if (!res.ok) {
        setMsg(`Cadastro recusado (${res.status}). URL guardada localmente: ${feedUrl}`);
        return;
      }
      setMsg(`Anunciante cadastrado. Feed: ${feedUrl}`);
    } catch {
      setMsg(`Feed anotado: ${feedUrl} (motor offline)`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-10">
      <p className="text-xs font-bold uppercase tracking-wide text-[#006aff]">
        Marketplace
      </p>
      <h1 className="mt-1 text-2xl font-bold text-[#0a0a0b]">Anuncie no ConverGeo</h1>
      <p className="mt-2 text-sm text-[#6a6a72]">
        Envie a planilha no template oficial ou cadastre a URL do feed VRSync.
        Sem pagamento neste MVP. Documento de PF não é exposto na API pública.
      </p>

      <section className="mt-6 rounded-2xl border border-[#e6e6ea] bg-white p-4">
        <h2 className="text-sm font-bold">1. Baixar template CSV</h2>
        <a
          className="mt-2 inline-flex rounded-xl bg-[#0a0a0b] px-3 py-2 text-xs font-bold text-white"
          href="/templates/imoveis_template.csv"
          download
        >
          Baixar template
        </a>
      </section>

      <section className="mt-4 rounded-2xl border border-[#e6e6ea] bg-white p-4">
        <h2 className="text-sm font-bold">2. Enviar planilha</h2>
        <label className="mt-3 block text-xs font-semibold text-[#6a6a72]">
          ID do anunciante
          <input
            value={anuncianteId}
            onChange={(e) => setAnuncianteId(e.target.value)}
            className="mt-1 w-full rounded-xl border border-[#e6e6ea] px-3 py-2 text-sm font-normal text-[#0a0a0b]"
          />
        </label>
        <label className="mt-3 block text-xs font-semibold text-[#6a6a72]">
          API key (opcional se o motor não exigir)
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="mt-1 w-full rounded-xl border border-[#e6e6ea] px-3 py-2 text-sm font-normal text-[#0a0a0b]"
          />
        </label>
        <input
          type="file"
          accept=".csv"
          disabled={busy}
          className="mt-3 block w-full text-sm"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void uploadCsv(file);
          }}
        />
      </section>

      <section className="mt-4 rounded-2xl border border-[#e6e6ea] bg-white p-4">
        <h2 className="text-sm font-bold">3. URL de feed VRSync</h2>
        <input
          value={feedUrl}
          onChange={(e) => setFeedUrl(e.target.value)}
          placeholder="https://seu-crm.exemplo/vrsync.xml"
          className="mt-2 w-full rounded-xl border border-[#e6e6ea] px-3 py-2 text-sm"
        />
        <button
          type="button"
          disabled={busy}
          className="mt-2 rounded-xl border border-[#0a0a0b] px-3 py-2 text-xs font-bold"
          onClick={() => void cadastrarFeed()}
        >
          Cadastrar feed
        </button>
      </section>

      {msg && (
        <p className="mt-4 rounded-xl bg-[#e8f1ff] px-3 py-2 text-sm text-[#0a3d8f]">
          {msg}
        </p>
      )}

      <p className="mt-6 text-xs text-[#8a8a93]">
        <Link href="/" className="font-semibold text-[#006aff]">
          Voltar ao mapa
        </Link>
      </p>
    </main>
  );
}
