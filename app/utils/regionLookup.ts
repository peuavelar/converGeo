import { NEIGHBORHOODS, type Neighborhood } from "../data/neighborhoods";

export function neighborhoodById(id: string): Neighborhood | undefined {
  return NEIGHBORHOODS.find((x) => x.id === id);
}

export function neighborhoodByNameQuery(q: string): Neighborhood | undefined {
  const needle = q.trim().toLowerCase();
  if (!needle) return undefined;
  return NEIGHBORHOODS.find((n) => n.name.toLowerCase().includes(needle));
}
