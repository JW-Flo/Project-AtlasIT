import { createConfluenceDoc } from './appendConfluenceChangeLog.js'
import fetch from 'node-fetch'
import { marked } from 'marked'

/**
 * Script: ai-knowledge-drop.js
 *
 * Autonomous AI agent for Project Ignite DevOps knowledge drops.
 * - For testing, only generates documentation for 'etlLicense'
 * - Uses OpenAI API to generate best-in-class, Confluence-native documentation
 * - Converts wiki markup and markdown to Confluence storage format XML
 * - Publishes as a new Confluence page under the documentation folder (parentPageId: 5102239762)
 * - Updates docs-metadata.json for web UI
 *
 * Usage:
 *   Set OPENAI_API_KEY in your environment.
 *   Run: node scripts/ai-knowledge-drop.js
 */

const OPENAI_API_KEY = process.env.OPENAI_API_KEY
if (!OPENAI_API_KEY) throw new Error('Missing required env: OPENAI_API_KEY')

const parentPageId = '5102239762'
const services = [
  'etlLicense'
]

function buildPrompt(service) {
  return `You are a senior DevOps engineer and technical writer. Write a documentation page for the following Project Ignite service: ${service}.

- Title: "${service} – Project Ignite"
- Use only valid Confluence storage format XML (not wiki markup, not markdown). For example:
  <h1>Heading</h1>
  <ac:panel><ac:rich-text-body><p>Panel content</p></ac:rich-text-body></ac:panel>
  <table><tr><th>Header</th></tr><tr><td>Cell</td></tr></table>
- Executive summary: <ac:panel>...</ac:panel>
- Current state: <ul>...</ul>
- Architecture & flow: <ac:structured-macro ac:name="drawio">...</ac:structured-macro> and <table>...</table>
- Operational details: <ac:panel>...</ac:panel>
- Change log/roadmap: <ul>...</ul>
- Security & compliance: <ac:panel>...</ac:panel>
- How this was created: <ac:panel>...</ac:panel>
- Make it visually appealing, concise, and actionable.`
}

function confluenceWikiToStorageFormat(text) {
  // Headings
  text = text.replace(/^h([1-6])\. (.*)$/gm, '<h$1>$2</h$1>');
  // Tables
  text = text.replace(/\|\|(.+)\|\|/g, (m, row) =>
    '<tr>' + row.split('||').map(cell => `<th>${cell.trim()}</th>`).join('') + '</tr>');
  text = text.replace(/\|(.+)\|/g, (m, row) =>
    '<tr>' + row.split('|').map(cell => `<td>${cell.trim()}</td>`).join('') + '</tr>');
  // Panels (simple heuristic)
  text = text.replace(/\{panel\}(.*?)\{panel\}/gs, '<ac:panel><ac:rich-text-body><p>$1</p></ac:rich-text-body></ac:panel>');
  return text;
}

async function generateContent(service) {
  const prompt = buildPrompt(service)
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are a senior DevOps engineer and technical writer.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2
    })
  })
  if (!res.ok) throw new Error(`OpenAI API error: ${res.status} ${res.statusText}`)
  const data = await res.json()
  let content = data.choices[0].message.content
  // Convert wiki markup to Confluence storage format
  content = confluenceWikiToStorageFormat(content)
  console.log('Converted wiki markup to Confluence storage format.')
  return content
}

async function runKnowledgeDrop() {
  for (const service of services) {
    try {
      const title = `${service} – Project Ignite`
      console.log(`Generating content for: ${title}`)
      const content = await generateContent(service)
      await createConfluenceDoc({
        summary: title,
        details: content,
        actor: 'AI Agent',
        jiraIssue: 'N/A',
        parentPageId
      })
      console.log(`Published: ${title}`)
    } catch (e) {
      console.error(`Failed for service: ${service}`, e)
    }
  }
  console.log('AI knowledge drop complete.')
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runKnowledgeDrop().catch(e => {
    console.error('AI knowledge drop failed:', e)
    process.exit(1)
  })
} 