/** Alterna id em lista com teto (FIFO quando cheio). */
export function toggleCappedId(ids: string[], id: string, max = 3): string[] {
  if (ids.includes(id)) return ids.filter((x) => x !== id);
  if (ids.length >= max) return [...ids.slice(1), id];
  return [...ids, id];
}

/** Alterna item `{ id }` com o mesmo teto. */
export function toggleCappedItem<T extends { id: string }>(
  items: T[],
  item: T,
  max = 3,
): T[] {
  if (items.some((x) => x.id === item.id)) {
    return items.filter((x) => x.id !== item.id);
  }
  if (items.length >= max) return [...items.slice(1), item];
  return [...items, item];
}

/** Adiciona sem duplicar; ignora se já no teto. */
export function pushCappedId(ids: string[], id: string, max = 3): string[] {
  if (ids.includes(id) || ids.length >= max) return ids;
  return [...ids, id];
}

export function pushCappedItem<T extends { id: string }>(
  items: T[],
  item: T,
  max = 3,
): T[] {
  if (items.some((x) => x.id === item.id) || items.length >= max) return items;
  return [...items, item];
}
