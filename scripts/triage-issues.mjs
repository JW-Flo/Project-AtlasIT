#!/usr/bin/env node
/**
 * Automated Issue Triage Script
 * 
 * Recursively scans all open issues (including sub-issues and linked dependencies)
 * Evaluates if issues are relevant, redundant, or completed
 * Closes issues with evidence and trace metadata
 * Emits compliance mappings for all actions
 */

import { execSync } from 'node:child_process';
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const DRY_RUN = process.env.DRY_RUN === 'true';
const STALE_DAYS = 60;

// Helper to execute gh CLI commands
function gh(args, options = {}) {
  const cmd = `gh ${args}`;
  try {
    const result = execSync(cmd, { encoding: 'utf8', ...options });
    return result.trim();
  } catch (error) {
    console.error(`Error executing: ${cmd}`);
    console.error(error.message);
    throw error;
  }
}

// SHA-256 hash for evidence artifacts
async function sha256Hex(data) {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(typeof data === 'string' ? data : JSON.stringify(data));
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Parse issue data from gh CLI JSON output
function parseIssues(jsonOutput) {
  try {
    return JSON.parse(jsonOutput);
  } catch (error) {
    console.error('Failed to parse issues JSON:', error.message);
    return [];
  }
}

// Extract linked issues from issue body and comments
function extractLinkedIssues(issue) {
  const linkedIssues = new Set();
  const text = `${issue.body || ''}\n${(issue.comments || []).map(c => c.body).join('\n')}`;
  
  // Match #123, fixes #123, closes #123, blocked by #123, etc.
  const issuePattern = /#(\d+)/g;
  let match;
  while ((match = issuePattern.exec(text)) !== null) {
    linkedIssues.add(parseInt(match[1], 10));
  }
  
  return Array.from(linkedIssues);
}

// Check if issue is resolved
function isResolved(issue) {
  const labels = issue.labels || [];
  const labelNames = labels.map(l => l.name.toLowerCase());
  
  // Check for resolved/fixed/completed labels
  if (labelNames.some(l => 
    l.includes('resolved') || 
    l.includes('fixed') || 
    l.includes('completed') ||
    l.includes('done')
  )) {
    return { resolved: true, reason: 'Has resolved/fixed/completed label' };
  }
  
  // Check for closed PR references in body/comments
  const text = `${issue.body || ''}\n${(issue.comments || []).map(c => c.body).join('\n')}`;
  if (/(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\s+(?:by\s+)?#\d+/i.test(text)) {
    return { resolved: true, reason: 'References closed PR or fix' };
  }
  
  return { resolved: false };
}

// Check if issue is redundant
function isRedundant(issue, allIssues) {
  const title = issue.title.toLowerCase();
  const body = (issue.body || '').toLowerCase();
  
  // Look for duplicate/redundant indicators
  const labels = issue.labels || [];
  const labelNames = labels.map(l => l.name.toLowerCase());
  
  if (labelNames.some(l => l.includes('duplicate') || l.includes('redundant'))) {
    return { redundant: true, reason: 'Marked as duplicate/redundant' };
  }
  
  // Check for similar titles in closed issues (simple heuristic)
  const similarClosed = allIssues.filter(other => 
    other.state === 'closed' && 
    other.number !== issue.number &&
    levenshteinDistance(title, other.title.toLowerCase()) < 10
  );
  
  if (similarClosed.length > 0) {
    return { 
      redundant: true, 
      reason: `Similar to closed issue #${similarClosed[0].number}` 
    };
  }
  
  return { redundant: false };
}

// Check if issue is stale
function isStale(issue) {
  const updatedAt = new Date(issue.updatedAt);
  const daysSinceUpdate = (Date.now() - updatedAt.getTime()) / (1000 * 60 * 60 * 24);
  
  if (daysSinceUpdate > STALE_DAYS) {
    const labels = issue.labels || [];
    const hasAssignee = issue.assignees && issue.assignees.length > 0;
    
    // Don't mark as stale if it has active labels or assignees
    if (!hasAssignee && !labels.some(l => l.name.toLowerCase().includes('in progress'))) {
      return { 
        stale: true, 
        reason: `No activity for ${Math.floor(daysSinceUpdate)} days`,
        days: Math.floor(daysSinceUpdate)
      };
    }
  }
  
  return { stale: false };
}

// Simple Levenshtein distance for similarity check
function levenshteinDistance(str1, str2) {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix = Array(len2 + 1).fill(null).map(() => Array(len1 + 1).fill(null));
  
  for (let i = 0; i <= len1; i++) matrix[0][i] = i;
  for (let j = 0; j <= len2; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= len2; j++) {
    for (let i = 1; i <= len1; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }
  
  return matrix[len2][len1];
}

// Generate evidence artifact for a closed issue
async function generateEvidence(issue, action, reason) {
  const timestamp = new Date().toISOString();
  const traceId = randomUUID();
  
  const evidence = {
    trace_id: traceId,
    control_id: `ISSUE-${issue.number}`,
    timestamp,
    issue_metadata: {
      number: issue.number,
      title: issue.title,
      state: issue.state,
      url: issue.url,
      labels: (issue.labels || []).map(l => l.name),
      assignees: (issue.assignees || []).map(a => a.login),
      created_at: issue.createdAt,
      updated_at: issue.updatedAt
    },
    action,
    reason,
    compliance_tags: [
      'SOC2.AC-2',
      'NIST.AC-1', 
      'ISO.9.2.1'
    ],
    hash: ''
  };
  
  // Calculate hash
  const hash = await sha256Hex(evidence);
  evidence.hash = hash;
  
  const artifactPath = path.resolve(process.cwd(), `artifacts/EV-issue-${issue.number}.json`);
  await mkdir(path.dirname(artifactPath), { recursive: true });
  await writeFile(artifactPath, JSON.stringify(evidence, null, 2) + '\n', 'utf8');
  
  return { evidence, artifactPath };
}

// Comment on issue with evidence
async function commentOnIssue(issueNumber, evidence, artifactPath) {
  if (DRY_RUN) {
    console.log(`[DRY RUN] Would comment on issue #${issueNumber}`);
    return;
  }
  
  const comment = `## Automated Triage Evidence

This issue has been automatically triaged.

**Action:** ${evidence.action}
**Reason:** ${evidence.reason}
**Trace ID:** \`${evidence.trace_id}\`
**Control ID:** \`${evidence.control_id}\`
**Timestamp:** ${evidence.timestamp}

**Compliance Tags:** ${evidence.compliance_tags.join(', ')}

**Evidence Artifact:** \`${path.relative(process.cwd(), artifactPath)}\`
**Hash:** \`${evidence.hash}\`
`;
  
  try {
    gh(`issue comment ${issueNumber} --body "${comment.replace(/"/g, '\\"')}"`);
  } catch (error) {
    console.error(`Failed to comment on issue #${issueNumber}:`, error.message);
  }
}

// Close an issue
async function closeIssue(issue, reason) {
  console.log(`Closing issue #${issue.number}: ${reason}`);
  
  const { evidence, artifactPath } = await generateEvidence(issue, 'CLOSED', reason);
  await commentOnIssue(issue.number, evidence, artifactPath);
  
  if (!DRY_RUN) {
    try {
      gh(`issue close ${issue.number} --reason "not planned"`);
    } catch (error) {
      console.error(`Failed to close issue #${issue.number}:`, error.message);
    }
  } else {
    console.log(`[DRY RUN] Would close issue #${issue.number}`);
  }
  
  return evidence;
}

// Mark issue as active with compliance report
async function markActive(issue) {
  const timestamp = new Date().toISOString();
  const nextReview = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  
  console.log(`Issue #${issue.number} is still active`);
  
  const comment = `## Automated Triage Report

This issue has been triaged on ${timestamp} and is **still active**.

**Assigned to:** ${(issue.assignees || []).map(a => `@${a.login}`).join(', ') || 'Unassigned'}
**Labels:** ${(issue.labels || []).map(l => l.name).join(', ') || 'None'}
**Next Review:** ${nextReview}

Please ensure this issue has proper ownership and next steps defined.
`;
  
  if (!DRY_RUN) {
    try {
      gh(`issue comment ${issue.number} --body "${comment.replace(/"/g, '\\"')}"`);
    } catch (error) {
      console.error(`Failed to comment on issue #${issue.number}:`, error.message);
    }
  } else {
    console.log(`[DRY RUN] Would mark issue #${issue.number} as active`);
  }
  
  return {
    number: issue.number,
    title: issue.title,
    assignees: (issue.assignees || []).map(a => a.login),
    nextReview
  };
}

// Recursively scan issues and their dependencies
async function scanIssuesRecursive(issueNumbers, visited = new Set()) {
  const scannedIssues = [];
  
  for (const num of issueNumbers) {
    if (visited.has(num)) continue;
    visited.add(num);
    
    try {
      const issueJson = gh(`issue view ${num} --json number,title,state,body,labels,assignees,comments,url,createdAt,updatedAt`);
      const issue = JSON.parse(issueJson);
      scannedIssues.push(issue);
      
      // Find linked issues
      const linkedIssues = extractLinkedIssues(issue);
      if (linkedIssues.length > 0) {
        const linkedScanned = await scanIssuesRecursive(linkedIssues, visited);
        scannedIssues.push(...linkedScanned);
      }
    } catch (error) {
      console.error(`Failed to fetch issue #${num}:`, error.message);
    }
  }
  
  return scannedIssues;
}

// Main triage function
async function triageIssues() {
  const timestamp = new Date().toISOString();
  const logPath = path.resolve(process.cwd(), `artifacts/triage-trace-${timestamp.replace(/[:.]/g, '-')}.log`);
  const logs = [];
  
  function log(message) {
    console.log(message);
    logs.push(`${new Date().toISOString()} - ${message}`);
  }
  
  log('=== Starting Automated Issue Triage ===');
  log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  log(`Timestamp: ${timestamp}`);
  
  // Fetch all open issues
  log('Fetching all open issues...');
  const openIssuesJson = gh('issue list --state open --json number,title,state,body,labels,assignees,url,createdAt,updatedAt --limit 1000');
  const openIssues = parseIssues(openIssuesJson);
  
  log(`Found ${openIssues.length} open issues`);
  
  // Also fetch closed issues for redundancy check
  log('Fetching closed issues for redundancy check...');
  const closedIssuesJson = gh('issue list --state closed --json number,title,state --limit 500');
  const closedIssuesForCheck = parseIssues(closedIssuesJson);
  
  const allIssues = [...openIssues, ...closedIssuesForCheck];
  
  // Recursively scan all open issues and their dependencies
  const issueNumbers = openIssues.map(i => i.number);
  log(`Scanning ${issueNumbers.length} issues recursively...`);
  const scannedIssues = await scanIssuesRecursive(issueNumbers);
  
  // Remove duplicates
  const uniqueIssues = Array.from(
    new Map(scannedIssues.map(i => [i.number, i])).values()
  );
  
  log(`Total unique issues scanned (including dependencies): ${uniqueIssues.length}`);
  
  // Triage results
  const closedIssues = [];
  const activeIssues = [];
  const evidenceArtifacts = [];
  
  for (const issue of uniqueIssues) {
    if (issue.state === 'closed') {
      log(`Issue #${issue.number} is already closed, skipping`);
      continue;
    }
    
    log(`\nTriaging issue #${issue.number}: ${issue.title}`);
    
    // Decision tree
    const resolvedCheck = isResolved(issue);
    if (resolvedCheck.resolved) {
      const evidence = await closeIssue(issue, resolvedCheck.reason);
      closedIssues.push({ issue, reason: resolvedCheck.reason, evidence });
      evidenceArtifacts.push(evidence);
      continue;
    }
    
    const redundantCheck = isRedundant(issue, allIssues);
    if (redundantCheck.redundant) {
      const evidence = await closeIssue(issue, redundantCheck.reason);
      closedIssues.push({ issue, reason: redundantCheck.reason, evidence });
      evidenceArtifacts.push(evidence);
      continue;
    }
    
    const staleCheck = isStale(issue);
    if (staleCheck.stale) {
      const evidence = await closeIssue(issue, `Stale: ${staleCheck.reason}`);
      closedIssues.push({ issue, reason: `Stale: ${staleCheck.reason}`, evidence });
      evidenceArtifacts.push(evidence);
      continue;
    }
    
    // Issue is still active
    const activeInfo = await markActive(issue);
    activeIssues.push(activeInfo);
  }
  
  log('\n=== Triage Summary ===');
  log(`Total issues processed: ${uniqueIssues.length}`);
  log(`Closed: ${closedIssues.length}`);
  log(`Active: ${activeIssues.length}`);
  
  // Generate summary report
  const summaryPath = path.resolve(process.cwd(), 'artifacts/triage-summary.md');
  const summary = generateSummaryReport(timestamp, uniqueIssues.length, closedIssues, activeIssues, evidenceArtifacts);
  
  await mkdir(path.dirname(summaryPath), { recursive: true });
  await writeFile(summaryPath, summary, 'utf8');
  log(`\nSummary report written to: ${path.relative(process.cwd(), summaryPath)}`);
  
  // Write execution log
  await mkdir(path.dirname(logPath), { recursive: true });
  await writeFile(logPath, logs.join('\n') + '\n', 'utf8');
  log(`Execution log written to: ${path.relative(process.cwd(), logPath)}`);
  
  log('\n=== Triage Complete ===');
}

// Generate markdown summary report
function generateSummaryReport(timestamp, totalProcessed, closedIssues, activeIssues, evidenceArtifacts) {
  let report = `# Automated Issue Triage Summary\n\n`;
  report += `**Execution Time:** ${timestamp}\n`;
  report += `**Mode:** ${DRY_RUN ? 'DRY RUN (No actual changes)' : 'LIVE'}\n\n`;
  report += `## Statistics\n\n`;
  report += `- **Total Issues Processed:** ${totalProcessed}\n`;
  report += `- **Issues Closed:** ${closedIssues.length}\n`;
  report += `- **Issues Active:** ${activeIssues.length}\n\n`;
  
  if (closedIssues.length > 0) {
    report += `## Closed Issues\n\n`;
    report += `| Issue | Title | Reason | Control ID | Evidence |\n`;
    report += `|-------|-------|--------|------------|----------|\n`;
    
    for (const { issue, reason, evidence } of closedIssues) {
      report += `| #${issue.number} | ${issue.title} | ${reason} | \`${evidence.control_id}\` | \`artifacts/EV-issue-${issue.number}.json\` |\n`;
    }
    report += '\n';
  }
  
  if (activeIssues.length > 0) {
    report += `## Active Issues\n\n`;
    report += `| Issue | Title | Assignees | Next Review |\n`;
    report += `|-------|-------|-----------|-------------|\n`;
    
    for (const { number, title, assignees, nextReview } of activeIssues) {
      const assigneeStr = assignees.length > 0 ? assignees.map(a => `@${a}`).join(', ') : 'Unassigned';
      report += `| #${number} | ${title} | ${assigneeStr} | ${nextReview.split('T')[0]} |\n`;
    }
    report += '\n';
  }
  
  report += `## Compliance Mappings\n\n`;
  report += `All closed issues have been mapped to the following compliance controls:\n\n`;
  report += `- **SOC2.AC-2** - Access Control\n`;
  report += `- **NIST.AC-1** - Access Control Policy and Procedures\n`;
  report += `- **ISO.9.2.1** - Management Review\n\n`;
  
  report += `## Evidence Artifacts\n\n`;
  report += `${evidenceArtifacts.length} evidence artifacts generated:\n\n`;
  
  for (const artifact of evidenceArtifacts) {
    report += `- \`artifacts/EV-issue-${artifact.control_id.split('-')[1]}.json\` (Hash: \`${artifact.hash.substring(0, 16)}...\`)\n`;
  }
  
  report += `\n---\n\n`;
  report += `*This triage was performed automatically. Review artifacts in \`/artifacts\` for full details.*\n`;
  
  return report;
}

// Run the triage
triageIssues().catch(error => {
  console.error('Fatal error during triage:', error);
  process.exit(1);
});
