export const TRUST_FRAMEWORK_OPTIONS = ["SOC 2", "ISO 27001", "NIST CSF", "HIPAA", "GDPR"] as const;

export type ControlVisibilityLevel = "public" | "nda" | "private";

export interface TrustSettings {
  isPublic: boolean;
  visibleFrameworks: string[];
  controlVisibility: Record<string, ControlVisibilityLevel>;
}

export function normalizeTrustSettings(
  input: Partial<TrustSettings> | null | undefined,
): TrustSettings {
  const incoming = Array.isArray(input?.visibleFrameworks) ? input?.visibleFrameworks : [];
  const deduped = Array.from(new Set(incoming)).filter((fw) =>
    TRUST_FRAMEWORK_OPTIONS.includes(fw as any),
  );

  const rawVis = input?.controlVisibility;
  const controlVisibility: Record<string, ControlVisibilityLevel> = {};
  if (rawVis && typeof rawVis === "object") {
    const validLevels = new Set<ControlVisibilityLevel>(["public", "nda", "private"]);
    for (const [key, val] of Object.entries(rawVis)) {
      if (validLevels.has(val as ControlVisibilityLevel)) {
        controlVisibility[key] = val as ControlVisibilityLevel;
      }
    }
  }

  return {
    isPublic: Boolean(input?.isPublic),
    visibleFrameworks: deduped,
    controlVisibility,
  };
}

export function toggleFramework(selected: string[], framework: string, checked: boolean): string[] {
  if (!TRUST_FRAMEWORK_OPTIONS.includes(framework as any)) return selected;

  if (checked) {
    return Array.from(new Set([...selected, framework]));
  }

  return selected.filter((value) => value !== framework);
}
