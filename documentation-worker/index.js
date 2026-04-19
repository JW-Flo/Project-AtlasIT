// Documentation pages — each stored independently in KV
const PAGES = [
  { slug: "index", label: "Overview", icon: "🏠" },
  { slug: "getting-started", label: "Getting Started", icon: "🚀" },
  { slug: "compliance", label: "Compliance", icon: "🛡️" },
  { slug: "automation", label: "Automation", icon: "⚡" },
  { slug: "integrations", label: "Integrations", icon: "🔌" },
  { slug: "api", label: "API Reference", icon: "📡" },
  { slug: "security", label: "Security & Trust", icon: "🔒" },
];

// Legacy flat-doc keys (kept for backward compat)
const PRIMARY_DOC_KEY = "ATLASIT_PLATFORM.md";
const LEGACY_DOC_KEY = "PROJECT_IGNITE.md";

function pageKey(slug) {
  return `page:${slug}`;
}

function html(body, status = 200) {
  return new Response(body, { status, headers: { "content-type": "text/html; charset=utf-8" } });
}
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

// Markdown → HTML (headings, bold, italic, inline code, fenced code blocks, lists, paragraphs)
function mdToHtml(md) {
  const lines = md.split("\n");
  const out = [];
  let inCode = false,
    codeLang = "",
    codeLines = [];
  let inList = false;

  function flushList() {
    if (inList) {
      out.push("</ul>");
      inList = false;
    }
  }
  function flushCode() {
    const escaped = codeLines
      .join("\n")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    out.push(
      `<pre><code${codeLang ? ` class="language-${codeLang}"` : ""}>${escaped}</code></pre>`,
    );
    codeLines = [];
    codeLang = "";
    inCode = false;
  }

  for (const raw of lines) {
    if (raw.startsWith("```")) {
      if (inCode) {
        flushCode();
      } else {
        flushList();
        inCode = true;
        codeLang = raw.slice(3).trim();
      }
      continue;
    }
    if (inCode) {
      codeLines.push(raw);
      continue;
    }

    const line = raw
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

    if (/^### /.test(raw)) {
      flushList();
      out.push(`<h3>${line.slice(4)}</h3>`);
    } else if (/^## /.test(raw)) {
      flushList();
      out.push(`<h2>${line.slice(3)}</h2>`);
    } else if (/^# /.test(raw)) {
      flushList();
      out.push(`<h1>${line.slice(2)}</h1>`);
    } else if (/^- /.test(raw)) {
      if (!inList) {
        out.push("<ul>");
        inList = true;
      }
      out.push(`<li>${line.slice(2)}</li>`);
    } else if (raw.trim() === "") {
      flushList();
    } else {
      flushList();
      out.push(`<p>${line}</p>`);
    }
  }
  flushList();
  if (inCode) flushCode();
  return out.join("\n");
}

function docsPage(slug, content, allPages) {
  const currentPage = allPages.find((p) => p.slug === slug) ?? allPages[0];
  const title = `${currentPage.label} · AtlasIT Docs`;

  const navItems = allPages
    .map((p) => {
      const active = p.slug === slug;
      const href = p.slug === "index" ? "/" : `/${p.slug}`;
      return `<a href="${href}" class="nav-item${active ? " active" : ""}">
      <span class="nav-icon">${p.icon}</span>${p.label}
    </a>`;
    })
    .join("");

  const bodyHtml = content
    ? `<article class="doc">${mdToHtml(content)}</article>`
    : `<div class="empty">
        <div class="empty-icon">📄</div>
        <h2>${currentPage.label}</h2>
        <p>This section is being written. Check back shortly.</p>
        <div class="links">
          <a href="https://www.atlasit.pro">Platform →</a>
          <a href="https://www.atlasit.pro/support">Support →</a>
        </div>
      </div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root { --primary: hsl(252,87%,58%); --primary-light: hsl(252,87%,96%); --primary-text: hsl(252,87%,48%); }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f8f9fb; color: #1a1a2e; line-height: 1.6; min-height: 100vh; }

    /* Header */
    .site-header { background: #fff; border-bottom: 1px solid #e2e8f0; padding: 0 24px; display: flex; align-items: center; gap: 16px; height: 56px; position: sticky; top: 0; z-index: 20; }
    .logo { width: 32px; height: 32px; background: var(--primary); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 14px; flex-shrink: 0; }
    .header-brand { font-weight: 600; color: #1a1a2e; font-size: 15px; }
    .header-sep { color: #cbd5e1; margin: 0 4px; }
    .header-sub { color: #64748b; font-weight: 400; }
    .header-badge { background: var(--primary-light); color: var(--primary-text); border-radius: 999px; padding: 2px 10px; font-size: 11px; font-weight: 600; margin-left: auto; }
    .header-cta { background: var(--primary); color: #fff; text-decoration: none; padding: 6px 14px; border-radius: 7px; font-size: 12px; font-weight: 600; margin-left: 8px; transition: opacity .15s; }
    .header-cta:hover { opacity: .85; }

    /* Layout */
    .layout { display: flex; min-height: calc(100vh - 56px); }

    /* Sidebar */
    .sidebar { width: 220px; flex-shrink: 0; background: #fff; border-right: 1px solid #e2e8f0; padding: 20px 12px; position: sticky; top: 56px; height: calc(100vh - 56px); overflow-y: auto; }
    .sidebar-section { font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: .08em; padding: 0 8px; margin: 16px 0 6px; }
    .sidebar-section:first-child { margin-top: 0; }
    .nav-item { display: flex; align-items: center; gap: 8px; padding: 6px 10px; border-radius: 7px; font-size: 13px; font-weight: 500; color: #475569; text-decoration: none; transition: background .12s, color .12s; }
    .nav-item:hover { background: #f1f5f9; color: #1a1a2e; }
    .nav-item.active { background: var(--primary-light); color: var(--primary-text); font-weight: 600; }
    .nav-icon { font-size: 14px; width: 18px; text-align: center; }

    /* Main content */
    .content { flex: 1; min-width: 0; padding: 40px 48px 80px; max-width: 820px; }

    /* Empty state */
    .empty { text-align: center; padding: 80px 24px; }
    .empty-icon { font-size: 48px; margin-bottom: 16px; }
    .empty h2 { font-size: 22px; font-weight: 600; margin-bottom: 8px; }
    .empty p { color: #64748b; font-size: 14px; margin-bottom: 28px; }
    .links { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
    .links a { background: var(--primary); color: #fff; text-decoration: none; padding: 8px 20px; border-radius: 8px; font-size: 13px; font-weight: 500; }

    /* Doc typography */
    .doc h1 { font-size: 30px; font-weight: 700; color: #0f172a; margin-bottom: 8px; line-height: 1.25; }
    .doc h2 { font-size: 20px; font-weight: 600; color: #0f172a; margin: 36px 0 10px; padding-bottom: 8px; border-bottom: 1px solid #e2e8f0; }
    .doc h3 { font-size: 15px; font-weight: 600; color: #1e293b; margin: 24px 0 6px; }
    .doc p { color: #334155; font-size: 14.5px; margin-bottom: 14px; line-height: 1.75; }
    .doc ul { margin: 0 0 14px 20px; }
    .doc li { font-size: 14.5px; color: #334155; margin-bottom: 5px; line-height: 1.7; }
    .doc a { color: var(--primary-text); text-decoration: underline; }
    .doc a:hover { opacity: .8; }
    .doc code { background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 4px; padding: 1px 6px; font-size: 13px; font-family: "SF Mono", "Fira Code", monospace; color: #0f172a; }
    .doc pre { background: #0f172a; border-radius: 10px; padding: 20px 22px; margin: 4px 0 18px; overflow-x: auto; }
    .doc pre code { background: none; border: none; padding: 0; font-size: 13px; color: #e2e8f0; }
    .doc strong { color: #0f172a; }

    /* Mobile */
    @media (max-width: 680px) {
      .sidebar { display: none; }
      .content { padding: 24px 20px 60px; }
      .doc h1 { font-size: 24px; }
    }

    footer { text-align: center; padding: 20px; color: #94a3b8; font-size: 12px; border-top: 1px solid #e2e8f0; background: #fff; }
  </style>
</head>
<body>
  <header class="site-header">
    <a href="/" style="display:flex;align-items:center;gap:10px;text-decoration:none;">
      <div class="logo">A</div>
      <span class="header-brand">AtlasIT<span class="header-sep">/</span><span class="header-sub">Docs</span></span>
    </a>
    <span class="header-badge">Platform Documentation</span>
    <a href="https://www.atlasit.pro/signup" class="header-cta">Get Started →</a>
  </header>

  <div class="layout">
    <nav class="sidebar">
      <div class="sidebar-section">Documentation</div>
      ${navItems}
    </nav>
    <main class="content">
      ${bodyHtml}
    </main>
  </div>

  <footer>© ${new Date().getFullYear()} AtlasIT · <a href="https://www.atlasit.pro" style="color:inherit">atlasit.pro</a> · <a href="https://www.atlasit.pro/status" style="color:inherit">Status</a> · <a href="mailto:support@atlasit.pro" style="color:inherit">Support</a></footer>
</body>
</html>`;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/$/, "") || "/";
    const store = env.DOCS ?? env.DOCS_KV ?? null;

    if (path === "/health" || path === "/healthz") {
      return json({ status: "ok", service: "documentation-worker" });
    }

    // ── Write API ─────────────────────────────────────────────────────────
    // PUT /api/pages/:slug  — write a specific doc page
    if (request.method === "PUT" && path.startsWith("/api/pages/")) {
      if (!store) return json({ error: "Docs storage not configured" }, 500);
      const slug = path.slice("/api/pages/".length);
      if (!PAGES.find((p) => p.slug === slug)) return json({ error: "Unknown page slug" }, 400);
      const body = await request.text();
      if (!body || body.length > 128 * 1024)
        return json({ error: "Invalid or too-large payload" }, 400);
      await store.put(pageKey(slug), body);
      return json({ ok: true, slug });
    }

    // PUT /docs — legacy: write to overview page
    if (request.method === "PUT" && path === "/docs") {
      if (!store) return json({ error: "Docs storage not configured" }, 500);
      const body = await request.text();
      if (!body || body.length > 128 * 1024)
        return json({ error: "Invalid or too-large payload" }, 400);
      await store.put(pageKey("index"), body);
      await store.put(PRIMARY_DOC_KEY, body); // keep legacy key in sync
      return json({ ok: true });
    }

    // POST /update — legacy section update on overview
    if (request.method === "POST" && path === "/update") {
      if (!store) return json({ error: "Docs storage not configured" }, 500);
      const { section, content } = await request.json().catch(() => ({}));
      if (!section || !content) return json({ error: "section and content required" }, 400);
      let current = (await store.get(pageKey("index"))) ?? (await store.get(PRIMARY_DOC_KEY)) ?? "";
      const re = new RegExp(`## ${section}[\\s\\S]*?(?=##|$)`);
      const updated = re.test(current)
        ? current.replace(re, `## ${section}\n\n${content}\n\n`)
        : current + `\n\n## ${section}\n\n${content}\n\n`;
      await store.put(pageKey("index"), updated);
      await store.put(PRIMARY_DOC_KEY, updated);
      return json({ ok: true });
    }

    // ── Read API ──────────────────────────────────────────────────────────
    // GET /api/pages/:slug — JSON for specific page
    if (request.method === "GET" && path.startsWith("/api/pages/")) {
      const slug = path.slice("/api/pages/".length);
      if (!PAGES.find((p) => p.slug === slug)) return json({ error: "Unknown page" }, 404);
      const doc = store ? await store.get(pageKey(slug)) : null;
      return json({ success: true, slug, doc });
    }

    // GET /docs — legacy: JSON for overview (backward compat)
    if (request.method === "GET" && (path === "/docs" || path === "/docs/index")) {
      let doc = null;
      if (store) {
        doc = await store.get(pageKey("index"));
        if (!doc) doc = await store.get(PRIMARY_DOC_KEY);
        if (!doc) doc = await store.get(LEGACY_DOC_KEY);
      }
      return json({ success: true, doc, primaryKey: PRIMARY_DOC_KEY });
    }

    // ── HTML pages ────────────────────────────────────────────────────────
    // Determine slug from URL
    let slug = "index";
    if (path !== "/" && path !== "") {
      const candidate = path.slice(1); // strip leading /
      if (PAGES.find((p) => p.slug === candidate)) {
        slug = candidate;
      } else {
        // 404 — unknown page
        return html(docsPage("index", null, PAGES), 404);
      }
    }

    let content = null;
    if (store) {
      content = await store.get(pageKey(slug));
      // Fallback for index: try legacy flat-doc keys
      if (!content && slug === "index") {
        content = await store.get(PRIMARY_DOC_KEY);
        if (!content) content = await store.get(LEGACY_DOC_KEY);
      }
    }

    return html(docsPage(slug, content, PAGES));
  },
};
