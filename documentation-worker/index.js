import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', cors());

// KV Namespace binding name remains `DOCS` via wrangler; this constant represents the
// canonical AtlasIT key name used inside the namespace. We preserve legacy key
// `PROJECT_IGNITE.md` for backward compatibility during migration.
const PRIMARY_DOC_KEY = 'ATLASIT_PLATFORM.md';
const LEGACY_DOC_KEY = 'PROJECT_IGNITE.md';

// Update documentation
app.post('/update', async (c) => {
	if (!c.env.DOCS) return c.json({ success: false, error: 'DOCS KV not bound' }, 500);
	const { section, content } = await c.req.json();

	try {
		// Read primary first; fallback to legacy file if primary absent
		let currentDoc = await c.env.DOCS.get(PRIMARY_DOC_KEY);
		if (!currentDoc) {
			currentDoc = (await c.env.DOCS.get(LEGACY_DOC_KEY)) || '';
		}

		const updatedDoc = updateSection(currentDoc, section, content);

		// Write only to primary during migration window
		await c.env.DOCS.put(PRIMARY_DOC_KEY, updatedDoc);

		const migratedFromLegacy = Boolean(currentDoc && !(await c.env.DOCS.get(PRIMARY_DOC_KEY)));
		return c.json({ success: true, message: 'Documentation updated', primary: PRIMARY_DOC_KEY, migratedFromLegacy });
	} catch (error) {
		return c.json({ success: false, error: error.message }, 500);
	}
});

// Get documentation
app.get('/docs', async (c) => {
	if (!c.env.DOCS) return c.json({ success: false, error: 'DOCS KV not bound' }, 500);
	try {
		let doc = await c.env.DOCS.get(PRIMARY_DOC_KEY);
		let source = 'primary';
		if (!doc) {
			doc = await c.env.DOCS.get(LEGACY_DOC_KEY);
			source = doc ? 'legacy' : 'none';
		}
		return c.json({ success: true, doc, source, primaryKey: PRIMARY_DOC_KEY, legacyKey: LEGACY_DOC_KEY });
	} catch (error) {
		return c.json({ success: false, error: error.message }, 500);
	}
});

// Helper function to update a section in the markdown
function updateSection(doc, section, content) {
	const sectionRegex = new RegExp(`## ${section}[\\s\\S]*?(?=##|$)`);
	const newSection = `## ${section}\n\n${content}\n\n`;

	if (sectionRegex.test(doc)) {
		return doc.replace(sectionRegex, newSection);
	} else {
		return doc + '\n\n' + newSection;
	}
}

// Health check(s) – provide both /health and /healthz during transition.
app.get('/healthz', (c) => c.text('OK'));
app.get('/health', (c) => c.json({ status: 'ok', primaryKey: PRIMARY_DOC_KEY, legacyKey: LEGACY_DOC_KEY }));

export default app;
