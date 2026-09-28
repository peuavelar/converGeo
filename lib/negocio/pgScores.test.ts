import assert from "node:assert/strict";
import { after, describe, it } from "node:test";
import { closePgPool, pgProbe, pgScoreAt, pgTop, poolOptions } from "./pgScores";

describe("pgScores", () => {
  after(async () => {
    await closePgPool();
  });

  it("tira sslmode=require do pooler para o Node aceitar o chain", () => {
    const opts = poolOptions(
      "postgresql://u:p@aws-0-ca-central-1.pooler.supabase.com:5432/postgres?sslmode=require",
    );
    assert.ok(!opts.connectionString.includes("sslmode"));
    assert.deepEqual(opts.ssl, { rejectUnauthorized: false });
  });

  it("lê hexágonos reais no Supabase quando DATABASE_URL existe", async () => {
    if (!process.env.DATABASE_URL) {
      return;
    }
    assert.equal(await pgProbe(), "up");
    const top = await pgTop("food_service", 3);
    assert.ok(top);
    assert.equal(top.status, "sucesso");
    assert.ok(top.recomendacoes.length >= 1);
    assert.ok(top.recomendacoes[0].h3_index.startsWith("88"));
    const hit = await pgScoreAt(-12.97, -38.5, "food_service");
    assert.ok(hit);
    assert.ok(hit.status === "sucesso" || hit.status === "sem_dados");
  });
});
