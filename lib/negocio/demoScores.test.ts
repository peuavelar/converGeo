import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { describe, it } from "node:test";
import { cellToLatLng, latLngToCell } from "h3-js";
import {
  DEMO_CENTERS,
  H3_RES,
  demoCoverageCells,
  demoScoreAt,
  demoScoreForCell,
  demoTop,
} from "./demoScores";

describe("demoScores", () => {
  it("reproduz a fórmula do seed_demo Python", () => {
    const cell = latLngToCell(DEMO_CENTERS[0][0], DEMO_CENTERS[0][1], H3_RES);
    const unit = (key: string) =>
      createHash("sha256").update(key).digest()[0] / 255;
    const estrutural = Math.round((4 + 6 * unit(`food_service-e-${cell}`)) * 100) / 100;
    const got = demoScoreForCell(cell, "food_service");
    assert.equal(got.breakdown.estrutural, estrutural);
    assert.equal(got.status, "sucesso");
    assert.equal(got.demo, true);
  });

  it("cobre Pituba e recusa ponto fora da RMS", () => {
    const inArea = demoScoreAt(-13.0018, -38.4631, "food_service");
    assert.equal(inArea.status, "sucesso");
    const [clat, clng] = cellToLatLng(inArea.h3_index);
    assert.ok(Math.abs(clat + 13) < 1);
    assert.ok(Math.abs(clng + 38.5) < 1);

    const out = demoScoreAt(-12.0, -38.0, "food_service");
    assert.equal(out.status, "sem_dados");
  });

  it("top devolve ranking estável", () => {
    const cells = demoCoverageCells();
    assert.ok(cells.length >= 50);
    const top = demoTop("food_service", 5);
    assert.equal(top.recomendacoes.length, 5);
    assert.ok(
      top.recomendacoes[0].score_total >= top.recomendacoes[4].score_total,
    );
  });
});
