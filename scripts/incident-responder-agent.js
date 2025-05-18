#!/usr/bin/env node
import fs from 'fs'
import fetch from 'node-fetch'

// Config
const GITHUB_TOKEN = process.env.GH_PAT || process.env.GITHUB_TOKEN
const REPO = process.env.GITHUB_REPO || 'JW-Flo/Project-Ignite'
const BRANCH = process.env.GITHUB_BRANCH || 'main'
const INCIDENT_LOG = 'docs/incident-log.md'

if (!GITHUB_TOKEN) {
  console.error('[ERROR] GITHUB_TOKEN not set')
  process.exit(1)
}

const headers = {
  'Authorization': `token ${GITHUB_TOKEN}`,
  'Accept': 'application/vnd.github.v3+json'
}

async function getLatestWorkflowRun() {
  const url = `https://api.github.com/repos/${REPO}/actions/runs?branch=${BRANCH}&per_page=1`
  const res = await fetch(url, { headers })
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`)
  const data = await res.json()
  return data.workflow_runs[0]
}

async function createNoopCommit() {
  console.log('[INFO] Creating no-op commit to trigger workflow...')
  const res = await fetch(`https://api.github.com/repos/${REPO}/git/refs/heads/${BRANCH}`, { headers })
  if (!res.ok) throw new Error('Failed to get branch ref')
  const { object: { sha } } = await res.json()
  const commitRes = await fetch(`https://api.github.com/repos/${REPO}/git/commits/${sha}`, { headers })
  const { tree } = await commitRes.json()
  const body = {
    message: 'Incident responder: trigger workflow (no-op)',
    tree,
    parents: [sha]
  }
  const newCommit = await fetch(`https://api.github.com/repos/${REPO}/git/commits`, {
    method: 'POST', headers, body: JSON.stringify(body)
  })
  const { sha: newSha } = await newCommit.json()
  await fetch(`https://api.github.com/repos/${REPO}/git/refs/heads/${BRANCH}`, {
    method: 'PATCH', headers, body: JSON.stringify({ sha: newSha })
  })
  logIncident('No workflow run detected. Triggered no-op commit.')
}

async function openIncidentIssue(reason) {
  console.log('[INFO] Opening GitHub issue for incident...')
  const body = {
    title: `[Incident] Workflow not triggered on ${BRANCH}`,
    body: `Automated incident responder detected: ${reason}`
  }
  await fetch(`https://api.github.com/repos/${REPO}/issues`, {
    method: 'POST', headers, body: JSON.stringify(body)
  })
  logIncident(`Opened GitHub issue: ${reason}`)
}

function logIncident(msg) {
  const entry = `\n## [${new Date().toISOString()}] ${msg}`
  fs.appendFileSync(INCIDENT_LOG, entry)
  console.log('[LOGGED]', msg)
}

async function main() {
  try {
    const run = await getLatestWorkflowRun()
    if (!run || run.status === 'completed' && run.conclusion !== 'success') {
      await createNoopCommit()
      // Wait and re-check
      setTimeout(async () => {
        const rerun = await getLatestWorkflowRun()
        if (!rerun || rerun.status === 'completed' && rerun.conclusion !== 'success') {
          await openIncidentIssue('No workflow run after no-op commit')
        }
      }, 60000)
    } else {
      console.log('[INFO] Workflow run detected:', run.id, run.status, run.conclusion)
    }
  } catch (e) {
    logIncident(`Error: ${e.message}`)
    process.exit(1)
  }
}

main() 