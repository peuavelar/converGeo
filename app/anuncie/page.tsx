import Link from "next/link";

export default function AnunciePage() {
  return (
    <main className="mx-auto max-w-xl px-4 py-10">
      <p className="text-xs font-bold uppercase tracking-wide text-[#006aff]">
        Marketplace
      </p>
      <h1 className="mt-1 text-2xl font-bold text-[#0a0a0b]">
        Anuncie no ConverGeo
      </h1>
      <p className="mt-2 text-sm text-[#6a6a72]">
        Cadastre sua imobiliária, corretores ou anúncios próprios. A ingestão
        de planilha e o feed VRSync ficam no painel autenticado — a chave de
        API não aparece nesta página.
      </p>
      <div className="mt-6 flex flex-wrap gap-2">
        <Link
          href="/cadastro"
          className="rounded-full bg-[#0a0a0b] px-4 py-2 text-sm font-semibold text-white"
        >
          Criar conta
        </Link>
        <Link
          href="/entrar?next=/painel/anunciante"
          className="rounded-full border border-[#0a0a0b] px-4 py-2 text-sm font-semibold"
        >
          Já tenho conta
        </Link>
      </div>
      <p className="mt-6 text-xs text-[#8a8a93]">
        <Link href="/" className="font-semibold text-[#006aff]">
          Voltar ao mapa
        </Link>
      </p>
    </main>
  );
}
