/** Convert snake_case keys to camelCase recursively */
export function toCamel<T>(obj: unknown): T {
  if (Array.isArray(obj)) return obj.map(toCamel) as T;
  if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([k, v]) => [
        k.replace(/_([a-z])/g, (_, c) => c.toUpperCase()),
        toCamel(v),
      ])
    ) as T;
  }
  return obj as T;
}

/** Convert camelCase keys to snake_case recursively (for writes to D1) */
export function toSnake<T>(obj: unknown): T {
  if (Array.isArray(obj)) return obj.map(toSnake) as T;
  if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([k, v]) => [
        k.replace(/([A-Z])/g, '_$1').toLowerCase(),
        toSnake(v),
      ])
    ) as T;
  }
  return obj as T;
}
