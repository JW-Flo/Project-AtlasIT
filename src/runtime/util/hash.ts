import { createHash } from "node:crypto";

/**
 * Produces a deterministic hash for a collection of strings, ignoring order.
 */
export function hashStrings(strings: string[]): string {
  const normalized = [...strings]
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

  const hash = createHash("sha1");
  for (const value of normalized) {
    hash.update(value, "utf8");
    hash.update("\0");
  }

  return hash.digest("hex");
}
