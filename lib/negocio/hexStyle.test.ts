import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { heatmapFill, insetRing, relativeT, scoreRange } from "./hexStyle";

describe("hexStyle", () => {
  it("normaliza o ranking entre min e max", () => {
    assert.equal(relativeT(5, 0, 10), 0.5);
    assert.equal(relativeT(0, 5, 5), 0.5);
    const { min, max } = scoreRange([1, 4, 10]);
    assert.equal(min, 1);
    assert.equal(max, 10);
  });

  it("recua o anel sem abrir o polígono", () => {
    const ring: [number, number][] = [
      [0, 0],
      [2, 0],
      [1, 2],
      [0, 0],
    ];
    const inset = insetRing(ring, 0.5);
    assert.equal(inset[0][0], inset[inset.length - 1][0]);
    assert.equal(inset[0][1], inset[inset.length - 1][1]);
    const span = Math.hypot(inset[1][0] - inset[0][0], inset[1][1] - inset[0][1]);
    const orig = Math.hypot(2, 0);
    assert.ok(span < orig);
  });

  it("no escuro o topo do gradiente é ciano", () => {
    const high = heatmapFill(1, true);
    assert.ok(high[1] > 180 && high[2] > 160);
    const low = heatmapFill(0, true);
    assert.ok(low[0] > low[1]);
  });
});
