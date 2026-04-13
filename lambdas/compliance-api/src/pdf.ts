/**
 * PDF generation for trust center auditor exports.
 *
 * Produces a clean, single-framework or multi-framework compliance summary
 * suitable for auditor hand-off. Includes a SHA-256 hash of the core content
 * rendered as text at the bottom of each page so tampering with the PDF
 * invalidates the hash.
 */

import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { createHash } from "crypto";

export interface TrustPdfInput {
  tenantName: string;
  tenantSlug: string;
  generatedAt: string;
  overallScore: number;
  totals: { controls: number; pass: number; fail: number; unknown: number };
  frameworks: Array<{
    label: string;
    framework: string;
    controlCount: number;
    passCount: number;
    failCount: number;
    unknownCount: number;
    score: number;
    lastEvaluatedAt: string | null;
  }>;
  controls?: Array<{
    framework: string;
    controlId: string;
    title: string;
    state: "pass" | "fail" | "unknown";
    evidenceCount: number;
    evaluatedAt: string | null;
  }>;
}

const MARGIN_X = 50;
const MARGIN_Y = 60;
const PAGE_WIDTH = 612; // US Letter
const PAGE_HEIGHT = 792;
const LINE_HEIGHT = 14;

type RenderCtx = {
  pdf: PDFDocument;
  page: PDFPage;
  font: PDFFont;
  bold: PDFFont;
  y: number;
};

function newPage(ctx: RenderCtx): RenderCtx {
  const page = ctx.pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  return { ...ctx, page, y: PAGE_HEIGHT - MARGIN_Y };
}

function ensureSpace(ctx: RenderCtx, needed: number): RenderCtx {
  if (ctx.y - needed < MARGIN_Y) return newPage(ctx);
  return ctx;
}

function writeText(
  ctx: RenderCtx,
  text: string,
  opts: { size?: number; bold?: boolean; color?: [number, number, number]; indent?: number } = {},
): RenderCtx {
  const size = opts.size ?? 10;
  const font = opts.bold ? ctx.bold : ctx.font;
  const color = opts.color ?? [0, 0, 0];
  const indent = opts.indent ?? 0;
  const next = ensureSpace(ctx, size + 4);
  next.page.drawText(text, {
    x: MARGIN_X + indent,
    y: next.y - size,
    size,
    font,
    color: rgb(color[0], color[1], color[2]),
  });
  return { ...next, y: next.y - size - 4 };
}

function hr(ctx: RenderCtx): RenderCtx {
  const next = ensureSpace(ctx, 12);
  next.page.drawLine({
    start: { x: MARGIN_X, y: next.y - 4 },
    end: { x: PAGE_WIDTH - MARGIN_X, y: next.y - 4 },
    thickness: 0.5,
    color: rgb(0.85, 0.85, 0.85),
  });
  return { ...next, y: next.y - 12 };
}

function skip(ctx: RenderCtx, pts: number): RenderCtx {
  return { ...ctx, y: ctx.y - pts };
}

function scoreColor(score: number): [number, number, number] {
  if (score >= 80) return [0.1, 0.55, 0.15];
  if (score >= 50) return [0.82, 0.57, 0.05];
  return [0.74, 0.15, 0.15];
}

export async function renderTrustPdf(input: TrustPdfInput): Promise<Buffer> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`${input.tenantName} — Compliance Report`);
  pdf.setAuthor("AtlasIT Trust Center");
  pdf.setCreator("atlasit.pro");
  pdf.setProducer("AtlasIT compliance-api");
  pdf.setCreationDate(new Date(input.generatedAt));

  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  let ctx: RenderCtx = {
    pdf,
    page: pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]),
    font,
    bold,
    y: PAGE_HEIGHT - MARGIN_Y,
  };

  // ── Title page ───────────────────────────────────────────────────────────
  ctx = writeText(ctx, input.tenantName, { size: 22, bold: true });
  ctx = skip(ctx, 4);
  ctx = writeText(ctx, "Compliance Report", { size: 14, color: [0.35, 0.35, 0.35] });
  ctx = skip(ctx, 20);
  ctx = writeText(ctx, `Generated: ${new Date(input.generatedAt).toISOString()}`, {
    size: 10,
    color: [0.4, 0.4, 0.4],
  });
  ctx = writeText(ctx, `Trust Center: https://www.atlasit.pro/trust/${input.tenantSlug}`, {
    size: 10,
    color: [0.2, 0.4, 0.75],
  });

  ctx = skip(ctx, 24);
  ctx = hr(ctx);

  // ── Overall score ────────────────────────────────────────────────────────
  ctx = writeText(ctx, "Overall Compliance Score", { size: 12, bold: true });
  ctx = skip(ctx, 4);
  ctx = writeText(ctx, `${input.overallScore}%`, {
    size: 28,
    bold: true,
    color: scoreColor(input.overallScore),
  });
  ctx = skip(ctx, 4);
  ctx = writeText(
    ctx,
    `${input.totals.pass} passing · ${input.totals.fail} failing · ${input.totals.unknown} unknown · ${input.totals.controls} total controls`,
    { size: 10, color: [0.45, 0.45, 0.45] },
  );

  ctx = skip(ctx, 18);
  ctx = hr(ctx);

  // ── Per-framework summary ────────────────────────────────────────────────
  ctx = writeText(ctx, "Frameworks", { size: 12, bold: true });
  ctx = skip(ctx, 4);

  for (const f of input.frameworks) {
    ctx = ensureSpace(ctx, 40);
    ctx = writeText(ctx, `${f.label}`, { size: 11, bold: true });
    ctx = writeText(
      ctx,
      `Score: ${f.score}%   ·   ${f.passCount} / ${f.controlCount} controls passing`,
      {
        size: 9,
        color: scoreColor(f.score),
        indent: 10,
      },
    );
    ctx = writeText(
      ctx,
      `Fail: ${f.failCount}   ·   Unknown: ${f.unknownCount}   ·   Last evaluated: ${f.lastEvaluatedAt ?? "never"}`,
      {
        size: 9,
        color: [0.45, 0.45, 0.45],
        indent: 10,
      },
    );
    ctx = skip(ctx, 6);
  }

  // ── Per-control detail (if provided) ─────────────────────────────────────
  if (input.controls && input.controls.length > 0) {
    ctx = newPage(ctx);
    ctx = writeText(ctx, "Control Detail", { size: 16, bold: true });
    ctx = skip(ctx, 12);

    let currentFramework = "";
    for (const c of input.controls) {
      if (c.framework !== currentFramework) {
        ctx = skip(ctx, 8);
        ctx = ensureSpace(ctx, 24);
        ctx = writeText(ctx, c.framework, { size: 12, bold: true, color: [0.2, 0.3, 0.55] });
        ctx = skip(ctx, 2);
        currentFramework = c.framework;
      }
      const stateColor: [number, number, number] =
        c.state === "pass"
          ? [0.1, 0.55, 0.15]
          : c.state === "fail"
            ? [0.74, 0.15, 0.15]
            : [0.55, 0.55, 0.55];
      ctx = writeText(ctx, `${c.state.toUpperCase().padEnd(8)} ${c.controlId}  —  ${c.title}`, {
        size: 9,
        color: stateColor,
      });
      ctx = writeText(
        ctx,
        `Evidence: ${c.evidenceCount} record(s) · evaluated ${c.evaluatedAt ?? "never"}`,
        {
          size: 8,
          color: [0.5, 0.5, 0.5],
          indent: 10,
        },
      );
    }
  }

  // ── Footer tamper-detection hash on every page ───────────────────────────
  const payloadForHash = JSON.stringify({
    tenant: input.tenantSlug,
    generatedAt: input.generatedAt,
    overallScore: input.overallScore,
    totals: input.totals,
    frameworks: input.frameworks.map((f) => ({
      f: f.framework,
      s: f.score,
      p: f.passCount,
      c: f.controlCount,
    })),
  });
  const hash = createHash("sha256").update(payloadForHash).digest("hex");

  for (const page of pdf.getPages()) {
    page.drawText(`AtlasIT · content-hash: ${hash.slice(0, 32)}...${hash.slice(-8)}`, {
      x: MARGIN_X,
      y: 30,
      size: 7,
      font,
      color: rgb(0.6, 0.6, 0.6),
    });
    page.drawText(`atlasit.pro/trust/${input.tenantSlug}`, {
      x: PAGE_WIDTH - MARGIN_X - 150,
      y: 30,
      size: 7,
      font,
      color: rgb(0.4, 0.4, 0.6),
    });
  }

  const bytes = await pdf.save();
  return Buffer.from(bytes);
}
