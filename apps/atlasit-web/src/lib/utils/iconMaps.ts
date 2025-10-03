export type Severity = "critical" | "high" | "medium" | "low" | "info" | "warn";

// Map event type to an icon-like glyph (unicode) to avoid pulling extra icon libraries.
export function mapEventTypeToIcon(type: string | undefined): string {
  if (!type) return "•";
  if (type.startsWith("policy.")) return "⚖️";
  if (type.startsWith("evidence.")) return "🧾";
  if (type.startsWith("incident.")) return "🚨";
  if (type.startsWith("workflow.")) return "🔁";
  if (type.startsWith("access.")) return "🔐";
  return "•";
}

// Translate severity to a CSS class; actual color mapping lives in global or component styles.
export function mapSeverityToClass(sev: Severity | string | undefined): string {
  switch (sev) {
    case "critical":
      return "sev-critical";
    case "high":
      return "sev-high";
    case "medium":
      return "sev-medium";
    case "low":
      return "sev-low";
    case "warn":
      return "sev-warn";
    default:
      return "sev-info";
  }
}

export function severityAriaLabel(sev: Severity | string | undefined): string {
  return (sev || "info") + " severity";
}
