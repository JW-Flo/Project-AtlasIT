import { handleOnboarding } from './handlers/onboarding';
import { Env } from './types';
import { handleError } from './utils/error';

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Health check endpoint
      if (url.pathname === '/health') {
        return new Response(JSON.stringify({
          status: 'healthy',
          service: 'onboarding',
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }

      // Onboarding flow endpoint - updated to use our enhanced handler
      if (url.pathname === '/api/onboarding' && request.method === 'POST') {
        const response = await handleOnboarding(request, env);
        // Add CORS headers to response
        Object.entries(corsHeaders).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
        return response;
      }

      // Get onboarding status
      if (url.pathname.startsWith('/api/onboarding/') && request.method === 'GET') {
        const tenantId = url.pathname.split('/').pop();
        if (!tenantId) {
          return new Response(JSON.stringify({ error: 'Tenant ID required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        const state = await env.STATE.get(`onboarding:${tenantId}`);
        if (!state) {
          return new Response(JSON.stringify({ error: 'Onboarding not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        return new Response(state, {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // Default 404 response
      return new Response(JSON.stringify({ 
        error: 'Not Found',
        path: url.pathname,
        method: request.method
      }), {
        status: 404,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });

    } catch (error) {
      console.error('Unhandled error:', error);
      return handleError(error);
    }
  },
};
