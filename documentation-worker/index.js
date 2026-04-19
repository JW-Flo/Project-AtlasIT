const PRIMARY_DOC_KEY = "ATLASIT_PLATFORM.md";
const LEGACY_DOC_KEY = "PROJECT_IGNITE.md";

function html(body, status = 200) {
  return new Response(body, {
    status,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

// Minimal markdown → HTML (headings, bold, code, lists, paragraphs)
function mdToHtml(md) {
  return md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`)
    .replace(/\n\n/g, "</p><p>")
    .replace(/^(?!<[hul])/gm, "")
    .replace(/^(.+)$/gm, (line) => (line.startsWith("<") ? line : `<p>${line}</p>`));
}

function docsPage(docContent) {
  const hasContent = Boolean(docContent);
  const bodyHtml = hasContent
    ? `<div class="doc">${mdToHtml(docContent)}</div>`
    : `<div class="empty">
        <div class="empty-icon">📚</div>
        <h2>Documentation coming soon</h2>
        <p>The AtlasIT platform documentation is being written. Check back shortly.</p>
        <div class="links">
          <a href="https://www.atlasit.pro">Platform →</a>
          <a href="https://www.atlasit.pro/support">Support →</a>
          <a href="https://www.atlasit.pro/status">Status →</a>
        </div>
      </div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Documentation · AtlasIT</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #f8f9fb; color: #1a1a2e; line-height: 1.6; }
    header { background: #fff; border-bottom: 1px solid #e2e8f0; padding: 14px 24px; display: flex; align-items: center; gap: 12px; position: sticky; top: 0; z-index: 10; }
    .logo { width: 32px; height: 32px; background: hsl(252,87%,58%); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 14px; flex-shrink: 0; }
    .brand { font-weight: 600; color: #1a1a2e; font-size: 15px; }
    .brand span { color: #94a3b8; font-weight: 400; margin: 0 6px; }
    .badge { background: hsl(252,87%,96%); color: hsl(252,87%,48%); border-radius: 999px; padding: 2px 10px; font-size: 11px; font-weight: 500; }
    main { max-width: 800px; margin: 0 auto; padding: 40px 24px 80px; }
    .empty { text-align: center; padding: 80px 24px; }
    .empty-icon { font-size: 48px; margin-bottom: 16px; }
    .empty h2 { font-size: 22px; font-weight: 600; color: #1a1a2e; margin-bottom: 8px; }
    .empty p { color: #64748b; font-size: 14px; margin-bottom: 28px; }
    .links { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
    .links a { background: hsl(252,87%,58%); color: #fff; text-decoration: none; padding: 8px 20px; border-radius: 8px; font-size: 13px; font-weight: 500; transition: opacity .15s; }
    .links a:hover { opacity: .85; }
    .doc h1 { font-size: 28px; font-weight: 700; margin-bottom: 8px; }
    .doc h2 { font-size: 20px; font-weight: 600; margin: 32px 0 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
    .doc h3 { font-size: 16px; font-weight: 600; margin: 20px 0 6px; }
    .doc p { margin-bottom: 12px; color: #334155; font-size: 14px; }
    .doc ul { margin: 0 0 12px 20px; }
    .doc li { font-size: 14px; color: #334155; margin-bottom: 4px; }
    .doc code { background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 4px; padding: 1px 5px; font-size: 13px; font-family: "SF Mono", monospace; }
    footer { text-align: center; padding: 24px; color: #94a3b8; font-size: 12px; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <header>
    <div class="logo">A</div>
    <div>
      <span class="brand">AtlasIT <span>/</span> Documentation</span>
    </div>
    <span class="badge">Platform Docs</span>
  </header>
  <main>${bodyHtml}</main>
  <footer>© ${new Date().getFullYear()} AtlasIT · <a href="https://www.atlasit.pro" style="color:inherit">atlasit.pro</a></footer>
</body>
</html>`;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/health" || url.pathname === "/healthz") {
      return json({ status: "ok", service: "documentation-worker" });
    }

    // API: GET /docs — returns JSON for programmatic access
    if (request.method === "GET" && (url.pathname === "/docs" || url.pathname === "/docs/index")) {
      const store = env.DOCS ?? env.DOCS_KV ?? null;
      let doc = null;
      let source = "none";
      if (store) {
        doc = await store.get(PRIMARY_DOC_KEY);
        source = doc ? "primary" : "none";
        if (!doc) {
          doc = await store.get(LEGACY_DOC_KEY);
          source = doc ? "legacy" : "none";
        }
      }
      return json({
        success: true,
        doc,
        source,
        primaryKey: PRIMARY_DOC_KEY,
        legacyKey: LEGACY_DOC_KEY,
      });
    }

    // API: PUT /docs — write documentation
    if (request.method === "PUT" && url.pathname === "/docs") {
      const store = env.DOCS ?? env.DOCS_KV ?? null;
      if (!store) return json({ error: "Docs storage not configured" }, 500);
      const body = await request.text();
      if (!body || body.length > 128 * 1024)
        return json({ error: "Invalid or too-large payload" }, 400);
      await store.put(PRIMARY_DOC_KEY, body);
      return json({ ok: true });
    }

    // POST /update (legacy section-based update)
    if (request.method === "POST" && url.pathname === "/update") {
      const store = env.DOCS ?? env.DOCS_KV ?? null;
      if (!store) return json({ error: "Docs storage not configured" }, 500);
      const { section, content } = await request.json().catch(() => ({}));
      if (!section || !content) return json({ error: "section and content required" }, 400);
      let current = (await store.get(PRIMARY_DOC_KEY)) ?? (await store.get(LEGACY_DOC_KEY)) ?? "";
      const re = new RegExp(`## ${section}[\\s\\S]*?(?=##|$)`);
      const updated = re.test(current)
        ? current.replace(re, `## ${section}\n\n${content}\n\n`)
        : current + `\n\n## ${section}\n\n${content}\n\n`;
      await store.put(PRIMARY_DOC_KEY, updated);
      return json({ ok: true });
    }

    // HTML: root + /docs/ paths — serve rendered documentation page
    const store = env.DOCS ?? env.DOCS_KV ?? null;
    let docContent = null;
    if (store) {
      docContent = await store.get(PRIMARY_DOC_KEY);
      if (!docContent) docContent = await store.get(LEGACY_DOC_KEY);
    }
    return html(docsPage(docContent));
  },
};
