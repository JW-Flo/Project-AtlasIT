import { Router } from 'itty-router'

/**
 * image-ai-worker.js
 *
 * Cloudflare AI Worker for image collection and analysis.
 * - POST /images/upload: Accepts image uploads, stores in R2, metadata in KV
 * - POST /images/:id/analyze: Runs AI analysis (object detection) on stored image, saves results in KV
 * - GET /images/:id: Returns image metadata and analysis results
 * - Robust error handling, logging, and security checks
 * - ES module, itty-router, ready for wrangler deployment
 */

const router = Router()

const logRequest = async (request, handler) => {
  const { method, url } = request
  const path = new URL(url).pathname
  console.log(`[REQUEST] ${method} ${path}`)
  let response
  try {
    response = await handler()
    console.log(`[RESPONSE] ${method} ${path} ${response.status}`)
    return response
  } catch (e) {
    console.error(`[ERROR] ${method} ${path}`, e)
    return new Response('Internal error', { status: 502 })
  }
}

function checkBindings(env, required) {
  for (const key of required) {
    if (!env[key]) {
      console.error(`[ERROR] Missing binding: ${key}`)
      return new Response(`Missing binding: ${key}`, { status: 500 })
    }
  }
  return null
}

// POST /images/upload
router.post('/images/upload', (request, env) =>
  logRequest(request, async () => {
    const missing = checkBindings(env, ['IMAGES_BUCKET', 'IMAGES_KV'])
    if (missing) return missing
    const formData = await request.formData()
    const file = formData.get('image')
    if (!file || !file.type.startsWith('image/')) {
      return new Response('Invalid image', { status: 400 })
    }
    const id = crypto.randomUUID()
    await env.IMAGES_BUCKET.put(id, file.stream())
    await env.IMAGES_KV.put(id, JSON.stringify({ type: file.type, uploaded: Date.now() }))
    return new Response(JSON.stringify({ id }), { status: 201, headers: { 'Content-Type': 'application/json' } })
  })
)

// POST /images/:id/analyze
router.post('/images/:id/analyze', ({ params }, env, request) =>
  logRequest(request, async () => {
    const missing = checkBindings(env, ['IMAGES_BUCKET', 'IMAGES_KV', 'AI'])
    if (missing) return missing
    const image = await env.IMAGES_BUCKET.get(params.id)
    if (!image) return new Response('Not found', { status: 404 })
    // Example: Run AI analysis (object detection)
    const aiResult = await env.AI.run('object-detection', image)
    await env.IMAGES_KV.put(`${params.id}:analysis`, JSON.stringify(aiResult))
    return new Response(JSON.stringify(aiResult), { status: 200, headers: { 'Content-Type': 'application/json' } })
  })
)

// GET /images/:id
router.get('/images/:id', ({ params }, env, request) =>
  logRequest(request, async () => {
    const missing = checkBindings(env, ['IMAGES_KV'])
    if (missing) return missing
    const meta = await env.IMAGES_KV.get(params.id, 'json')
    const analysis = await env.IMAGES_KV.get(`${params.id}:analysis`, 'json')
    return new Response(JSON.stringify({ meta, analysis }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  })
)

// Health check endpoint for root path
router.get('/', (request) =>
  logRequest(request, async () => {
    return new Response(JSON.stringify({ status: 'ok', service: 'image-ai-worker' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  })
)

// Catch-all 404 handler for unmatched routes
router.all('*', (request) => {
  const { method, url } = request
  const path = new URL(url).pathname
  console.error('[ERROR] 404 Not Found:', method, path)
  return new Response('Not found', { status: 404 })
})

export default {
  fetch: router.handle
} 