import { Router } from 'itty-router'

const router = Router()

function logRequest(request, status) {
  const { method, url } = request
  const path = new URL(url).pathname
  console.log(`[MCP] ${method} ${path} -> ${status}`)
}

function requireEnv(env, keys) {
  for (const key of keys) {
    if (!env[key]) {
      console.error(`[ERROR] Missing env var: ${key}`)
      return new Response(`Missing env var: ${key}`, { status: 500 })
    }
  }
  return null
}

// Health endpoint
router.get('/healthz', (request, env) => {
  logRequest(request, 200)
  return new Response(JSON.stringify({ status: 'ok', service: 'mcp' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  })
})

// Status endpoint
router.get('/status', (request, env) => {
  logRequest(request, 200)
  return new Response(JSON.stringify({
    status: 'ready',
    orchestrations: ['contractor-lifecycle', 'cloud-automation', 'etl', 'ai-pipeline']
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  })
})

// Orchestrate endpoint (stub)
router.post('/orchestrate', async (request, env) => {
  const missing = requireEnv(env, ['MCP_API_KEY'])
  if (missing) return missing
  let body
  try {
    body = await request.json()
  } catch (e) {
    logRequest(request, 400)
    return new Response('Invalid JSON', { status: 400 })
  }
  logRequest(request, 202)
  // Stub: log orchestration request
  console.log('[MCP] Orchestration requested:', JSON.stringify(body))
  return new Response(JSON.stringify({
    status: 'accepted',
    received: body
  }), {
    status: 202,
    headers: { 'Content-Type': 'application/json' }
  })
})

// Catch-all 404
router.all('*', (request) => {
  logRequest(request, 404)
  return new Response('Not found', { status: 404 })
})

export default {
  fetch: (request, env, ctx) => router.handle(request, env, ctx)
} 