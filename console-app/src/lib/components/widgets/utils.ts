/** Shared helpers used by multiple widgets. */

export function computeGrade(score: number): string {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

export function gradeVariant(grade: string): "success" | "default" | "warning" | "destructive" {
  if (grade === "A") return "success";
  if (grade === "B") return "default";
  if (grade === "C" || grade === "D") return "warning";
  return "destructive";
}

export function scoreBadgeVariant(score: number): "success" | "warning" | "destructive" {
  if (score >= 80) return "success";
  if (score >= 60) return "warning";
  return "destructive";
}

export function statusVariant(
  status: string,
): "success" | "warning" | "destructive" | "secondary" | "default" {
  if (status === "verified" || status === "implemented") return "success";
  if (status === "in_progress") return "warning";
  if (status === "not_started") return "destructive";
  return "secondary";
}

export function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    not_started: "Not Started",
    in_progress: "In Progress",
    implemented: "Implemented",
    verified: "Verified",
  };
  return labels[status] ?? status;
}

export function formatDuration(ms: number | null): string {
  if (!ms || ms <= 0) return "--";
  if (ms < 1000) return `${ms}ms`;
  return `${Math.round(ms / 1000)}s`;
}

export function shortWeek(week: string): string {
  if (week.length === 10) {
    const d = new Date(week);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  return week.slice(5);
}

export function triggerLabel(value: unknown): string {
  if (!value) return "manual";
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    return String(obj.type ?? obj.name ?? obj.event ?? "trigger");
  }
  return "trigger";
}

/** Compute SVG polyline points for a line chart. */
export function trendPolyline(
  points: Array<{ score: number }>,
  width: number,
  height: number,
  padding = 8,
): string {
  if (points.length === 0) return "";
  const scores = points.map((p) => p.score);
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const range = max - min || 1;
  const w = width - padding * 2;
  const h = height - padding * 2;
  return points
    .map((p, i) => {
      const x = padding + (points.length === 1 ? w / 2 : (i / (points.length - 1)) * w);
      const y = padding + h - ((p.score - min) / range) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

/** Compute SVG area path under a polyline. */
export function trendAreaPath(
  points: Array<{ score: number }>,
  width: number,
  height: number,
  padding = 8,
): string {
  if (points.length === 0) return "";
  const polyline = trendPolyline(points, width, height, padding);
  const coords = polyline.split(" ");
  const firstX = coords[0].split(",")[0];
  const lastX = coords[coords.length - 1].split(",")[0];
  const bottom = height - padding;
  return `M ${firstX},${bottom} L ${polyline} L ${lastX},${bottom} Z`;
}

/** Compute bar positions for a bar chart. */
export function barRects(
  points: Array<{ count: number; week: string }>,
  width: number,
  height: number,
  padding = 8,
): Array<{ x: number; y: number; w: number; h: number; count: number; week: string }> {
  if (points.length === 0) return [];
  const maxCount = Math.max(...points.map((p) => p.count), 1);
  const usableW = width - padding * 2;
  const usableH = height - padding * 2;
  const barW = Math.max(2, usableW / points.length - 2);
  return points.map((p, i) => {
    const barH = (p.count / maxCount) * usableH;
    return {
      x: padding + (i / points.length) * usableW + 1,
      y: padding + usableH - barH,
      w: barW,
      h: Math.max(1, barH),
      count: p.count,
      week: p.week,
    };
  });
}
