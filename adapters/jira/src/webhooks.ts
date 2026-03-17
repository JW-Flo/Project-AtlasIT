import type { Bindings, JiraWebhookPayload } from "./types.js";
import { publishEvent } from "./event-publisher.js";

const HANDLED_WEBHOOK_EVENTS = new Set([
  "jira:issue_created",
  "jira:issue_updated",
  "user_created",
  "user_updated",
  "user_deleted",
]);

function mapWebhookEventType(jiraEvent: string): string | null {
  switch (jiraEvent) {
    case "jira:issue_created":
      return "issue.created";
    case "jira:issue_updated":
      return "issue.updated";
    case "user_created":
      return "user.provisioned";
    case "user_updated":
      return "user.updated";
    case "user_deleted":
      return "user.deprovisioned";
    default:
      return null;
  }
}

function buildIssuePayload(body: JiraWebhookPayload): Record<string, unknown> {
  const issue = body.issue;
  if (!issue) return {};

  return {
    issueId: issue.id,
    issueKey: issue.key,
    summary: issue.fields.summary,
    status: issue.fields.status.name,
    issueType: issue.fields.issuetype.name,
    priority: issue.fields.priority?.name ?? null,
    projectKey: issue.fields.project.key,
    projectName: issue.fields.project.name,
    assignee: issue.fields.assignee
      ? {
          accountId: issue.fields.assignee.accountId,
          displayName: issue.fields.assignee.displayName,
          email: issue.fields.assignee.emailAddress ?? null,
        }
      : null,
    reporter: issue.fields.reporter
      ? {
          accountId: issue.fields.reporter.accountId,
          displayName: issue.fields.reporter.displayName,
          email: issue.fields.reporter.emailAddress ?? null,
        }
      : null,
    changelog: body.changelog ?? null,
  };
}

function buildUserPayload(body: JiraWebhookPayload): Record<string, unknown> {
  const user = body.user;
  if (!user) return {};

  return {
    accountId: user.accountId,
    displayName: user.displayName,
    email: user.emailAddress ?? null,
    active: user.active,
    accountType: user.accountType,
  };
}

export async function handleWebhook(
  body: JiraWebhookPayload,
  env: Bindings,
  tenantId: string,
  correlationId?: string,
): Promise<{ processed: boolean; eventType: string | null }> {
  const webhookEvent = body.webhookEvent;

  if (!HANDLED_WEBHOOK_EVENTS.has(webhookEvent)) {
    return { processed: false, eventType: null };
  }

  const atlasEventType = mapWebhookEventType(webhookEvent);
  if (!atlasEventType) {
    return { processed: false, eventType: null };
  }

  const isIssueEvent = webhookEvent.startsWith("jira:issue_");
  const payload = isIssueEvent
    ? buildIssuePayload(body)
    : buildUserPayload(body);

  const idempotencyKey =
    isIssueEvent && body.issue
      ? `jira:${body.issue.id}:${webhookEvent}:${body.timestamp}`
      : `jira:${webhookEvent}:${body.timestamp}`;

  await publishEvent({
    orchestratorUrl: env.ORCHESTRATOR_URL,
    tenantId,
    type: atlasEventType,
    source: "connector:jira",
    payload: {
      jiraEvent: webhookEvent,
      timestamp: body.timestamp,
      ...payload,
    },
    idempotencyKey,
    correlationId,
  });

  return { processed: true, eventType: atlasEventType };
}
