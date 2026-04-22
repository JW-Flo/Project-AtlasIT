import { r as requireSlackSignature } from './slack-verify-DWbLguuy.js';
import { r as resolveSlackTenant } from './resolve-tenant-D40mFDr1.js';

async function handleBlockActions(payload, db, tenantId) {
  const actions = payload.actions ?? [];
  if (actions.length === 0) {
    return { processed: false, actions: [] };
  }
  const processedActions = [];
  for (const action of actions) {
    const actionId = action.action_id ?? "";
    if (actionId === "approval_approve" || actionId === "approval_deny") {
      const decision = actionId === "approval_approve" ? "approved" : "denied";
      let requestData = null;
      try {
        requestData = JSON.parse(action.value ?? "{}");
      } catch {
        console.error(
          JSON.stringify({
            level: "error",
            event: "slack.malformed_action_value",
            actionId,
            value: action.value
          })
        );
        continue;
      }
      if (!requestData?.requestId) continue;
      if (db && tenantId) {
        await db.prepare(
          `UPDATE access_requests
             SET status = ?1, decided_at = datetime('now'), decided_by = ?2, updated_at = datetime('now')
             WHERE id = ?3 AND tenant_id = ?4`
        ).bind(decision, payload.user?.id ?? "slack-user", requestData.requestId, tenantId).run();
      }
      if (payload.response_url) {
        try {
          await fetch(payload.response_url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              replace_original: true,
              text: `Request ${decision} by <@${payload.user?.id}>`
            })
          });
        } catch {
        }
      }
      if (requestData.callbackUrl) {
        try {
          await fetch(requestData.callbackUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              requestId: requestData.requestId,
              decision,
              decidedBy: payload.user?.id
            })
          });
        } catch (err) {
          console.error(
            JSON.stringify({
              level: "error",
              event: "slack.callback_failed",
              callbackUrl: requestData.callbackUrl,
              error: err instanceof Error ? err.message : "Unknown error"
            })
          );
        }
      }
      processedActions.push(actionId);
    } else {
      console.log(
        JSON.stringify({
          level: "info",
          event: "slack.generic_action",
          actionId,
          blockId: action.block_id,
          value: action.value,
          user: payload.user?.id
        })
      );
      processedActions.push(actionId);
    }
  }
  return { processed: processedActions.length > 0, actions: processedActions };
}
async function handleViewSubmission(payload) {
  const callbackId = payload.view?.callback_id;
  const knownModals = ["task_modal", "evidence_modal", "feedback_modal"];
  if (!knownModals.includes(callbackId)) {
    console.log(
      JSON.stringify({
        level: "info",
        event: "slack.unknown_modal",
        callbackId,
        user: payload.user?.id
      })
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
      fieldCount: Object.keys(values).length
    })
  );
  return { processed: true, actions: [callbackId] };
}
const POST = async ({ request, platform }) => {
  const env = platform?.env;
  if (!env) {
    return new Response(JSON.stringify({ error: "no_env" }), { status: 500 });
  }
  const result = await requireSlackSignature(request, env);
  if (result instanceof Response) return result;
  const params = new URLSearchParams(result.body);
  const raw = params.get("payload");
  if (!raw) {
    return new Response(JSON.stringify({ error: "missing_payload" }), {
      status: 400
    });
  }
  const payload = JSON.parse(raw);
  const type = payload.type;
  console.log(
    JSON.stringify({
      level: "info",
      event: "slack.interaction_received",
      type,
      team: payload.team?.id,
      user: payload.user?.id
    })
  );
  const db = env.ATLAS_SHARED_DB ?? null;
  const teamId = payload.team?.id;
  const tenantId = db && teamId ? await resolveSlackTenant(db, teamId) : null;
  if (type === "block_actions") {
    await handleBlockActions(payload, db, tenantId);
  }
  if (type === "view_submission") {
    await handleViewSubmission(payload);
  }
  return new Response(null, { status: 200 });
};

export { POST };
//# sourceMappingURL=_server.ts-Qx2mzE-H.js.map
