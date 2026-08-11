import { getDynamicScore, type ScoreWeights } from "./dynamicScore";

type HexRow = {
  h3_index: string;
  breakdown?: {
    estrutural?: number;
    macroeconomico?: number;
    comportamental?: number;
  };
};

export function downloadHexCsv(
  hexData: HexRow[],
  addressMap: Record<string, string>,
  weights: ScoreWeights,
  filterMinScore?: number,
) {
  const rows =
    filterMinScore != null
      ? hexData.filter((h) => getDynamicScore(h, weights) >= filterMinScore)
      : hexData;

  const lines = [
    "ID_H3,Localizacao,Nota_Personalizada,Demografia,Saturacao_Mercado,Fluxo",
    ...rows.map((hex) =>
      [
        hex.h3_index,
        `"${addressMap[hex.h3_index] || "Salvador"}"`,
        getDynamicScore(hex, weights).toFixed(2),
        hex.breakdown?.estrutural?.toFixed(2) || 0,
        hex.breakdown?.macroeconomico?.toFixed(2) || 0,
        hex.breakdown?.comportamental?.toFixed(2) || 0,
      ].join(","),
    ),
  ];

  const link = document.createElement("a");
  link.href = encodeURI(`data:text/csv;charset=utf-8,${lines.join("\n")}`);
  link.download = `ConverGeo_Analise_${Date.now()}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
}
