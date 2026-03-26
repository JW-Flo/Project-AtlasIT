import { writeFile, appendFile, stat, rename } from 'fs/promises';
import { createWriteStream } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

console.log('import.meta.url:', import.meta.url);

const LOG_FILE = './logs/worker.log';
const MAX_LOG_SIZE = 10 * 1024 * 1024 * 1024; // 10GB

async function logMessage(message: object) {
  const logEntry = JSON.stringify({
    timestamp: new Date().toISOString(),
    ...message,
  }) + '\n';

  try {
    const stats = await stat(LOG_FILE).catch(() => null);

    if (stats && stats.size >= MAX_LOG_SIZE) {
      const rolledFile = LOG_FILE.replace('.log', `-${Date.now()}.log`);
      await rename(LOG_FILE, rolledFile);
    }

    await appendFile(LOG_FILE, logEntry);
  } catch (error) {
    console.error('Failed to write log:', error);
  }
}

export default {
  async fetch(request: Request): Promise<Response> {
    try {
      const url = new URL(request.url);
      const logData = {
        method: request.method,
        path: url.pathname,
        query: url.searchParams.toString(),
        headers: Object.fromEntries(request.headers.entries()),
      };

      await logMessage({ type: 'request', ...logData });

      return new Response('Documentation Worker is running.', { status: 200 });
    } catch (error) {
      await logMessage({ type: 'error', message: error.message, stack: error.stack });
      return new Response('Internal Server Error', { status: 500 });
    }
  },

  async tail(events, env, ctx) {
    for (const event of events) {
      try {
        // Log metadata from the event
        const logData = {
          timestamp: new Date().toISOString(),
          eventType: event.eventType,
          requestId: event.requestId,
          outcome: event.outcome,
          scriptName: event.scriptName,
          ...event.metadata,
        };

        console.log(JSON.stringify(logData));
      } catch (error) {
        console.error("Error processing tail event:", error);
      }
    }
  },
};