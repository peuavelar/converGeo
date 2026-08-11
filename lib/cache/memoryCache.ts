/** Cache em memória do BFF (dev/prod single instance). */

type Entry<T> = { value: T; expires: number };

const store = new Map<string, Entry<unknown>>();

export function cacheGet<T>(key: string): T | null {
  const hit = store.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expires) {
    store.delete(key);
    return null;
  }
  return hit.value as T;
}

export function cacheSet<T>(key: string, value: T, ttlMs: number) {
  store.set(key, { value, expires: Date.now() + ttlMs });
}

export function nearbyCacheKey(lat: number, lng: number, radiusM: number) {
  return `nearby:${lat.toFixed(3)}:${lng.toFixed(3)}:${radiusM}`;
}
