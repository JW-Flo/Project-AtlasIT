import fetch from 'node-fetch';
import fs from 'fs';

const CONFLUENCE_API_URL = 'https://flocasts.atlassian.net/wiki/rest/api/content';
const CONFLUENCE_API_KEY = process.env.CONFLUENCE_API_KEY;
const CONFLUENCE_EMAIL = process.env.CONFLUENCE_EMAIL;

if (!CONFLUENCE_EMAIL || !CONFLUENCE_API_KEY) {
  throw new Error('Missing required environment variables: CONFLUENCE_EMAIL and/or CONFLUENCE_API_KEY');
}

function getBasicAuthHeader() {
  const auth = Buffer.from(`${CONFLUENCE_EMAIL}:${CONFLUENCE_API_KEY}`).toString('base64');
  return `Basic ${auth}`;
}

/**
 * Script: appendConfluenceChangeLog.js
 *
 * Automates the creation of documentation pages in Confluence under the documentation folder.
 * Stores metadata for each doc in docs-metadata.json for web UI integration.
 *
 * Required environment variables:
 *   - CONFLUENCE_EMAIL: Atlassian user email
 *   - CONFLUENCE_API_KEY: Atlassian API token
 *
 * Usage:
 *   CONFLUENCE_EMAIL="your-email" CONFLUENCE_API_KEY="your-token" node scripts/appendConfluenceChangeLog.js "Summary" "Details" "Actor" "JiraIssue" "ParentPageId"
 *
 * The script will create a new Confluence page and append its metadata to docs-metadata.json.
 *
 * If env vars are missing, the script will throw a clear error.
 *
 * Lessons: Classic page automation is robust; database/table API is not recommended for automation.
 */

/**
 * Creates a new documentation page in Confluence and stores metadata locally.
 * @param {Object} params
 * @param {string} params.summary - Short summary of the change.
 * @param {string} params.details - Detailed description of the change.
 * @param {string} params.actor - Who made the change.
 * @param {string} params.jiraIssue - Related Jira ticket.
 * @param {string} params.parentPageId - ID of the parent page for the documentation folder.
 */
export async function createConfluenceDoc({ summary, details, actor, jiraIssue, parentPageId }) {
  if (!parentPageId) throw new Error('Missing required parentPageId for documentation folder');
  const timestamp = new Date().toISOString();
  const title = `Automated Documentation - ${timestamp}`;
  const body = `
    <h1>${summary}</h1>
    <ul>
      <li><b>Actor:</b> ${actor}</li>
      <li><b>Summary:</b> ${summary}</li>
      <li><b>Details:</b> ${details}</li>
      <li><b>Jira:</b> ${jiraIssue}</li>
      <li><b>Timestamp:</b> ${timestamp}</li>
    </ul>
  `;
  // Create the new page
  const res = await fetch(CONFLUENCE_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': getBasicAuthHeader(),
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      type: 'page',
      title,
      ancestors: [{ id: parentPageId }],
      space: { key: 'ITIKB' },
      body: { storage: { value: body, representation: 'storage' } }
    })
  });
  if (!res.ok) {
    throw new Error(`Failed to create Confluence page: ${res.status} ${res.statusText}`);
  }
  const page = await res.json();
  const pageUrl = `https://flocasts.atlassian.net/wiki${page._links.webui}`;
  const metadata = { title, url: pageUrl, summary, details, actor, jiraIssue, timestamp };
  // Store metadata in docs-metadata.json
  let docs = [];
  try {
    docs = JSON.parse(fs.readFileSync('docs-metadata.json', 'utf8'));
  } catch (e) {}
  docs.push(metadata);
  fs.writeFileSync('docs-metadata.json', JSON.stringify(docs, null, 2));
  console.log('Documentation page created:', pageUrl);
  console.log('Metadata stored in docs-metadata.json');
}

// ES module-compatible CLI usage example
if (import.meta.url === `file://${process.argv[1]}`) {
  const [summary, details, actor, jiraIssue, parentPageId] = process.argv.slice(2);
  if (!summary || !details || !actor || !jiraIssue || !parentPageId) {
    console.error('Usage: node scripts/appendConfluenceChangeLog.js "summary" "details" "actor" "jiraIssue" "parentPageId"');
    process.exit(1);
  }
  createConfluenceDoc({ summary, details, actor, jiraIssue, parentPageId })
    .catch(err => {
      console.error('Failed to create documentation page:', err);
      process.exit(1);
    });
} 