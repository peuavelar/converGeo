export type NeighborhoodMetrics = {
  consumo: number; // alimentação / conveniência 0-10
  transporte: number; // 0-10
  educacao: number; // 0-10
  seguranca: number; // 0-10 (maior = mais seguro)
  rouboFurto: number; // índice de risco 0-10 (maior = mais ocorrências)
};

export type Neighborhood = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  precoM2: number; // R$/m² residencial estimado
  aluguel2q: number; // aluguel típico 2 quartos
  metrics: NeighborhoodMetrics;
  tags: string[];
  /** Município — Salvador ou Lauro de Freitas (RMS). */
  city?: "Salvador" | "Lauro de Freitas";
};

/** Camada mock local — Salvador + Lauro de Freitas (RMS). */
export const NEIGHBORHOODS: Neighborhood[] = [
  {
    id: "pituba",
    name: "Pituba",
    lat: -13.0058,
    lng: -38.4601,
    precoM2: 9200,
    aluguel2q: 3200,
    metrics: { consumo: 8.6, transporte: 7.8, educacao: 8.2, seguranca: 6.4, rouboFurto: 4.8 },
    tags: ["família", "serviços", "alto fluxo"],
  },
  {
    id: "barra",
    name: "Barra",
    lat: -13.0105,
    lng: -38.5329,
    precoM2: 11500,
    aluguel2q: 4100,
    metrics: { consumo: 9.1, transporte: 7.2, educacao: 7.9, seguranca: 6.1, rouboFurto: 5.2 },
    tags: ["lazer", "turismo", "premium"],
  },
  {
    id: "ondina",
    name: "Ondina",
    lat: -13.0069,
    lng: -38.5102,
    precoM2: 9800,
    aluguel2q: 3500,
    metrics: { consumo: 7.4, transporte: 6.8, educacao: 8.5, seguranca: 6.8, rouboFurto: 4.1 },
    tags: ["universitário", "praia"],
  },
  {
    id: "rio-vermelho",
    name: "Rio Vermelho",
    lat: -13.0118,
    lng: -38.4915,
    precoM2: 8800,
    aluguel2q: 3000,
    metrics: { consumo: 9.4, transporte: 7.0, educacao: 7.6, seguranca: 5.7, rouboFurto: 5.8 },
    tags: ["gastronomia", "noite"],
  },
  {
    id: "caminho-das-arvores",
    name: "Caminho das Árvores",
    lat: -12.9814,
    lng: -38.4589,
    precoM2: 10500,
    aluguel2q: 3800,
    metrics: { consumo: 8.8, transporte: 8.4, educacao: 8.7, seguranca: 7.2, rouboFurto: 3.6 },
    tags: ["corporativo", "alto padrão"],
  },
  {
    id: "itaigara",
    name: "Itaigara",
    lat: -12.9942,
    lng: -38.4648,
    precoM2: 9700,
    aluguel2q: 3400,
    metrics: { consumo: 8.2, transporte: 7.9, educacao: 8.4, seguranca: 7.0, rouboFurto: 3.9 },
    tags: ["residencial", "escolas"],
  },
  {
    id: "horto",
    name: "Horto Florestal",
    lat: -12.9985,
    lng: -38.4842,
    precoM2: 7800,
    aluguel2q: 2600,
    metrics: { consumo: 7.1, transporte: 6.5, educacao: 7.8, seguranca: 7.5, rouboFurto: 3.2 },
    tags: ["tranquilo", "verde"],
  },
  {
    id: "imibui",
    name: "Imbuí",
    lat: -12.9378,
    lng: -38.4265,
    precoM2: 7200,
    aluguel2q: 2300,
    metrics: { consumo: 7.6, transporte: 8.1, educacao: 7.2, seguranca: 6.6, rouboFurto: 4.4 },
    tags: ["acesso", "custo-benefício"],
  },
  {
    id: "patamares",
    name: "Patamares",
    lat: -12.9386,
    lng: -38.3982,
    precoM2: 6900,
    aluguel2q: 2100,
    metrics: { consumo: 6.8, transporte: 7.4, educacao: 7.0, seguranca: 7.1, rouboFurto: 3.8 },
    tags: ["residencial", "família"],
  },
  {
    id: "itapua",
    name: "Itapuã",
    lat: -12.9456,
    lng: -38.3621,
    precoM2: 6500,
    aluguel2q: 2000,
    metrics: { consumo: 7.0, transporte: 5.9, educacao: 6.4, seguranca: 5.9, rouboFurto: 5.1 },
    tags: ["praia", "lazer"],
  },
  {
    id: "stella-maris",
    name: "Stella Maris",
    lat: -12.9381,
    lng: -38.3304,
    precoM2: 8200,
    aluguel2q: 2800,
    metrics: { consumo: 6.5, transporte: 5.4, educacao: 6.8, seguranca: 7.3, rouboFurto: 3.4 },
    tags: ["praia", "crescimento"],
  },
  {
    id: "boca-do-rio",
    name: "Boca do Rio",
    lat: -12.9754,
    lng: -38.4318,
    precoM2: 6100,
    aluguel2q: 1900,
    metrics: { consumo: 7.3, transporte: 7.6, educacao: 6.5, seguranca: 5.4, rouboFurto: 5.9 },
    tags: ["acesso", "misto"],
  },
  {
    id: "centro",
    name: "Centro Histórico",
    lat: -12.9734,
    lng: -38.5124,
    precoM2: 5400,
    aluguel2q: 1600,
    metrics: { consumo: 8.0, transporte: 8.6, educacao: 6.2, seguranca: 4.2, rouboFurto: 7.4 },
    tags: ["central", "história"],
  },
  {
    id: "liberdade",
    name: "Liberdade",
    lat: -12.9508,
    lng: -38.4941,
    precoM2: 4200,
    aluguel2q: 1300,
    metrics: { consumo: 7.8, transporte: 8.0, educacao: 5.8, seguranca: 4.0, rouboFurto: 7.8 },
    tags: ["popular", "comércio"],
  },
  {
    id: "paralela",
    name: "Alphaville / Paralela",
    lat: -12.9225,
    lng: -38.4128,
    precoM2: 8900,
    aluguel2q: 3100,
    metrics: { consumo: 7.5, transporte: 8.8, educacao: 8.0, seguranca: 8.1, rouboFurto: 2.6 },
    tags: ["condomínio", "segurança"],
    city: "Salvador",
  },
  // —— Lauro de Freitas (RMS) ——
  {
    id: "lauro-centro",
    name: "Centro (Lauro)",
    lat: -12.8944,
    lng: -38.3272,
    precoM2: 5800,
    aluguel2q: 1800,
    metrics: { consumo: 7.2, transporte: 7.0, educacao: 6.8, seguranca: 6.2, rouboFurto: 4.6 },
    tags: ["comércio", "RMS"],
    city: "Lauro de Freitas",
  },
  {
    id: "vilas-do-atlantico",
    name: "Vilas do Atlântico",
    lat: -12.8785,
    lng: -38.292,
    precoM2: 8500,
    aluguel2q: 2900,
    metrics: { consumo: 8.0, transporte: 6.4, educacao: 7.8, seguranca: 7.6, rouboFurto: 3.1 },
    tags: ["alto padrão", "RMS", "praia"],
    city: "Lauro de Freitas",
  },
  {
    id: "buraquinho",
    name: "Buraquinho",
    lat: -12.9012,
    lng: -38.3015,
    precoM2: 6200,
    aluguel2q: 2000,
    metrics: { consumo: 6.9, transporte: 6.8, educacao: 6.5, seguranca: 6.5, rouboFurto: 4.2 },
    tags: ["residencial", "RMS"],
    city: "Lauro de Freitas",
  },
  {
    id: "portao",
    name: "Portão",
    lat: -12.886,
    lng: -38.318,
    precoM2: 5600,
    aluguel2q: 1700,
    metrics: { consumo: 7.4, transporte: 7.5, educacao: 6.6, seguranca: 6.0, rouboFurto: 4.8 },
    tags: ["comércio", "fluxo", "RMS"],
    city: "Lauro de Freitas",
  },
  {
    id: "ipitanga",
    name: "Ipitanga",
    lat: -12.912,
    lng: -38.335,
    precoM2: 5400,
    aluguel2q: 1650,
    metrics: { consumo: 6.8, transporte: 7.2, educacao: 6.3, seguranca: 5.9, rouboFurto: 5.0 },
    tags: ["acesso", "RMS"],
    city: "Lauro de Freitas",
  },
  {
    id: "itinga",
    name: "Itinga",
    lat: -12.898,
    lng: -38.348,
    precoM2: 5000,
    aluguel2q: 1500,
    metrics: { consumo: 6.5, transporte: 7.0, educacao: 6.1, seguranca: 5.8, rouboFurto: 5.1 },
    tags: ["popular", "RMS"],
    city: "Lauro de Freitas",
  },
  {
    id: "caminhos-do-mar",
    name: "Caminhos do Mar",
    lat: -12.869,
    lng: -38.278,
    precoM2: 7200,
    aluguel2q: 2400,
    metrics: { consumo: 7.1, transporte: 6.2, educacao: 7.2, seguranca: 7.4, rouboFurto: 3.3 },
    tags: ["condomínio", "RMS"],
    city: "Lauro de Freitas",
  },
];

export const METRIC_LABELS: Record<keyof NeighborhoodMetrics, string> = {
  consumo: "Consumo (alimentação)",
  transporte: "Transporte",
  educacao: "Educação",
  seguranca: "Segurança",
  rouboFurto: "Roubo e furto",
};

export function neighborhoodCity(n: Neighborhood): "Salvador" | "Lauro de Freitas" {
  return n.city ?? "Salvador";
}
