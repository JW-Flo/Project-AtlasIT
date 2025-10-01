import { findControlKeyByCandidates, upsertControlEvidenceLink } from "./store";

function deriveCandidatesFromPack(pack: string): string[] {
  if (!pack) return [];
  const normalized = pack.trim();
  if (!normalized) return [];
  const segments = normalized.split("_").filter(Boolean);
  const candidates: string[] = [];
  if (segments.length >= 2) {
    candidates.push(`${segments[0]}_${segments[1]}`);
  }
  candidates.push(segments[0]);
  return Array.from(new Set(candidates));
}

export async function linkEvidencePack(
  db: D1Database,
  pack: string,
  evidenceHash: string,
  tenantId: string,
) {
  const candidates = deriveCandidatesFromPack(pack);
  if (candidates.length === 0) return;
  const controlKey = await findControlKeyByCandidates(db, candidates);
  if (!controlKey) return;
  await upsertControlEvidenceLink(db, controlKey, evidenceHash, tenantId);
}
