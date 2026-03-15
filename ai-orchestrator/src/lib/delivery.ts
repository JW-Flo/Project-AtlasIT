import { signPayload } from "./hmac";

export interface DeliveryResult {
  success: boolean;
  statusCode?: number;
  error?: string;
}

export async function deliverToAgent(
  webhookUrl: string,
  eventBody: string,
  secret: string,
  correlationId: string,
  eventId: string,
  maxRetries: number = 3,
): Promise<DeliveryResult> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const signature = await signPayload(eventBody, secret);

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Correlation-ID": correlationId,
          "X-Event-ID": eventId,
          "X-Signature": signature,
          "X-Attempt": String(attempt + 1),
        },
        body: eventBody,
      });

      if (response.ok) {
        return { success: true, statusCode: response.status };
      }

      // Don't retry 4xx errors (client errors)
      if (response.status >= 400 && response.status < 500) {
        const error = await response.text().catch(() => "Unknown");
        return {
          success: false,
          statusCode: response.status,
          error: error.slice(0, 500),
        };
      }

      // Exponential backoff for 5xx errors
      if (attempt < maxRetries - 1) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    } catch (err) {
      if (attempt === maxRetries - 1) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Unknown error",
        };
      }
      const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  return { success: false, error: "Max retries exceeded" };
}
