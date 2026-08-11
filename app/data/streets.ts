import { NEIGHBORHOODS, neighborhoodCity } from "./neighborhoods";

export type AddressSuggestion = {
  id: string;
  label: string;
  kind: "bairro" | "rua";
  neighborhoodId: string;
  neighborhoodName: string;
  street?: string;
};

/** Ruas de referência por bairro (camada local para autocomplete). */
const STREETS_BY_NEIGHBORHOOD: Record<string, string[]> = {
  pituba: [
    "Av. Paulo VI",
    "Rua Ceará",
    "Av. Antônio Carlos Magalhães",
    "Rua Paraíba",
    "Rua Amazonas",
  ],
  barra: [
    "Av. Oceânica",
    "Rua Recife",
    "Ladeira da Barra",
    "Rua Marquês de Caravelas",
  ],
  ondina: ["Av. Oceânica", "Campus Ondina", "Rua Professor Aristides Novis"],
  "rio-vermelho": [
    "Rua da Paciência",
    "Rua Joana Angélica",
    "Largo da Mariquita",
    "Rua do Meio",
  ],
  "caminho-das-arvores": [
    "Av. Tancredo Neves",
    "Rua Teixeira Leal",
    "Av. Luís Viana Filho",
  ],
  itaigara: ["Av. Antônio Carlos Magalhães", "Rua Bahia", "Rua Minas Gerais"],
  horto: ["Rua do Horto", "Av. Juracy Magalhães Jr."],
  imibui: ["Av. Luís Viana Filho", "Rua São Paulo", "Av. Pinto de Aguiar"],
  patamares: ["Av. Pinto de Aguiar", "Rua das Patativas"],
  itapua: ["Av. Dorival Caymmi", "Rua Praia de Itapuã", "Largo de Itapuã"],
  "stella-maris": ["Av. Luís Eduardo Magalhães", "Rua Stella Maris"],
  "boca-do-rio": ["Av. Jorge Amado", "Rua Silveira Martins"],
  centro: [
    "Praça da Sé",
    "Rua Chile",
    "Av. Sete de Setembro",
    "Largo do Pelourinho",
  ],
  liberdade: ["Av. Liberdade", "Rua Lima e Silva", "Largo da Liberdade"],
  paralela: ["Av. Luís Viana Filho", "Alameda Euvaldo Luz"],
  // Lauro de Freitas
  "lauro-centro": ["Av. Santos Dumont", "Rua Direta do Centro", "Praça da Bíblia"],
  "vilas-do-atlantico": [
    "Av. Praia de Ipitanga",
    "Alameda Praia de Guarajuba",
    "Rua das Algarobas",
  ],
  buraquinho: ["Estrada do Coco", "Rua do Buraquinho"],
  portao: ["Av. Santos Dumont", "Rua do Portão", "Via Paradise"],
  ipitanga: ["Av. Praia de Ipitanga", "Rua da Orla"],
  itinga: ["Av. Parallel", "Rua da Itinga"],
  "caminhos-do-mar": ["Av. Praia de Guarajuba", "Alameda dos Flamboyants"],
};

export function buildAddressSuggestions(
  query: string,
  limit = 8,
): AddressSuggestion[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  const results: AddressSuggestion[] = [];

  for (const n of NEIGHBORHOODS) {
    const city = neighborhoodCity(n);
    const citySuffix = city === "Salvador" ? "" : ` · ${city}`;
    if (n.name.toLowerCase().includes(q) || city.toLowerCase().includes(q)) {
      results.push({
        id: `bairro-${n.id}`,
        label: `${n.name}${citySuffix}`,
        kind: "bairro",
        neighborhoodId: n.id,
        neighborhoodName: n.name,
      });
    }

    const streets = STREETS_BY_NEIGHBORHOOD[n.id] ?? [];
    for (const street of streets) {
      const haystack = `${street} ${n.name} ${city}`.toLowerCase();
      if (haystack.includes(q) || street.toLowerCase().includes(q)) {
        results.push({
          id: `rua-${n.id}-${street}`,
          label: `${street} — ${n.name}${citySuffix}`,
          kind: "rua",
          neighborhoodId: n.id,
          neighborhoodName: n.name,
          street,
        });
      }
    }
  }

  // Prioriza bairro exato / início do nome
  results.sort((a, b) => {
    const aStarts = a.label.toLowerCase().startsWith(q) ? 0 : 1;
    const bStarts = b.label.toLowerCase().startsWith(q) ? 0 : 1;
    if (aStarts !== bStarts) return aStarts - bStarts;
    if (a.kind !== b.kind) return a.kind === "bairro" ? -1 : 1;
    return a.label.localeCompare(b.label, "pt-BR");
  });

  return results.slice(0, limit);
}
