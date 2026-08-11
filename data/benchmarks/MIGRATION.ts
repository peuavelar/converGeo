/**
 * Migração schema v1 — tabelas JSON em data/benchmarks/.
 * Rodar: npm run seed:benchmarks
 */
export const BENCHMARK_SCHEMA_VERSION = 1;

export const BENCHMARK_TABLES = [
  "external_listing_snapshots",
  "price_benchmarks",
  "collection_runs",
] as const;
