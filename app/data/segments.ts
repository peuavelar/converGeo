/** Segmentos comerciais alinhados ao CNAE / motor ConverGeo. */
export type BusinessSegment = {
  value: string;
  label: string;
  /** Seção CNAE de referência (aproximada) */
  cnae: string;
  baseInvestment?: number;
};

export const BUSINESS_SEGMENTS: BusinessSegment[] = [
  {
    value: "food_service",
    label: "Restaurantes",
    cnae: "56.11-2",
    baseInvestment: 150000,
  },
  {
    value: "padaria",
    label: "Padaria e confeitaria",
    cnae: "10.91-1",
    baseInvestment: 120000,
  },
  {
    value: "cafe",
    label: "Café e lanchonete",
    cnae: "56.11-2/02",
    baseInvestment: 90000,
  },
  {
    value: "farmacia",
    label: "Farmácia e drogaria",
    cnae: "47.71-7",
    baseInvestment: 300000,
  },
  {
    value: "clinica",
    label: "Clínica médica",
    cnae: "86.30-5",
    baseInvestment: 250000,
  },
  {
    value: "otica",
    label: "Ótica",
    cnae: "47.74-1",
    baseInvestment: 110000,
  },
  {
    value: "academia",
    label: "Academia e fitness",
    cnae: "93.13-1",
    baseInvestment: 200000,
  },
  {
    value: "beleza",
    label: "Salão de beleza",
    cnae: "96.02-5",
    baseInvestment: 80000,
  },
  {
    value: "vestuario",
    label: "Vestuário e moda",
    cnae: "47.81-4",
    baseInvestment: 80000,
  },
  {
    value: "supermercado",
    label: "Supermercado e minimercado",
    cnae: "47.11-3",
    baseInvestment: 400000,
  },
  {
    value: "pet",
    label: "Pet shop",
    cnae: "47.89-0/04",
    baseInvestment: 100000,
  },
  {
    value: "papelaria",
    label: "Papelaria e livros",
    cnae: "47.61-0",
    baseInvestment: 90000,
  },
  {
    value: "construcao",
    label: "Material de construção",
    cnae: "47.44-0",
    baseInvestment: 250000,
  },
  {
    value: "posto",
    label: "Posto de combustível",
    cnae: "47.31-8",
    baseInvestment: 800000,
  },
  {
    value: "hotel",
    label: "Hotelaria",
    cnae: "55.10-8",
    baseInvestment: 600000,
  },
  {
    value: "educacao",
    label: "Educação e cursos",
    cnae: "85.99-6",
    baseInvestment: 150000,
  },
];

export function getSegmentLabel(value: string): string {
  return BUSINESS_SEGMENTS.find((s) => s.value === value)?.label ?? value;
}

export function getSegmentBaseInvestment(value: string): number {
  return (
    BUSINESS_SEGMENTS.find((s) => s.value === value)?.baseInvestment ?? 100000
  );
}
