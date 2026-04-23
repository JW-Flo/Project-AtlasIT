import http from "node:http";
import { Readable } from "node:stream";
import { handler as svelteHandler } from "./handler.js";

let _server;

function getServer() {
  if (!_server) {
    _server = http.createServer(svelteHandler);
  }
  return _server;
}

export async function handler(event, context) {
  context.callbackWaitsForEmptyEventLoop = false;

  const {
    rawPath = event.path || "/",
    rawQueryString = "",
    headers = {},
    body: rawBody,
    isBase64Encoded = false,
    requestContext = {},
  } = event;

  const method = event.httpMethod || requestContext?.http?.method || "GET";
  const urlPath = rawPath + (rawQueryString ? `?${rawQueryString}` : "");

  const bodyBuffer = rawBody
    ? isBase64Encoded
      ? Buffer.from(rawBody, "base64")
      : Buffer.from(rawBody)
    : null;

  const normalizedHeaders = {};
  for (const [k, v] of Object.entries(headers)) {
    normalizedHeaders[k.toLowerCase()] = v;
  }
  if (bodyBuffer) {
    normalizedHeaders["content-length"] = String(bodyBuffer.length);
  }

  return new Promise((resolve) => {
    const bodyStream = bodyBuffer ? Readable.from([bodyBuffer]) : Readable.from([]);

    const req = Object.assign(bodyStream, {
      method,
      url: urlPath,
      headers: normalizedHeaders,
      rawHeaders: Object.entries(normalizedHeaders).flat(),
      httpVersion: "1.1",
      httpVersionMajor: 1,
      httpVersionMinor: 1,
      connection: {
        remoteAddress: requestContext?.http?.sourceIp || "127.0.0.1",
        encrypted: true,
      },
      socket: {
        remoteAddress: requestContext?.http?.sourceIp || "127.0.0.1",
        encrypted: true,
        destroy() {},
      },
    });

    const res = new http.ServerResponse(req);
    const chunks = [];

    res.write = function (chunk, encoding, cb) {
      if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      if (typeof encoding === "function") {
        encoding();
        return true;
      }
      if (typeof cb === "function") cb();
      return true;
    };

    const originalEnd = res.end;
    res.end = function (data, encoding, cb) {
      if (data && data.length) chunks.push(Buffer.isBuffer(data) ? data : Buffer.from(data));
      if (typeof encoding === "function") cb = encoding;

      const responseBody = Buffer.concat(chunks);
      const contentType = String(res.getHeader("content-type") || "");
      const isBinary =
        contentType &&
        !contentType.startsWith("text/") &&
        !contentType.includes("json") &&
        !contentType.includes("javascript") &&
        !contentType.includes("xml") &&
        !contentType.includes("svg");

      const responseHeaders = {};
      for (const [k, v] of Object.entries(res.getHeaders())) {
        responseHeaders[k] = Array.isArray(v) ? v.join(", ") : String(v);
      }

      clearTimeout(timeout);
      resolve({
        statusCode: res.statusCode || 200,
        headers: responseHeaders,
        body: isBinary ? responseBody.toString("base64") : responseBody.toString("utf8"),
        isBase64Encoded: !!isBinary,
      });

      if (typeof cb === "function") cb();
    };

    const timeout = setTimeout(() => {
      resolve({
        statusCode: 504,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ error: "Gateway timeout" }),
      });
    }, 29000);

    try {
      svelteHandler(req, res, (err) => {
        if (err) {
          clearTimeout(timeout);
          console.error("Handler error:", err);
          resolve({
            statusCode: 500,
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ error: "Internal server error" }),
          });
        }
      });
    } catch (err) {
      clearTimeout(timeout);
      console.error("Handler threw:", err);
      resolve({
        statusCode: 500,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ error: "Internal server error" }),
      });
    }
  });
}
