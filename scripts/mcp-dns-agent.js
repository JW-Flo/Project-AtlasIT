#!/usr/bin/env node
import fetch from 'node-fetch'
import fs from 'fs'

// Config
const CLOUDFLARE_TOKEN = process.env.CLOUDFLARE_ADMIN_TOKEN
const ZONE_NAME = process.env.CF_ZONE_NAME || 'REDACTED'
const API_BASE = 'https://api.cloudflare.com/client/v4'
const LOG_FILE = 'docs/mcp-dns-log.md'

function redact(str) {
  if (!str) return ''
  return str.slice(0, 3) + '...' + str.slice(-3)
}

function log(msg) {
  const entry = `\n## [${new Date().toISOString()}] ${msg}`
  fs.appendFileSync(LOG_FILE, entry)
  console.log('[MCP-DNS-AGENT]', msg)
}

function usage() {
  console.log(`\nUsage: mcp-dns-agent.js <command> [args]\n\nCommands:\n  list                 List all DNS records\n  add <type> <name> <content>   Add a DNS record (A, AAAA, CNAME, TXT, MX)\n  del <id>             Delete a DNS record by ID\n  update <id> <type> <name> <content>  Update a DNS record\n  routes               List worker routes\n  add-route <pattern> <script>  Add a worker route\n  dnssec               Check DNSSEC status\n`)
}

async function getZoneId() {
  const res = await fetch(`${API_BASE}/zones?name=${ZONE_NAME}`, {
    headers: { 'Authorization': `Bearer ${CLOUDFLARE_TOKEN}` }
  })
  const data = await res.json()
  if (data.result && data.result.length > 0) return data.result[0].id
  log('ERROR: Zone not found')
  process.exit(1)
}

async function listDNSRecords() {
  const zoneId = await getZoneId()
  const res = await fetch(`${API_BASE}/zones/${zoneId}/dns_records`, {
    headers: { 'Authorization': `Bearer ${CLOUDFLARE_TOKEN}` }
  })
  const data = await res.json()
  data.result.forEach(r => {
    console.log(`[${r.id}] ${r.type} ${r.name} -> ${redact(r.content)}`)
  })
}

async function addDNSRecord(type, name, content) {
  const zoneId = await getZoneId()
  const res = await fetch(`${API_BASE}/zones/${zoneId}/dns_records`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CLOUDFLARE_TOKEN}`
    },
    body: JSON.stringify({ type, name, content, ttl: 120 })
  })
  const data = await res.json()
  if (data.success) log(`DNS record created: ${type} ${name} ${redact(content)}`)
  else log(`ERROR: DNS record creation failed: ${data.errors[0]?.message}`)
}

async function deleteDNSRecord(id) {
  const zoneId = await getZoneId()
  const res = await fetch(`${API_BASE}/zones/${zoneId}/dns_records/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${CLOUDFLARE_TOKEN}` }
  })
  const data = await res.json()
  if (data.success) log(`DNS record deleted: ${id}`)
  else log(`ERROR: DNS record deletion failed: ${data.errors[0]?.message}`)
}

async function updateDNSRecord(id, type, name, content) {
  const zoneId = await getZoneId()
  const res = await fetch(`${API_BASE}/zones/${zoneId}/dns_records/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CLOUDFLARE_TOKEN}`
    },
    body: JSON.stringify({ type, name, content, ttl: 120 })
  })
  const data = await res.json()
  if (data.success) log(`DNS record updated: ${id} ${type} ${name} ${redact(content)}`)
  else log(`ERROR: DNS record update failed: ${data.errors[0]?.message}`)
}

async function listRoutes() {
  const zoneId = await getZoneId()
  const res = await fetch(`${API_BASE}/zones/${zoneId}/workers/routes`, {
    headers: { 'Authorization': `Bearer ${CLOUDFLARE_TOKEN}` }
  })
  const data = await res.json()
  data.result.forEach(r => {
    console.log(`[${r.id}] ${r.pattern} -> ${r.script}`)
  })
}

async function addRoute(pattern, script) {
  const zoneId = await getZoneId()
  const res = await fetch(`${API_BASE}/zones/${zoneId}/workers/routes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CLOUDFLARE_TOKEN}`
    },
    body: JSON.stringify({ pattern, script })
  })
  const data = await res.json()
  if (data.success) log(`Worker route created: ${pattern} -> ${script}`)
  else log(`ERROR: Worker route creation failed: ${data.errors[0]?.message}`)
}

async function checkDNSSEC() {
  const zoneId = await getZoneId()
  const res = await fetch(`${API_BASE}/zones/${zoneId}/dnssec`, {
    headers: { 'Authorization': `Bearer ${CLOUDFLARE_TOKEN}` }
  })
  const data = await res.json()
  if (data.result.status === 'active') log('DNSSEC is active')
  else log('DNSSEC is NOT active')
}

async function main() {
  const [,, cmd, ...args] = process.argv
  if (!cmd) return usage()
  if (cmd === 'list') return await listDNSRecords()
  if (cmd === 'add') return await addDNSRecord(args[0], args[1], args[2])
  if (cmd === 'del') return await deleteDNSRecord(args[0])
  if (cmd === 'update') return await updateDNSRecord(args[0], args[1], args[2], args[3])
  if (cmd === 'routes') return await listRoutes()
  if (cmd === 'add-route') return await addRoute(args[0], args[1])
  if (cmd === 'dnssec') return await checkDNSSEC()
  usage()
}

main() 