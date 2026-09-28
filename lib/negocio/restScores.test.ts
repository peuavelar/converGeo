import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { restProbe, restScoreAt, restTop } from "./restScores";

describe("restScores", () => {
  it("lê public.scores no PostgREST quando as chaves existem", async () => {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_PUBLISHABLE_KEY) {
      return;
    }
    assert.equal(await restProbe(), "up");
    const top = await restTop("food_service", 3);
    assert.ok(top);
    assert.ok(top.recomendacoes.length >= 1);
    assert.ok(top.recomendacoes[0].h3_index.startsWith("88"));
    const hit = await restScoreAt(-12.97, -38.5, "food_service");
    assert.ok(hit);
    assert.ok(hit.status === "sucesso" || hit.status === "sem_dados");
  });
});
