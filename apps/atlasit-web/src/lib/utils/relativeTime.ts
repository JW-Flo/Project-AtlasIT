// Lightweight relative time formatter with Intl fallback.

const rtf =
  typeof Intl !== "undefined" && (Intl as any).RelativeTimeFormat
    ? new Intl.RelativeTimeFormat(undefined, { numeric: "auto" })
    : null;

// thresholds in seconds
const intervals: Array<[number, number]> = [
  [60, 1], // seconds
  [3600, 60], // minutes
  [86400, 3600], // hours
  [604800, 86400], // days
  [2629800, 604800], // weeks (~month/4)
  [31557600, 2629800], // months (~year/12)
];

export function relativeTime(iso: string | number | Date): string {
  const now = Date.now();
  const ts = normalizeInputTs(iso, now);
  const diffSeconds = Math.floor((ts - now) / 1000); // negative when in past
  const abs = Math.abs(diffSeconds);

  if (!rtf) return fallbackRelative(abs, ts);

  const match = findInterval(abs, diffSeconds);
  if (match) return match;

  const years = Math.round(diffSeconds / 31557600);
  return rtf.format(years, "year");
}

function normalizeInputTs(input: string | number | Date, now: number): number {
  if (typeof input === "number") return input;
  if (typeof input === "string") {
    const parsed = Date.parse(input);
    return Number.isFinite(parsed) ? parsed : now;
  }
  if (input instanceof Date) return input.getTime();
  return now;
}

function fallbackRelative(abs: number, ts: number): string {
  if (abs < 60) return "just now";
  if (abs < 3600) return `${Math.round(abs / 60)}m ago`;
  if (abs < 86400) return `${Math.round(abs / 3600)}h ago`;
  if (abs < 604800) return `${Math.round(abs / 86400)}d ago`;
  return new Date(ts).toLocaleDateString();
}

function findInterval(abs: number, diffSeconds: number): string | null {
  for (const [threshold, divisor] of intervals) {
    if (abs < threshold) {
      const value = Math.round(diffSeconds / divisor);
      return rtf!.format(value, unitForDivisor(divisor));
    }
  }
  return null;
}

function unitForDivisor(divisor: number): Intl.RelativeTimeFormatUnit {
  switch (divisor) {
    case 1:
      return "second";
    case 60:
      return "minute";
    case 3600:
      return "hour";
    case 86400:
      return "day";
    case 604800:
      return "week";
    case 2629800:
      return "month";
    default:
      return "day";
  }
}

// Extended granular relative time for badges & tests (supports future times)
export function robustRelativeTime(
  input: string | number | Date,
  now: Date = new Date(),
): string {
  const date = new Date(input);
  if (isNaN(date.getTime())) return "";
  const diffMs = date.getTime() - now.getTime();
  const absMs = Math.abs(diffMs);
  const direction = diffMs > 0 ? "in" : "ago";
  const sec = Math.round(absMs / 1000);
  const minute = 60;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;
  const month = 30 * day;
  const year = 365 * day;
  function formatTimeSegment(value: number, unit: string) {
    return value + unit;
  }
  if (sec < 5) return direction === "in" ? "soon" : "just now";
  if (sec < minute) return `${formatTimeSegment(sec, "s")} ${direction}`;
  const m = Math.round(sec / minute);
  if (m < 60) return `${formatTimeSegment(m, "m")} ${direction}`;
  const h = Math.round(sec / hour);
  if (h < 24) return `${formatTimeSegment(h, "h")} ${direction}`;
  const d = Math.round(sec / day);
  if (d < 7) return `${formatTimeSegment(d, "d")} ${direction}`;
  const w = Math.round(sec / week);
  if (w < 5) return `${formatTimeSegment(w, "w")} ${direction}`;
  const mo = Math.round(sec / month);
  if (mo < 12) return `${formatTimeSegment(mo, "mo")} ${direction}`;
  const y = Math.round(sec / year);
  return `${formatTimeSegment(y, "y")} ${direction}`;
}

// Adaptive ticker to refresh relative timestamps; returns a cancel function
export function startRelativeTimeTicker(cb: () => void): () => void {
  let cancelled = false;
  function schedule(interval: number) {
    if (cancelled) return;
    setTimeout(() => {
      if (!cancelled) {
        cb();
        schedule(Math.min(interval * 1.5, 60000));
      }
    }, interval);
  }
  schedule(15000); // start at 15s
  return () => {
    cancelled = true;
  };
}
