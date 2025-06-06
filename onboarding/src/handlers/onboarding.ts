import { Env } from '../types';
import { handleError } from '../utils/error';
import { validateTenantConfig } from '../utils/validation';
import { generateTemplate } from '../services/template';
import { AIConfigService } from '../services/ai-config';

export async function handleOnboarding(request: Request, env: Env): Promise<Response> {
  try {
    const body = await request.json();
    const { tenantId, name, industry, requirements } = body;

    // Validate request
    if (!tenantId || !name || !industry) {
      return new Response(JSON.stringify({
        error: 'Missing required fields: tenantId, name, industry'
      }), { status: 400 });
    }

    // Initialize AI configuration service
    const aiConfig = new AIConfigService(env.AI_API_KEY);
    
    // Generate recommended configuration based on requirements
    const recommendedConfig = await aiConfig.generateConfig({
      industry,
      requirements
    });

    // Validate configuration
    const validationResult = await validateTenantConfig(recommendedConfig);
    if (!validationResult.isValid) {
      return new Response(JSON.stringify({
        error: 'Invalid configuration',
        details: validationResult.errors
      }), { status: 400 });
    }

    // Generate tenant template
    const template = await generateTemplate(recommendedConfig);

    // Store tenant info and configuration
    await env.DB.prepare(
      'INSERT INTO tenants (id, name, industry, config, created_at) VALUES (?, ?, ?, ?, ?)'
    ).bind(
      tenantId,
      name,
      industry,
      JSON.stringify(recommendedConfig),
      new Date().toISOString()
    ).run();

    // Store onboarding state
    await env.STATE.put(`onboarding:${tenantId}`, JSON.stringify({
      status: 'configured',
      timestamp: new Date().toISOString(),
      config: recommendedConfig,
      template
    }));

    return new Response(JSON.stringify({
      status: 'success',
      tenantId,
      config: recommendedConfig,
      template
    }), {
      status: 201,
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    return handleError(error);
  }
}
