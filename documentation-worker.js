import { Router } from 'itty-router';

const router = Router();

function validateEnv(env) {
  if (!env.OPENAI_API_KEY) throw new Error('Missing required env: OPENAI_API_KEY');
  if (!env.AI_GATEWAY_TOKEN) throw new Error('Missing required env: AI_GATEWAY_TOKEN');
}

async function generateDocumentation(services, env) {
  const model = 'gpt-4';
  const openaiUrl = 'https://api.openai.com/v1/chat/completions';
  const systemPrompt = 'You are a senior technical writer and DevOps engineer. Generate a detailed, actionable documentation update for the following services. Include architecture diagrams (as markdown), change log, and Jira/Confluence update instructions.';
  try {
    const response = await fetch(openaiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Services: ${services.join(', ')}` }
        ],
        temperature: 0.2
      })
    });
    const result = await response.json();
    return {
      success: true,
      result: result.choices?.[0]?.message?.content || result.response,
      metadata: { model, timestamp: Date.now() }
    };
  } catch (error) {
    console.error('Documentation agent error:', error);
    throw error;
  }
}

router.post('/documentation', async (request, env) => {
  validateEnv(env);
  try {
    const { services } = await request.json();
    if (!Array.isArray(services) || services.length === 0) {
      return new Response(JSON.stringify({ error: 'Invalid services configuration' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    const docResult = await generateDocumentation(services, env);
    return new Response(JSON.stringify(docResult), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Documentation automation failed', details: error.message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

router.all('*', () => new Response('Not Found', { status: 404 }));

export default {
  fetch: router.handle
}; 