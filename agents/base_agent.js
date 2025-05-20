import { Agent } from '../MCP_Index.js';
import { MCPClient } from './mcp_client.js';
import { RateLimiter, withBackoff, defaultClassifier } from '../utils/api_guard.js';

export class BaseAgent extends Agent {
  constructor(ctx, env) {
    super(ctx, env);
    this.name = 'base-agent';
    this.version = '1.1.0';
    // initialize MCP client for context retrieval
    this.mcp = new MCPClient({ host: process.env.MCP_HOST });

    // --- Safeguards & Runtime Constraints -----------------------------
    // Global immutable deadline (defaults to 6 hours if not provided)
    const minutes = parseInt(process.env.MCP_TIMELIMIT_MINUTES || '360', 10);
    this.deadline = Date.now() + minutes * 60 * 1000;

    // Simple per-endpoint rate limiter
    this.rateLimiter = new RateLimiter();
  }

  /**
   * Remaining milliseconds before hard deadline.
   */
  timeRemaining() {
    return this.deadline - Date.now();
  }

  /**
   * Escalate an issue to Guardian Department via Slack webhook without
   * including sensitive payload. `level` is CRITICAL/HIGH/NORMAL/LOW.
   */
  async escalate(level, summary) {
    try {
      const webhook = process.env.SLACK_WEBHOOK_URL;
      if (!webhook) return;
      const payload = {
        text: `:rotating_light: *${level}* – ${summary}\nAgent: ${this.name}\nTime: ${new Date().toISOString()}`
      };
      await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (_) {
      /* non-blocking */
    }
  }

  /**
   * Wrapper for calling external APIs with rate-limiting, back-off, and
   * deadline checking. `key` identifies the service/endpoint for tracking.
   * `fn` must be an async function that performs the real call and returns
   * the result or throws on error.
   */
  async callExternalApi(key, fn) {
    if (this.timeRemaining() <= 0) {
      await this.escalate('CRITICAL', 'Deadline reached – aborting API call');
      throw new Error('Global deadline exceeded');
    }

    if (!this.rateLimiter.canProceed(key)) {
      await this.escalate('HIGH', `Rate limit reached for ${key}`);
      throw new Error(`Rate limit exceeded for ${key}`);
    }

    this.rateLimiter.registerCall(key);

    try {
      const result = await withBackoff(fn, { classifier: defaultClassifier });
      return result;
    } catch (err) {
      await this.escalate('HIGH', `Repeated failure calling ${key}: ${err.message}`);
      throw err;
    }
  }

  /**
   * Retrieve relevant workspace context from MCP before processing a query
   */
  async fetchContext(query) {
    const response = await this.mcp.callTool({ name: 'context/retrieve', arguments: { query, topK: 5 } });
    return response.content.map(part => part.text || '').join('\n');
  }

  async onMessage(connection, message) {
    // Handle incoming messages
    // enrich request messages with MCP context
    if (message.type === 'request' && typeof message.params?.query === 'string') {
      const ctxSnippet = await this.fetchContext(message.params.query);
      message.params.query = `${ctxSnippet}\n${message.params.query}`;
    }

    if (message.type === 'request') {
      // Handle tool requests
      if (message.method === 'callTool') {
        return this.handleToolCall(message.params);
      }
      // Handle resource requests
      if (message.method === 'readResource') {
        return this.handleResourceRead(message.params);
      }
    }
    return super.onMessage(connection, message);
  }

  async handleToolCall(params) {
    const { name, args } = params;
    switch (name) {
      case 'read':
        return this.handleRead(args);
      case 'write':
        return this.handleWrite(args);
      case 'execute':
        return this.handleExecute(args);
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  async handleResourceRead(params) {
    const { name, path } = params;
    switch (name) {
      case 'file':
        return this.readFile(path);
      case 'directory':
        return this.readDirectory(path);
      default:
        throw new Error(`Unknown resource: ${name}`);
    }
  }

  // Basic tool implementations
  async handleRead(args) {
    // Implement read functionality
    return { success: true, data: 'Read operation completed' };
  }

  async handleWrite(args) {
    // Implement write functionality
    return { success: true, data: 'Write operation completed' };
  }

  async handleExecute(args) {
    // Implement execute functionality
    return { success: true, data: 'Execute operation completed' };
  }

  // Basic resource implementations
  async readFile(path) {
    // Implement file reading
    return { success: true, data: 'File contents' };
  }

  async readDirectory(path) {
    // Implement directory reading
    return { success: true, data: ['file1', 'file2'] };
  }
}