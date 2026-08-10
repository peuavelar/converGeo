export type PlusCount = 0 | 1 | 2 | 3 | 4;

export type ConstructionStatus =
  | "na_planta"
  | "em_construcao"
  | "pronto_para_morar";

export type ImovelListingFilters = {
  quartos: PlusCount;
  banheiros: PlusCount;
  vagas: PlusCount;
  precoMin: number;
  precoMax: number;
  otimoPreco: boolean;
  condominioMin: number;
  condominioMax: number;
  areaMin: number;
  areaMax: number;
  proximoMetro: boolean;
  status: ConstructionStatus[];
  amenities: string[];
  codigoImovel: string;
};

export const DEFAULT_IMOVEL_FILTERS: ImovelListingFilters = {
  quartos: 0,
  banheiros: 0,
  vagas: 0,
  precoMin: 0,
  precoMax: 0,
  otimoPreco: false,
  condominioMin: 0,
  condominioMax: 0,
  areaMin: 0,
  areaMax: 0,
  proximoMetro: false,
  status: [],
  amenities: [],
  codigoImovel: "",
};

export const PLUS_OPTIONS: { value: PlusCount; label: string }[] = [
  { value: 1, label: "1+" },
  { value: 2, label: "2+" },
  { value: 3, label: "3+" },
  { value: 4, label: "4+" },
];

export const STATUS_OPTIONS: { value: ConstructionStatus; label: string }[] = [
  { value: "na_planta", label: "Na planta" },
  { value: "em_construcao", label: "Em construção" },
  { value: "pronto_para_morar", label: "Pronto para morar" },
];

export const AMENITY_GROUPS: { title: string; items: string[] }[] = [
  {
    title: "No imóvel",
    items: [
      "Aceita animais",
      "Aquecimento",
      "Ar-condicionado",
      "Área de serviço",
      "Armário embutido",
      "Armário embutido no quarto",
      "Armário na cozinha",
      "Closet",
      "Conexão à internet",
      "Cozinha americana",
      "Depósito",
      "Escritório",
      "Interfone",
      "Lareira",
      "Mobiliado",
      "Quintal",
      "TV a cabo",
      "Varanda",
      "Varanda gourmet",
    ],
  },
  {
    title: "Áreas comuns",
    items: [
      "Academia",
      "Churrasqueira",
      "Espaço gourmet",
      "Espaço verde / Parque",
      "Jardim",
      "Piscina",
      "Playground",
      "Quadra poliesportiva",
      "Salão de festas",
      "Salão de jogos",
    ],
  },
  {
    title: "Infraestrutura",
    items: [
      "Acesso para deficientes",
      "Bicicletário",
      "Cozinha",
      "Elevador",
      "Garagem",
      "Gerador elétrico",
      "Lavanderia",
      "Recepção",
      "Sauna",
      "Spa",
    ],
  },
  {
    title: "Segurança",
    items: [
      "Circuito de segurança",
      "Condomínio fechado",
      "Portão eletrônico",
      "Portaria 24h",
      "Sistema de alarme",
      "Vigia",
    ],
  },
];
