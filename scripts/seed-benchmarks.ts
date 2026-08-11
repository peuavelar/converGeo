import { runBenchmarkCollection } from "../lib/benchmarks/collect";
import { computePriceBenchmarks } from "../lib/benchmarks/compute";
import { loadBenchmarks, loadSnapshots, saveBenchmarks, saveSnapshots } from "../lib/benchmarks/store";
import path from "node:path";

/**
 * Migração / seed: gera 3 coletas históricas em data/benchmarks/
 * para valorização (collectionCount >= 3) e relatório.
 *
 *   BENCHMARK_STORE_DIR=./data/benchmarks npx tsx scripts/seed-benchmarks.ts
 */
async function main() {
  process.env.BENCHMARK_STORE_DIR = path.join(
    process.cwd(),
    "data",
    "benchmarks",
  );

  const { writeFile } = await import("node:fs/promises");
  const dir = process.env.BENCHMARK_STORE_DIR;
  await writeFile(`${dir}/collection_runs.json`, "[]\n");
  await saveSnapshots([]);
  await saveBenchmarks([]);

  const dates = [
    new Date("2026-05-12T12:00:00.000Z"),
    new Date("2026-06-16T12:00:00.000Z"),
    new Date("2026-07-21T12:00:00.000Z"),
    new Date("2026-08-11T12:00:00.000Z"),
  ];

  for (let i = 0; i < dates.length; i++) {
    const result = await runBenchmarkCollection({
      now: dates[i],
      seed: 1000 + i * 17,
    });
    console.log(
      `coleta ${i + 1}: items=${result.run.itemsCollected} benches=${result.benchmarksTotal}`,
    );
  }

  const snaps = await loadSnapshots();
  const benches = await loadBenchmarks();
  // Recompute final once more for consistency
  const finalBenches = computePriceBenchmarks(snaps, {
    previous: benches,
    now: dates[dates.length - 1],
  });
  await saveBenchmarks(finalBenches);

  console.log(
    JSON.stringify(
      {
        snapshots: snaps.length,
        benchmarks: finalBenches.length,
        sample: finalBenches.slice(0, 3),
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
