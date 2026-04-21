/**
 * AWS Lambda handler wrapper for SvelteKit adapter-node
 * Converts API Gateway/Lambda Function URL events to Node.js HTTP request/response
 * and back to Lambda response format.
 */
import { handler as skHandler } from "./build-lambda/handler.js";

/**
 * Convert Lambda event to Node.js IncomingMessage-like object
 */
function createRequest(event) {
  const {
    rawPath = event.path || "/",
    rawQueryString = event.queryStringParameters
      ? new URLSearchParams(event.queryStringParameters).toString()
      : "",
    headers = {},
    body = "",
    isBase64Encoded = false,
    requestContext = {},
  } = event;

  const method = event.httpMethod || event.requestContext?.http?.method || "GET";
  const path = rawPath + (rawQueryString ? `?${rawQueryString}` : "");

  // Create a minimal IncomingMessage-compatible object
  const req = {
    method,
    url: path,
    headers: normalizeHeaders(headers),
    rawHeaders: Object.entries(headers).flat(),
    httpVersion: "1.1",
    connection: {},
    socket: {
      remoteAddress:
        requestContext.identity?.sourceIp || requestContext.http?.sourceIp || "127.0.0.1",
      remotePort: 443,
    },
  };

  // Add body handling
  if (body) {
    const buffer = isBase64Encoded ? Buffer.from(body, "base64") : Buffer.from(body);
    req.body = buffer;
    req.on = (event, handler) => {
      if (event === "data") handler(buffer);
      if (event === "end") handler();
      return req;
    };
  } else {
    req.on = (event, handler) => {
      if (event === "end") handler();
      return req;
    };
  }

  req.once = req.on;
  req.removeListener = () => req;
  req.removeAllListeners = () => req;

  return req;
}

/**
 * Create a ServerResponse-compatible object that collects response data
 */
function createResponse() {
  const chunks = [];
  let statusCode = 200;
  const headers = {};

  const res = {
    statusCode,
    headers,
    chunks,
    finished: false,

    writeHead(code, headersOrReason, maybeHeaders) {
      statusCode = code;
      const responseHeaders =
        typeof headersOrReason === "object" ? headersOrReason : maybeHeaders || {};
      Object.assign(headers, normalizeHeaders(responseHeaders));
      return res;
    },

    setHeader(name, value) {
      headers[name.toLowerCase()] = String(value);
      return res;
    },

    getHeader(name) {
      return headers[name.toLowerCase()];
    },

    removeHeader(name) {
      delete headers[name.toLowerCase()];
      return res;
    },

    write(chunk) {
      if (chunk) chunks.push(Buffer.from(chunk));
      return true;
    },

    end(data) {
      if (data) chunks.push(Buffer.from(data));
      res.finished = true;
      return res;
    },

    // EventEmitter stubs
    on: () => res,
    once: () => res,
    emit: () => true,
    removeListener: () => res,
  };

  return res;
}

/**
 * Normalize headers to lowercase keys
 */
function normalizeHeaders(headers) {
  const normalized = {};
  for (const [key, value] of Object.entries(headers || {})) {
    normalized[key.toLowerCase()] = Array.isArray(value) ? value.join(", ") : String(value);
  }
  return normalized;
}

/**
 * Convert response chunks to Lambda response format
 */
function formatResponse(res) {
  const body = Buffer.concat(res.chunks);
  const contentType = res.getHeader("content-type") || "";
  const isBinary =
    !contentType.startsWith("text/") &&
    !contentType.includes("json") &&
    !contentType.includes("javascript") &&
    !contentType.includes("xml");

  return {
    statusCode: res.statusCode || 200,
    headers: res.headers,
    body: isBinary ? body.toString("base64") : body.toString("utf8"),
    isBase64Encoded: isBinary,
  };
}

/**
 * Main Lambda handler
 */
export async function handler(event, context) {
  // Enable response streaming if context.awsRequestId exists (not local testing)
  if (context.awsRequestId) {
    context.callbackWaitsForEmptyEventLoop = false;
  }

  const req = createRequest(event);
  const res = createResponse();

  return new Promise((resolve, reject) => {
    // Set a timeout to prevent hanging
    const timeout = setTimeout(() => {
      if (!res.finished) {
        console.error("Handler timeout - no response after 29s");
        resolve({
          statusCode: 504,
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ error: "Gateway timeout" }),
        });
      }
    }, 29000); // 1s buffer before Lambda's 30s timeout

    // Override res.end to capture completion
    const originalEnd = res.end.bind(res);
    res.end = function (data) {
      originalEnd(data);
      clearTimeout(timeout);

      try {
        const response = formatResponse(res);
        resolve(response);
      } catch (err) {
        console.error("Error formatting response:", err);
        reject(err);
      }

      return res;
    };

    // Call the SvelteKit handler
    try {
      skHandler(req, res, (err) => {
        if (err) {
          console.error("Handler error:", err);
          clearTimeout(timeout);
          resolve({
            statusCode: 500,
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ error: "Internal server error" }),
          });
        }
      });
    } catch (err) {
      console.error("Handler threw:", err);
      clearTimeout(timeout);
      reject(err);
    }
  });
}
