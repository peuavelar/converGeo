export function safeNextPath(raw: string | null): string {
  if (!raw) return "/painel";
  if (!raw.startsWith("/")) return "/painel";
  if (raw.startsWith("//")) return "/painel";
  if (raw.includes("://")) return "/painel";
  return raw;
}
