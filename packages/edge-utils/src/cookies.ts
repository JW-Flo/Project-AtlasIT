export function parseCookie(
  header: string | null | undefined,
  key: string,
): string | null {
  if (!header) return null;
  const parts = header.split(";");
  for (const part of parts) {
    const [k, v] = part.trim().split("=", 2);
    if (k === key) return decodeURIComponent(v || "");
  }
  return null;
}
