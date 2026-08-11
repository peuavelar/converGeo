/**
 * Job de coleta — NUNCA chamado em request de usuário do marketplace.
 * Cron Vercel / script CLI apenas.
 */

import { COLLECTION_CUTS } from "./cuts";
import { computePriceBenchmarks } from "./compute";
import { simulateCollectionSnapshots } from "./simulate";
import {
  appendCollectionRun,
  loadBenchmarks,
  loadSnapshots,
  saveBenchmarks,
  saveSnapshots,
} from "./store";
import type { CollectionRun, ExternalListingSnapshot } from "./types";

export type CollectResult = {
  run: CollectionRun;
  snapshotsTotal: number;
  benchmarksTotal: number;
};

function mergeSnapshots(
  existing: ExternalListingSnapshot[],
  incoming: ExternalListingSnapshot[],
): ExternalListingSnapshot[] {
  const map = new Map(existing.map((s) => [s.id, s]));
  for (const row of incoming) {
    map.set(row.id, row);
  }
  return [...map.values()];
}

/**
 * Coleta semanal. Sem GECKOAPI_KEY → simulação calibrada nos recortes.
 * Com chave → hoje ainda usa simulação + marca mixed (hook Gecko reservado;
 * não há chamada em request de usuário).
 */
export async function runBenchmarkCollection(opts?: {
  seed?: number;
  now?: Date;
}): Promise<CollectResult> {
  const startedAt = (opts?.now ?? new Date()).toISOString();
  const runId = `run-${startedAt.slice(0, 10)}-${Date.now().toString(36)}`;
  const hasKey = Boolean(process.env.GECKOAPI_KEY?.trim());
  const errors: string[] = [];
  const cutsProcessed: string[] = [];

  let collected: ExternalListingSnapshot[] = [];
  let creditsEstimated = 0;
  let mode: CollectionRun["mode"] = "simulated";

  try {
    // Gecko em background (não-UI): se houver chave, ainda simulamos nesta
    // fase front-only e registramos crédito estimado 0 — evita gastar créditos
    // até o backend Python assumir o extract. Documentado no README.
    if (hasKey) {
      mode = "mixed";
      errors.push(
        "GECKOAPI_KEY presente, mas extract real fica no worker backend; usando simulação local nesta execução.",
      );
    }

    collected = simulateCollectionSnapshots({
      capturedAt: startedAt,
      seed: opts?.seed ?? Math.floor(Date.parse(startedAt) / 86_400_000),
    });
    cutsProcessed.push(...COLLECTION_CUTS.map((c) => c.id));
    creditsEstimated = hasKey ? 0 : 0;
  } catch (err) {
    errors.push(err instanceof Error ? err.message : String(err));
  }

  const existing = await loadSnapshots();
  const merged = mergeSnapshots(existing, collected);
  await saveSnapshots(merged);

  const previous = await loadBenchmarks();
  const benches = computePriceBenchmarks(merged, {
    previous,
    now: opts?.now ?? new Date(),
  });
  await saveBenchmarks(benches);

  const finishedAt = new Date().toISOString();
  const run: CollectionRun = {
    id: runId,
    startedAt,
    finishedAt,
    cutsProcessed,
    itemsCollected: collected.length,
    creditsEstimated,
    errors,
    mode,
  };
  await appendCollectionRun(run);

  return {
    run,
    snapshotsTotal: merged.length,
    benchmarksTotal: benches.length,
  };
}
