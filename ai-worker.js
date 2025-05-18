import { Router } from 'itty-router';

const router = Router();

// Agent specializations
const AGENT_TYPES = {
  TERRAFORM: '@cf/meta/llama-3.1-8b-instruct',
  SECURITY: 'gpt-4',
  MONITORING: '@cf/meta/llama-2-7b-chat',
  CODE_GEN: '@cf/meta/codellama-7b-instruct',
  INTEGRATION: '@cf/meta/llama-2-7b-chat'
};

function validateEnv(env) {
  if (!env.OPENAI_API_KEY) throw new Error('Missing required env: OPENAI_API_KEY');
  if (!env.AI_GATEWAY_TOKEN) throw new Error('Missing required env: AI_GATEWAY_TOKEN');
}

// Parallel agent execution with specialized prompts
async function executeParallelAgents(tasks, env) {
  const agentPromises = tasks.map(async task => {
    const { type, config, model } = task;
    const baseUrl = "https://gateway.ai.cloudflare.com/v1/620865722bd88ef0a77dbbb60c91392e/project-ignite/workers-ai";
    const openaiUrl = "https://api.openai.com/v1/chat/completions";
    
    const systemPrompts = {
      terraform: "You are an expert infrastructure engineer specializing in secure, scalable cloud architecture.",
      security: "You are a senior security architect focused on zero-trust and least-privilege access.",
      monitoring: "You are a DevOps specialist in observability and monitoring systems.",
      code: "You are a full-stack developer expert in cloud-native applications.",
      integration: "You are a systems integration architect specializing in API design and service mesh."
    };

    try {
      const useOpenAI = model.startsWith('gpt');
      const url = useOpenAI ? openaiUrl : `${baseUrl}/${model}`;
      const token = useOpenAI ? env.OPENAI_API_KEY : env.AI_GATEWAY_TOKEN;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(useOpenAI ? {
          model,
          messages: [
            { role: 'system', content: systemPrompts[type] },
            { role: 'user', content: config.prompt }
          ],
          temperature: config.temperature || 0.2
        } : {
          prompt: `${systemPrompts[type]}\n\nTask: ${config.prompt}`
        })
      });

      const result = await response.json();
      return {
        type,
        result: result.choices?.[0]?.message?.content || result.response,
        metadata: { model, timestamp: Date.now() }
      };
    } catch (error) {
      console.error(`Agent ${type} error:`, error);
      throw error;
    }
  });

  return Promise.all(agentPromises);
}

// Enhanced router with specialized endpoints
router.post('/infrastructure', async (request, env) => {
  validateEnv(env);
  const config = await request.json();
  const tasks = [
    {
      type: 'terraform',
      model: AGENT_TYPES.TERRAFORM,
      config: {
        prompt: `Generate secure Terraform modules for: ${config.services.join(', ')}. Include all necessary providers, variables, and outputs. Implement strict security groups and IAM policies.`,
        temperature: 0.3
      }
    },
    {
      type: 'security',
      model: AGENT_TYPES.SECURITY,
      config: {
        prompt: `Create comprehensive security policies and IAM configurations for: ${config.services.join(', ')}. Include audit logging and encryption requirements.`,
        temperature: 0.1
      }
    }
  ];

  const results = await executeParallelAgents(tasks, env);
  return new Response(JSON.stringify({ success: true, results }), {
    headers: { 'Content-Type': 'application/json' }
  });
});

router.post('/monitoring', async (request, env) => {
  validateEnv(env);
  const config = await request.json();
  const tasks = [
    {
      type: 'monitoring',
      model: AGENT_TYPES.MONITORING,
      config: {
        prompt: `Generate complete monitoring configuration including dashboards, alerts, and SLOs for: ${config.services.join(', ')}. Include cost monitoring and performance metrics.`,
        temperature: 0.2
      }
    }
  ];

  const results = await executeParallelAgents(tasks, env);
  return new Response(JSON.stringify({ success: true, results }), {
    headers: { 'Content-Type': 'application/json' }
  });
});

router.post('/integration', async (request, env) => {
  validateEnv(env);
  const config = await request.json();
  const tasks = [
    {
      type: 'integration',
      model: AGENT_TYPES.INTEGRATION,
      config: {
        prompt: `Design service integration patterns and API configurations for: ${config.services.join(', ')}. Include error handling and retry logic.`,
        temperature: 0.2
      }
    },
    {
      type: 'code',
      model: AGENT_TYPES.CODE_GEN,
      config: {
        prompt: `Generate cloud function code and deployment configurations for: ${config.services.join(', ')}. Include proper error handling and logging.`,
        temperature: 0.3
      }
    }
  ];

  const results = await executeParallelAgents(tasks, env);
  return new Response(JSON.stringify({ success: true, results }), {
    headers: { 'Content-Type': 'application/json' }
  });
});

router.post('/documentation', async (request, env) => {
  validateEnv(env);
  try {
    const config = await request.json();
    const tasks = [
      {
        type: 'documentation',
        model: 'gpt-4',
        config: {
          prompt: `You are a senior technical writer and DevOps engineer. Generate a detailed, actionable documentation update for the following services: ${config.services.join(', ')}. Include architecture diagrams (as markdown), change log, and Jira/Confluence update instructions.`,
          temperature: 0.2
        }
      }
    ];
    const results = await executeParallelAgents(tasks, env);
    return new Response(JSON.stringify({ success: true, results }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Documentation agent error:', error);
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
