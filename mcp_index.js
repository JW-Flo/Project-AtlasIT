const TASK_PREFIX = 'task:'

async function addTask(env, content, provider = 'together') {
  const id = Date.now().toString()
  const task = { id, content, provider, status: 'pending' }
  await env.MCP_STORE.put(TASK_PREFIX + id, JSON.stringify(task))
  return task
}

async function listTasks(env) {
  const list = await env.MCP_STORE.list({ prefix: TASK_PREFIX })
  return await Promise.all(
    list.keys.map(async ({ name }) => JSON.parse(await env.MCP_STORE.get(name)))
  )
}

async function callTogetherLLM(apiKey, prompt, model = "meta-llama/Llama-3-70B-Instruct") {
  const url = "https://api.together.xyz/v1/chat/completions"
  const body = {
    model,
    messages: [{ role: "user", content: prompt }],
    max_tokens: 256,
    temperature: 0.7
  }
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  })
  if (!res.ok) throw new Error(`LLM error: ${res.status}`)
  const data = await res.json()
  return data.choices?.[0]?.message?.content || "No response"
}

// Gemini LLM stub (replace with real API call as needed)
async function callGeminiLLM(apiKey, prompt) {
  // Example endpoint and payload for Gemini (update as needed)
  const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=" + apiKey
  const body = {
    contents: [{ parts: [{ text: prompt }] }]
  }
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  })
  if (!res.ok) throw new Error(`Gemini LLM error: ${res.status}`)
  const data = await res.json()
  // Adjust this path based on Gemini's actual response structure
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "No response"
}

// Perplexity LLM stub (easy to add later)
// async function callPerplexityLLM(apiKey, prompt) { ... }

async function dispatchTask(env, id) {
  const key = TASK_PREFIX + id
  const taskRaw = await env.MCP_STORE.get(key)
  if (!taskRaw) return null
  const task = JSON.parse(taskRaw)
  const provider = task.provider || 'together'
  let result
  if (provider === 'together') {
    const apiKey = env.TOGETHER_API_KEY
    if (!apiKey) {
      task.status = 'error'
      task.result = 'Missing Together API key'
    } else {
      try {
        task.status = 'running'
        await env.MCP_STORE.put(key, JSON.stringify(task))
        result = await callTogetherLLM(apiKey, task.content)
        task.status = 'completed'
        task.result = result
      } catch (e) {
        task.status = 'error'
        task.result = e.message
      }
    }
  } else if (provider === 'gemini') {
    const apiKey = env.GEMINI_API_KEY
    if (!apiKey) {
      task.status = 'error'
      task.result = 'Missing Gemini API key'
    } else {
      try {
        task.status = 'running'
        await env.MCP_STORE.put(key, JSON.stringify(task))
        result = await callGeminiLLM(apiKey, task.content)
        task.status = 'completed'
        task.result = result
      } catch (e) {
        task.status = 'error'
        task.result = e.message
      }
    }
  } else if (provider === 'cloudflare-ai') {
    try {
      task.status = 'running'
      await env.MCP_STORE.put(key, JSON.stringify(task))
      if (!env.dispatcher) throw new Error('Dispatcher binding missing')
      const aiWorker = await env.dispatcher.get('ai-worker')
      if (!aiWorker) throw new Error('AI Worker not found in dispatcher')
      const aiReq = new Request('https://ai-worker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: task.content })
      })
      const aiResp = await aiWorker.fetch(aiReq)
      if (!aiResp.ok) throw new Error('AI Worker error: ' + aiResp.status)
      const aiData = await aiResp.text()
      task.status = 'completed'
      task.result = aiData
    } catch (e) {
      task.status = 'error'
      task.result = e.message
    }
  } else {
    task.status = 'error'
    task.result = `Unknown provider: ${provider}`