import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SQSEvent, SQSRecord } from "aws-lambda";

const mockAuditRepo = { log: vi.fn() };

vi.mock("@atlasit/shared/platform/aws/bootstrap.js", () => ({
  bootstrap: () => ({
    auditRepo: mockAuditRepo,
    sessionRepo: { get: vi.fn() },
    cacheRepo: { get: vi.fn() },
    flagRepo: { get: vi.fn() },
    tenantRepo: { getById: vi.fn() },
    evidenceRepo: { put: vi.fn() },
    queueRepo: { send: vi.fn() },
    authRepo: { validateSession: vi.fn() },
  }),
}));

vi.mock("pg", () => {
  const mockQuery = vi.fn().mockResolvedValue({ rows: [], rowCount: 0 });
  return { default: { Pool: vi.fn(() => ({ query: mockQuery })) } };
});

import { handler } from "../handler.js";

function makeSQSEvent(bodies: Record<string, unknown>[]): SQSEvent {
  return {
    Records: bodies.map((body, i) => ({
      messageId: `msg-${i}`,
      receiptHandle: `receipt-${i}`,
      body: JSON.stringify(body),
      attributes: {
        ApproximateReceiveCount: "1",
        SentTimestamp: "1234567890",
        SenderId: "test",
        ApproximateFirstReceiveTimestamp: "1234567890",
      },
      messageAttributes: {},
      md5OfBody: "abc",
      eventSource: "aws:sqs",
      eventSourceARN: "arn:aws:sqs:us-east-1:123:atlasit-step-tasks-dlq-dev",
      awsRegion: "us-east-1",
    })) as SQSRecord[],
  };
}

describe("dlq-processor handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("processes SQS DLQ messages", async () => {
    const event = makeSQSEvent([{
      tenantId: "tenant-1",
      eventType: "user.created",
      payload: { userId: "u-1" },
      error: "timeout",
    }]);
    const result = await handler(event);
    // Should not throw — DLQ processor is best-effort
    expect(result).toBeDefined();
  });

  it("handles malformed messages gracefully", async () => {
    const event: SQSEvent = {
      Records: [{
        messageId: "bad-msg",
        receiptHandle: "receipt",
        body: "not-json",
        attributes: {
          ApproximateReceiveCount: "1",
          SentTimestamp: "1234567890",
          SenderId: "test",
          ApproximateFirstReceiveTimestamp: "1234567890",
        },
        messageAttributes: {},
        md5OfBody: "abc",
        eventSource: "aws:sqs",
        eventSourceARN: "arn:aws:sqs:us-east-1:123:dlq",
        awsRegion: "us-east-1",
      }] as SQSRecord[],
    };
    // Should not throw
    const result = await handler(event);
    expect(result).toBeDefined();
  });
});
