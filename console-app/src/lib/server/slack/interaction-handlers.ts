/**
 * Slack interaction handler logic for block_actions and view_submission.
 * Mirrors patterns from adapters/slack/src/webhooks.ts handleInteraction().
 */

export interface InteractionResult {
  processed: boolean;
  actions: string[];
}

export async function handleBlockActions(
  payload: any,
  db: D1Database | null,
  tenantId?: string | null,
): Promise<InteractionResult> {
  const actions = payload.actions ?? [];
  if (actions.length === 0) {
    return { processed: false, actions: [] };
  }

  const processedActions: string[] = [];

  for (const action of actions) {
    const actionId: string = action.action_id ?? "";

    if (actionId === "approval_approve" || actionId === "approval_deny") {
      const decision = actionId === "approval_approve" ? "approved" : "denied";

      let requestData: { requestId: string; callbackUrl?: string } | null = null;
      try {
        requestData = JSON.parse(action.value ?? "{}");
      } catch {
        console.error(
          JSON.stringify({
            level: "error",
            event: "slack.malformed_action_value",
            actionId,
            value: action.value,
          }),
        );
        continue;
      }

      if (!requestData?.requestId) continue;

      // Update access request in D1
      if (db && tenantId) {
        await db
          .prepare(
            `UPDATE access_requests
             SET status = ?1, decided_at = datetime('now'), decided_by = ?2, updated_at = datetime('now')
             WHERE id = ?3 AND tenant_id = ?4`,
          )
          .bind(decision, payload.user?.id ?? "slack-user", requestData.requestId, tenantId)
          .run();
      }

      // Acknowledge to user via response_url
      if (payload.response_url) {
        try {
          await fetch(payload.response_url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              replace_original: true,
              text: `Request ${decision} by <@${payload.user?.id}>`,
            }),
          });
        } catch {
          // Best-effort acknowledgment
        }
      }

      // Fire callback if configured
      if (requestData.callbackUrl) {
        try {
          await fetch(requestData.callbackUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              requestId: requestData.requestId,
              decision,
              decidedBy: payload.user?.id,
            }),
          });
        } catch (err) {
          console.error(
            JSON.stringify({
              level: "error",
              event: "slack.callback_failed",
              callbackUrl: requestData.callbackUrl,
              error: err instanceof Error ? err.message : "Unknown error",
            }),
          );
        }
      }

      processedActions.push(actionId);
    } else {
      // Generic action — log and acknowledge
      console.log(
        JSON.stringify({
          level: "info",
          event: "slack.generic_action",
          actionId,
          blockId: action.block_id,
          value: action.value,
          user: payload.user?.id,
        }),
      );
      processedActions.push(actionId);
    }
  }

  return { processed: processedActions.length > 0, actions: processedActions };
}

export async function handleViewSubmission(payload: any): Promise<InteractionResult> {
  const callbackId = payload.view?.callback_id;

  // Known modal callback IDs
  const knownModals = ["task_modal", "evidence_modal", "feedback_modal"];

  if (!knownModals.includes(callbackId)) {
    console.log(
      JSON.stringify({
        level: "info",
        event: "slack.unknown_modal",
        callbackId,
        user: payload.user?.id,
      }),
    );
    return { processed: false, actions: [] };
  }

  const values = payload.view?.state?.values ?? {};
  console.log(
    JSON.stringify({
      level: "info",
      event: "slack.modal_submitted",
      callbackId,
      user: payload.user?.id,
      fieldCount: Object.keys(values).length,
    }),
  );

  return { processed: true, actions: [callbackId] };
}
