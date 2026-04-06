/** Injection-safe CSV cell escaping. Prefixes formula triggers with ' to prevent CSV injection. */
export function escapeCSV(value: string | number | boolean | null | undefined): string {
  if (value == null) return "";
  const str = String(value);
  const safe = /^[=+\-@\t\r]/.test(str) ? "'" + str : str;
  if (safe.includes(",") || safe.includes('"') || safe.includes("\n") || safe.includes("\r")) {
    return '"' + safe.replace(/"/g, '""') + '"';
  }
  return safe;
}

/** Build a CSV string from headers and rows. */
export function buildCSV(
  headers: string[],
  rows: (string | number | boolean | null | undefined)[][],
): string {
  const lines = [headers.map(escapeCSV).join(",")];
  for (const row of rows) {
    lines.push(row.map(escapeCSV).join(","));
  }
  return lines.join("\n");
}

/** Create a downloadable CSV Response. */
export function csvResponse(csv: string, filename: string): Response {
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
