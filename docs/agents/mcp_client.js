import fetch from 'node-fetch';

export class MCPClient {
  constructor({ host }) {
    this.host = host.endsWith('/') ? host.slice(0, -1) : host;
  }

  async callTool({ name, arguments: args }) {
    const res = await fetch(`${this.host}/v1/tool-call`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, parameters: args })
    });
    if (!res.ok) {
      throw new Error(`MCP tool-call failed: ${res.status}`);
    }
    return res.json();
  }

  async registerTool(toolMeta) {
    // Future: POST to /v1/register-tool (not yet implemented)
    return { registered: false };
  }
} 