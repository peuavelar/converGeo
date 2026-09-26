import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { clientScoreAt, clientTop } from "./clientHexFallback";

describe("clientHexFallback", () => {
  it("gera hexágono em Pituba e grade para o heatmap", () => {
    const hit = clientScoreAt(-13.0018, -38.4631, "food_service");
    assert.ok(hit);
    assert.ok(hit.h3_index.startsWith("88"));
    assert.equal(hit.demo, true);
    const miss = clientScoreAt(-12.0, -38.0, "food_service");
    assert.equal(miss, null);
    const top = clientTop("food_service", 300);
    assert.ok(top.length >= 50);
    assert.ok(top[0].score_total >= top[top.length - 1].score_total);
  });
});
