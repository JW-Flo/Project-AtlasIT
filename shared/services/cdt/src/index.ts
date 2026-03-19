import { makeR2BlobStore } from "../../platform-cf/r2";
import { makeKVState } from "../../platform-cf/kv";
import { makeQueue } from "../../platform-cf/queue";
import { telemetry } from "./telemetry";
import { makeControlRepo } from "./state/controlRepo";
import { makeEvidenceRepo } from "./state/evidenceRepo";
import { runControlEval, ALL_CONTROL_IDS } from "./evaluation/engine";
import { verifySignature } from "./auth";
import type { CdtEvent, ControlState } from "./models";
import { enforceIdempotency, persistIdempotency } from "./idempotency";
import { makeRemediationRunner } from "./remediation/runner";
import { validateClientCert } from "./mtls";

declare const EVIDENCE_BUCKET: R2Bucket;
declare const STATE_NS: KVNamespace;
declare const REMEDIATION_Q: Queue;
declare const IDEMP_NS: KVNamespace;

export default {
  async fetch(req: Request, env: any): Promise<Response> {
    const url = new URL(req.url);
    const blob = makeR2BlobStore(EVIDENCE_BUCKET);
    const state = makeKVState<ControlState>(STATE_NS);
    const queue = makeQueue(REMEDIATION_Q);
    const controlRepo = makeControlRepo(state);
    const evidenceRepo = makeEvidenceRepo(blob);

    if (url.pathname === "/twin/event" && req.method === "POST") {
      if (env.ALLOWED_CLIENT_CERT_FPS) {
        const allow = String(env.ALLOWED_CLIENT_CERT_FPS)
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean);
        if (allow.length) {
          const certOk = await validateClientCert(req, allow);
          if (!certOk.ok) {
            telemetry.log("warn", "cdt.auth.mtls_deny", {
              reason: certOk.reason,
              fingerprint: (certOk as any).fingerprint,
            });
            return new Response("forbidden", { status: 403 });
          }
        }
      }
      if (env.SIGNING_SECRET) {
        const authOk = await verifySignature(req, env.SIGNING_SECRET);
        if (!authOk) return new Response("unauthorized", { status: 401 });
      }
      const token = await enforceIdempotency(IDEMP_NS, req);
      if (token && !("key" in token)) {
        return new Response(JSON.stringify(token), {
          headers: {
            "content-type": "application/json",
            "x-idempotent-replay": "true",
          },
        });
      }
      const ev = (await req.json()) as CdtEvent;
      const controls = ALL_CONTROL_IDS;
      const started = Date.now();
      const results: any[] = [];
      for (const cid of controls) {
        const t0 = Date.now();
        const res = runControlEval(cid, ev);
        const updated = await controlRepo.upsert(ev.tenant, cid, (cur) => {
          const base: ControlState = cur ?? {
            tenant: ev.tenant,
            control_id: cid,
            state: "unknown",
            updated_at: new Date().toISOString(),
            evidence_ids: [],
            version: 0,
          };
          const before = base.state;
          base.state = res.decision;
          base.rationale = res.rationale;
          base.references = res.references;
          base.updated_at = new Date().toISOString();
          (base as any)._before = before;
          return base;
        });
        const before = (updated as any)._before as string | undefined;
        delete (updated as any)._before;
        if (before !== updated.state) {
          const evidence = await evidenceRepo.writeEvidence(
            { event: ev, result: res, before, after: updated.state },
            {
              control_id: cid,
              tenant: ev.tenant,
              producer: "cdt.eval",
              trace_id: ev.trace_id,
            },
          );
          updated.evidence_ids.push(evidence.id);
          await controlRepo.put(updated);
        }
        telemetry.metric("cdt.eval.count", 1, {
          control_id: cid,
          decision: updated.state,
        });
        telemetry.log("info", "cdt.eval", {
          trace_id: ev.trace_id,
          tenant: ev.tenant,
          control_id: cid,
          decision: updated.state,
          latency_ms: Date.now() - t0,
        });
        results.push({ control_id: cid, decision: updated.state });
      }
      telemetry.metric("cdt.eval.latency_ms", Date.now() - started, {
        evaluations: results.length.toString(),
      });
      const payload = { ok: true, results, trace_id: ev.trace_id };
      if (token && "key" in token)
        await persistIdempotency(IDEMP_NS, token, payload);
      return new Response(JSON.stringify(payload), {
        headers: { "content-type": "application/json" },
        status: 202,
      });
    }
    if (url.pathname.startsWith("/twin/remediate/") && req.method === "POST") {
      const cid = decodeURIComponent(url.pathname.split("/").pop()!);
      const body: any = await req.json().catch(() => ({}));
      const tenant = body.tenant;
      if (!tenant)
        return new Response(JSON.stringify({ error: "tenant required" }), {
          status: 400,
          headers: { "content-type": "application/json" },
        });
      const runner = makeRemediationRunner(queue);
      await runner.enqueue(tenant, cid, body.context ?? {});
      telemetry.log("info", "cdt.remediation.enqueue", {
        tenant,
        control_id: cid,
      });
      return new Response(JSON.stringify({ enqueued: true }), {
        status: 202,
        headers: { "content-type": "application/json" },
      });
    }

    const m = url.pathname.match(/^\/twin\/control\/(.+)$/);
    if (m && req.method === "GET") {
      const tenant = url.searchParams.get("tenant")!;
      const cid = decodeURIComponent(m[1]);
      const cs = await controlRepo.get(tenant, cid);
      return new Response(JSON.stringify(cs ?? null), {
        headers: { "content-type": "application/json" },
      });
    }

    if (url.pathname === "/twin/controls" && req.method === "GET") {
      const tenant = url.searchParams.get("tenant")!;
      const stateFilter = url.searchParams.get("state");
      const out: any[] = [];
      for await (const k of makeKVState<any>(STATE_NS).scan(
        `${tenant}/control/`,
      )) {
        const cs = await state.get(k.key);
        if (!cs) continue;
        if (!stateFilter || cs.state === stateFilter) out.push(cs);
      }
      return new Response(JSON.stringify(out), {
        headers: { "content-type": "application/json" },
      });
    }

    return new Response("not found", { status: 404 });
  },
} satisfies ExportedHandler;
