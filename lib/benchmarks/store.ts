import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import type {
  CollectionRun,
  ExternalListingSnapshot,
  PriceBenchmark,
} from "./types";

const DEFAULT_DIR = path.join(process.cwd(), "data", "benchmarks");

function storeDir(): string {
  return (
    process.env.BENCHMARK_STORE_DIR ||
    (process.env.VERCEL ? "/tmp/convergeo-benchmarks" : DEFAULT_DIR)
  );
}

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(file, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    // Fallback para arquivos versionados no repo
    try {
      const committed = path.join(DEFAULT_DIR, path.basename(file));
      const raw = await fs.readFile(committed, "utf8");
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }
}

async function writeJson(file: string, data: unknown) {
  await ensureDir(path.dirname(file));
  await fs.writeFile(file, JSON.stringify(data, null, 2), "utf8");
}

export function snapshotRawHash(
  parts: Omit<ExternalListingSnapshot, "rawHash" | "id"> & { sourceId: string },
): string {
  const payload = [
    parts.source,
    parts.sourceId,
    parts.price,
    parts.usableArea,
    parts.bedrooms,
    parts.neighborhood,
    parts.businessType,
  ].join("|");
  return createHash("sha256").update(payload).digest("hex").slice(0, 16);
}

export async function loadSnapshots(): Promise<ExternalListingSnapshot[]> {
  return readJson(path.join(storeDir(), "external_listing_snapshots.json"), []);
}

export async function saveSnapshots(rows: ExternalListingSnapshot[]) {
  await writeJson(
    path.join(storeDir(), "external_listing_snapshots.json"),
    rows,
  );
}

export async function loadBenchmarks(): Promise<PriceBenchmark[]> {
  return readJson(path.join(storeDir(), "price_benchmarks.json"), []);
}

export async function saveBenchmarks(rows: PriceBenchmark[]) {
  await writeJson(path.join(storeDir(), "price_benchmarks.json"), rows);
}

export async function loadCollectionRuns(): Promise<CollectionRun[]> {
  return readJson(path.join(storeDir(), "collection_runs.json"), []);
}

export async function appendCollectionRun(run: CollectionRun) {
  const all = await loadCollectionRuns();
  all.push(run);
  await writeJson(path.join(storeDir(), "collection_runs.json"), all);
}

/** Sync helpers for UI/server components that already have seed JSON. */
export function committedDir(): string {
  return DEFAULT_DIR;
}
