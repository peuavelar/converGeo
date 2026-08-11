import { NextResponse } from "next/server";
import { runBenchmarkCollection } from "@/lib/benchmarks/collect";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Cron semanal — coleta de referência de preço (não é busca de usuário).
 * Protegido por CRON_SECRET (Vercel Cron envia Authorization: Bearer …).
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = request.headers.get("authorization") || "";
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const result = await runBenchmarkCollection();
  return NextResponse.json({
    ok: true,
    runId: result.run.id,
    itemsCollected: result.run.itemsCollected,
    snapshotsTotal: result.snapshotsTotal,
    benchmarksTotal: result.benchmarksTotal,
    mode: result.run.mode,
    errors: result.run.errors,
  });
}
