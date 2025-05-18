#!/usr/bin/env node
import fs from 'fs'
import os from 'os'

const LOG_FILE = 'docs/token-orchestrator-log.md'
const INCIDENT_LOG = 'docs/token-orchestrator-incidents.md'
const SECRET_STORE = 'secrets/primary-secrets.json.enc'
const BACKUP_STORE = 'secrets/backup-secrets.json.enc'
const ALLOWED_IPS = process.env.ALLOWED_IPS ? process.env.ALLOWED_IPS.split(',') : ['127.0.0.1', '::1'] // Add trusted IPs here

function log(msg) {
  const entry = `\n## [${new Date().toISOString()}] ${msg}`
  fs.appendFileSync(LOG_FILE, entry)
  console.log('[CENTRAL-ORCH]', msg)
}

function logIncident(ip, action) {
  const entry = `\n## [${new Date().toISOString()}] UNAUTHORIZED ACCESS from ${ip} on action: ${action}`
  fs.appendFileSync(INCIDENT_LOG, entry)
  console.error('[CENTRAL-ORCH][INCIDENT]', entry)
}

function triggerInvestigatorAgents(ip) {
  logIncident(ip, 'Triggering investigator agents')
  // In production, spawn/notify investigator agents (e.g., via queue, webhook, or script)
}

function revokeToken() {
  log('Revoking all active tokens due to unauthorized access')
  // In production, call per-system agents to revoke tokens
}

function isAllowedIP(ip) {
  return ALLOWED_IPS.includes(ip)
}

function usage() {
  console.log(`\nUsage: central-token-orchestrator.js <command> [args]\n\nCommands:\n  rotate <system>         Trigger token rotation for a system (cloudflare, okta, ramp, datto)\n  audit                   Audit all token stores\n  backup                  Sync secrets to backup store\n  restore                 Restore secrets from backup\n`)
}

async function triggerRotation(system, ip) {
  if (!isAllowedIP(ip)) {
    logIncident(ip, `rotate ${system}`)
    revokeToken()
    triggerInvestigatorAgents(ip)
    return
  }
  log(`Triggering token rotation for ${system} from ${ip}`)
  // Example: send IPC, HTTP, or queue message to system agent
}

function auditStores(ip) {
  if (!isAllowedIP(ip)) {
    logIncident(ip, 'audit')
    revokeToken()
    triggerInvestigatorAgents(ip)
    return
  }
  log('Auditing secret stores (integrity, redundancy)')
}

function backupSecrets(ip) {
  if (!isAllowedIP(ip)) {
    logIncident(ip, 'backup')
    revokeToken()
    triggerInvestigatorAgents(ip)
    return
  }
  log('Syncing secrets to backup store')
}

function restoreSecrets(ip) {
  if (!isAllowedIP(ip)) {
    logIncident(ip, 'restore')
    revokeToken()
    triggerInvestigatorAgents(ip)
    return
  }
  log('Restoring secrets from backup store')
}

async function main() {
  const [,, cmd, ...args] = process.argv
  // For CLI, use local IP/hostname
  const ip = os.networkInterfaces()['lo0']?.[0]?.address || '127.0.0.1'
  if (!cmd) return usage()
  if (cmd === 'rotate') return await triggerRotation(args[0], ip)
  if (cmd === 'audit') return auditStores(ip)
  if (cmd === 'backup') return backupSecrets(ip)
  if (cmd === 'restore') return restoreSecrets(ip)
  usage()
}

main() 