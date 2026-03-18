export const TRUST_FRAMEWORK_OPTIONS = [
  "SOC 2",
  "ISO 27001",
  "NIST CSF",
  "HIPAA",
  "GDPR",
] as const;

export interface TrustSettings {
  isPublic: boolean;
  visibleFrameworks: string[];
}

export function normalizeTrustSettings(input: Partial<TrustSettings> | null | undefined): TrustSettings {
  const incoming = Array.isArray(input?.visibleFrameworks) ? input?.visibleFrameworks : [];
  const deduped = Array.from(new Set(incoming)).filter((fw) => TRUST_FRAMEWORK_OPTIONS.includes(fw as any));

  return {
    isPublic: Boolean(input?.isPublic),
    visibleFrameworks: deduped,
  };
}

export function toggleFramework(
  selected: string[],
  framework: string,
  checked: boolean,
): string[] {
  if (!TRUST_FRAMEWORK_OPTIONS.includes(framework as any)) return selected;

  if (checked) {
    return Array.from(new Set([...selected, framework]));
  }

  return selected.filter((value) => value !== framework);
}
