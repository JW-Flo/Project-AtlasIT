#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import process from 'process';

const REPO_SLUG = process.env.REPO_SLUG || 'JW-Flo/Project-AtlasIT';
const DRY_RUN = (process.env.TRIAGE_DRY_RUN || 'false').toLowerCase() === 'true';
const TRACE_LEVEL = process.env.TRIAGE_TRACE_LEVEL || 'info';
const STALE_DAYS = parseInt(process.env.TRIAGE_STALE_DAYS || '60', 10);
const PROTECTED_LABELS = ['security','in-progress','do-not-close','wontfix-review'];
const OUT_DIR = path.resolve('artifacts');
const SESSION_TS = new Date().toISOString().replace(/[:]/g,'-');
const TRACE_FILE = path.join(OUT_DIR, `triage-trace-${SESSION_TS}.log`);
const SUMMARY_FILE = path.join(OUT_DIR, 'triage-summary.md');
const SESSION_META_FILE = path.join(OUT_DIR, `EV-triage-session-${SESSION_TS}.json`);

if (!process.env.GITHUB_TOKEN) {
  console.error('GITHUB_TOKEN not set; aborting triage.');
  process.exit(1);
}

fs.mkdirSync(OUT_DIR, { recursive: true });

const headers = {
  'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
  'Accept': 'application/vnd.github+json'
};

function log(line){
  fs.appendFileSync(TRACE_FILE, line + '\n');
  if (TRACE_LEVEL === 'debug') console.log(line);
}

async function gh(pathname, method='GET', body){
  const url = `https://api.github.com${pathname}`;
  const res = await fetch(url, { method, headers: body ? { ...headers, 'Content-Type':'application/json' } : headers, body: body?JSON.stringify(body):undefined });
  if (!res.ok) {
    throw new Error(`${method} ${pathname} -> ${res.status} ${await res.text()}`);
  }
  return res.status === 204 ? null : await res.json();
}

async function fetchAllIssues(){
  let page=1; const per_page=100; const all=[];
  while(true){
    const batch = await gh(`/repos/${REPO_SLUG}/issues?state=open&per_page=${per_page}&page=${page}`);
    if (!Array.isArray(batch) || batch.length===0) break;
    for (const it of batch) if (!it.pull_request) all.push(it);
    if (batch.length < per_page) break;
    page++;
  }
  return all;
}

function classify(issue){
  const title = issue.title.toLowerCase();
  const body = (issue.body||'').toLowerCase();
  const updatedAt = new Date(issue.updated_at);
  const ageDays = (Date.now() - updatedAt.getTime())/86400000;
  if (/test issue from ai agent/i.test(issue.title) || /error encountered by ai agent/i.test(issue.title) || /workflow not triggered on main/i.test(issue.title)) return 'obsolete';
  if (/acceptance criteria/i.test(issue.body) && /evidence/i.test(issue.body)) return 'completed';
  if (ageDays > STALE_DAYS && issue.assignees.length === 0) return 'stale';
  return 'active';
}

function detectDuplicates(issues){
  const map = new Map();
  for (const i of issues){
    const norm = i.title.toLowerCase().replace(/[`'"\-]/g,'').replace(/\s+/g,' ').trim();
    if (!map.has(norm)) map.set(norm, []);
    map.get(norm).push(i);
  }
  const duplicates = new Map();
  for (const [norm, list] of map){
    if (list.length > 1){
      const primary = list.sort((a,b)=> new Date(b.created_at)- new Date(a.created_at))[0];
      for (const other of list){ if (other.number !== primary.number) duplicates.set(other.number, primary.number); }
    }
  }
  return duplicates; // issueNumber -> primaryIssueNumber
}

function makeEvidence(issue, classification, extra){
  const body = issue.body || '';
  const hash = crypto.createHash('sha256').update(body).digest('hex');
  const data = {
    trace_id: `TRIAGE-ISSUE-${issue.number}-${SESSION_TS}`,
    control_id: `TRIAGE-${classification.toUpperCase()}`,
    timestamp: new Date().toISOString(),
    issue_number: issue.number,
    classification,
    title: issue.title,
    labels: issue.labels.map(l=>l.name),
    assignees: issue.assignees.map(a=>a.login),
    hash_sha256: hash,
    rationale: extra.rationale,
    compliance: {
      nist_800_53: ['CM-3'],
      soc2: ['CC8.1'],
      iso_27001: ['A.12.1.2']
    },
    dry_run: DRY_RUN,
    ...extra.meta
  };
  const file = path.join(OUT_DIR, `EV-${issue.number}.json`);
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
  return { file, hash };
}

async function comment(issueNumber, body){
  if (DRY_RUN) return;
  await gh(`/repos/${REPO_SLUG}/issues/${issueNumber}/comments`, 'POST', { body });
}

async function close(issueNumber){
  if (DRY_RUN) return;
  await gh(`/repos/${REPO_SLUG}/issues/${issueNumber}`, 'PATCH', { state: 'closed' });
}

(async function main(){
  log(`session_start repo=${REPO_SLUG} dry_run=${DRY_RUN}`);
  const issues = await fetchAllIssues();
  const duplicatesMap = detectDuplicates(issues);
  const results = [];
  for (const issue of issues){
    let classification = classify(issue);
    if (duplicatesMap.has(issue.number)) classification = 'duplicate';
    const protectedMatch = issue.labels.some(l=> PROTECTED_LABELS.includes(l.name));
    const recentlyUpdated = (Date.now() - new Date(issue.updated_at).getTime()) < 86400000;
    let action = 'keep';
    let rationale = '';
    if (classification === 'obsolete') rationale = 'Historical test/incident artifact';
    else if (classification === 'completed') rationale = 'Acceptance criteria & evidence referenced';
    else if (classification === 'stale') rationale = `No update in >${STALE_DAYS}d and unassigned`;
    else if (classification === 'duplicate') rationale = `Duplicate of #${duplicatesMap.get(issue.number)}`;
    else rationale = 'Active; retain';

    if (['obsolete','completed','stale','duplicate'].includes(classification) && !protectedMatch && !recentlyUpdated) action = 'close';
    if (classification==='duplicate' && protectedMatch) action='keep';

    const extra = { rationale, meta: {} };
    if (classification==='duplicate') extra.meta = { primary_issue: duplicatesMap.get(issue.number) };
    const evidence = makeEvidence(issue, classification, extra);

    if (action === 'close') {
      await comment(issue.number, `Triage: classified as ${classification}. Artifact: ${path.basename(evidence.file)} sha256=${evidence.hash} dry_run=${DRY_RUN}`);
      await close(issue.number);
      log(`closed #${issue.number} classification=${classification}`);
    } else {
      await comment(issue.number, `Triaged ${new Date().toISOString()}. Status: ${classification.toUpperCase()} (kept). Artifact: ${path.basename(evidence.file)} dry_run=${DRY_RUN}`);
      log(`kept #${issue.number} classification=${classification}`);
    }
    results.push({ number: issue.number, classification, action, evidence: path.basename(evidence.file) });
  }

  const summaryCounts = results.reduce((acc,r)=>{acc[r.classification]=(acc[r.classification]||0)+1; return acc;}, {});
  const closed = results.filter(r=>r.action==='close');
  const kept = results.filter(r=>r.action!=='close');

  const summaryMd = [
    `# Issue Triage Summary`,
    `Repository: ${REPO_SLUG}`,
    `Dry Run: ${DRY_RUN}`,
    `Session: ${SESSION_TS}`,
    `\n## Counts`,
    ...Object.entries(summaryCounts).map(([k,v])=>`- ${k}: ${v}`),
    `\n## Closed (${closed.length})`,
    ...closed.map(r=>`- #${r.number} (${r.classification}) -> ${r.evidence}`),
    `\n## Kept (${kept.length})`,
    ...kept.map(r=>`- #${r.number} (${r.classification}) -> ${r.evidence}`)
  ].join('\n');
  fs.writeFileSync(SUMMARY_FILE, summaryMd);
  fs.writeFileSync(SESSION_META_FILE, JSON.stringify({
    repository: REPO_SLUG,
    dry_run: DRY_RUN,
    timestamp: SESSION_TS,
    totals: summaryCounts,
    closed: closed.map(c=>c.number),
    kept: kept.map(k=>k.number)
  }, null, 2));
  log('session_complete');
  console.log(`Triage complete. Dry run=${DRY_RUN}. Summary at ${SUMMARY_FILE}`);
})();
