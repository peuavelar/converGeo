/** Ordem correta de extração no modo Negócio. */
const STEPS = [
  { n: "1", title: "Escolha o segmento", detail: "É o recorte dos dados (CNAE)." },
  { n: "2", title: "Abra o Raio-X", detail: "Carrega os melhores hexágonos no mapa." },
  { n: "3", title: "Filtre a nota, se quiser", detail: "Corta a matriz antes de baixar." },
  { n: "4", title: "Exporte o CSV", detail: "Matriz do mapa — não comece pelo endereço." },
] as const;

export default function ExtractTutorial() {
  return (
    <div
      id="tutorial-extracao"
      className="rounded-xl border border-[#dbe4ff] bg-[#f4f7ff] px-3 py-2.5"
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#3b5bcc]">
        Por onde começar
      </p>
      <p className="mt-0.5 text-xs font-semibold text-[#0a0a0b]">
        Extração correta: segmento → Raio-X → CSV
      </p>
      <ol className="mt-2 space-y-1.5">
        {STEPS.map((step) => (
          <li key={step.n} className="flex gap-2 text-left">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#0a0a0b] text-[10px] font-bold text-white">
              {step.n}
            </span>
            <span>
              <span className="block text-[12px] font-bold text-[#0a0a0b]">
                {step.title}
              </span>
              <span className="block text-[11px] leading-snug text-[#5a5a64]">
                {step.detail}
              </span>
            </span>
          </li>
        ))}
      </ol>
      <p className="mt-2 text-[10px] leading-snug text-[#6a6a72]">
        Endereço e comparação A/B são análise pontual — use depois da matriz.
      </p>
    </div>
  );
}
