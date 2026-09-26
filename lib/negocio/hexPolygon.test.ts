import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { latLngToCell } from "h3-js";
import { h3ToLngLatRing } from "./hexPolygon";

describe("h3ToLngLatRing", () => {
  it("fecha o anel GeoJSON em Salvador (res 8)", () => {
    const cell = latLngToCell(-13.0018, -38.4631, 8);
    const ring = h3ToLngLatRing(cell);
    assert.ok(ring.length >= 7);
    assert.equal(ring[0][0], ring[ring.length - 1][0]);
    assert.equal(ring[0][1], ring[ring.length - 1][1]);
    for (const [lng, lat] of ring) {
      assert.ok(lng < -38 && lng > -39);
      assert.ok(lat < -12 && lat > -14);
    }
  });
});
