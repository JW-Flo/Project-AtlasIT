import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', cors());

// KV Namespace for storing documentation
const DOCS = 'ignite_docs';

// Update documentation
app.post('/update', async (c) => {
  if (!c.env.DOCS) return c.json({ success: false, error: 'DOCS KV not bound' }, 500)
  const { section, content } = await c.req.json();
  
  try {
    // Get current documentation
    const currentDoc = await c.env.DOCS.get('PROJECT_IGNITE.md') || '';
    
    // Update the section
    const updatedDoc = updateSection(currentDoc, section, content);
    
    // Store updated documentation
    await c.env.DOCS.put('PROJECT_IGNITE.md', updatedDoc);
    
    return c.json({ success: true, message: 'Documentation updated' });
  } catch (error) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Get documentation
app.get('/docs', async (c) => {
  if (!c.env.DOCS) return c.json({ success: false, error: 'DOCS KV not bound' }, 500)
  try {
    const doc = await c.env.DOCS.get('PROJECT_IGNITE.md');
    return c.json({ success: true, doc });
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

// Health check
app.get('/healthz', (c) => c.text('OK'));

export default app; 