import type { RequestHandler } from "@sveltejs/kit";
import {
  getCredentials,
  getOAuthAccessToken,
  updateTestStatus,
} from "$lib/server/credentials";

/**
 * Test connection by actually calling the provider's API.
 * Each provider has a lightweight "ping" endpoint we can hit.
 */
const PROVIDER_TESTS: Record<
  string,
  (
    creds: Record<string, string>,
    token: string | null,
  ) => Promise<{ ok: boolean; message: string }>
> = {
  slack: async (_creds, token) => {
    if (!token)
      return { ok: false, message: "No OAuth token. Connect via OAuth first." };
    const res = await fetch("https://slack.com/api/auth.test", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data: any = await res.json();
    if (data.ok)
      return { ok: true, message: `Connected as ${data.team} (${data.user})` };
    return { ok: false, message: `Slack error: ${data.error}` };
  },

  okta: async (creds) => {
    const domain = creds.domain?.replace(/\/$/, "");
    if (!domain) return { ok: false, message: "Okta domain not configured" };
    // Use the org endpoint which is public
    const res = await fetch(`${domain}/.well-known/openid-configuration`);
    if (res.ok) return { ok: true, message: `Okta org reachable at ${domain}` };
    return { ok: false, message: `Cannot reach ${domain}: ${res.status}` };
  },

  bamboohr: async (creds) => {
    const domain = creds.company_domain;
    const key = creds.api_key;
    if (!domain || !key)
      return { ok: false, message: "Missing company_domain or api_key" };
    const res = await fetch(
      `https://api.bamboohr.com/api/gateway.php/${domain}/v1/employees/directory`,
      {
        headers: {
          Accept: "application/json",
          Authorization: `Basic ${btoa(key + ":x")}`,
        },
      },
    );
    if (res.ok) return { ok: true, message: "BambooHR API accessible" };
    return { ok: false, message: `BambooHR error: ${res.status}` };
  },

  stripe: async (creds) => {
    const key = creds.secret_key;
    if (!key) return { ok: false, message: "Missing secret_key" };
    const res = await fetch("https://api.stripe.com/v1/balance", {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (res.ok) return { ok: true, message: "Stripe API key valid" };
    return { ok: false, message: `Stripe error: ${res.status}` };
  },

  pagerduty: async (creds) => {
    const key = creds.api_key;
    if (!key) return { ok: false, message: "Missing api_key" };
    const res = await fetch("https://api.pagerduty.com/abilities", {
      headers: {
        Authorization: `Token token=${key}`,
        "Content-Type": "application/json",
      },
    });
    if (res.ok) return { ok: true, message: "PagerDuty API key valid" };
    return { ok: false, message: `PagerDuty error: ${res.status}` };
  },

  datadog: async (creds) => {
    const site = creds.site || "datadoghq.com";
    const apiKey = creds.api_key;
    const appKey = creds.app_key;
    if (!apiKey || !appKey)
      return { ok: false, message: "Missing api_key or app_key" };
    const res = await fetch(`https://api.${site}/api/v1/validate`, {
      headers: { "DD-API-KEY": apiKey, "DD-APPLICATION-KEY": appKey },
    });
    if (res.ok) return { ok: true, message: "Datadog API keys valid" };
    return { ok: false, message: `Datadog error: ${res.status}` };
  },

  github: async (_creds, token) => {
    const tok = token || _creds.client_secret; // PAT can be stored as client_secret
    if (!tok) return { ok: false, message: "No token available" };
    const res = await fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${tok}`, "User-Agent": "AtlasIT" },
    });
    if (res.ok) {
      const data: any = await res.json();
      return { ok: true, message: `GitHub authenticated as ${data.login}` };
    }
    return { ok: false, message: `GitHub error: ${res.status}` };
  },
};

/** Generic fallback: just verify credentials exist */
async function genericTest(
  creds: Record<string, string>,
): Promise<{ ok: boolean; message: string }> {
  const hasValues = Object.values(creds).some((v) => v?.trim());
  if (hasValues)
    return {
      ok: true,
      message:
        "Credentials stored. Live API test not yet implemented for this provider.",
    };
  return { ok: false, message: "No credentials found" };
}

export const POST: RequestHandler = async ({ request, platform }) => {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const appId = body.appId;
  if (!appId) {
    return new Response(JSON.stringify({ error: "appId is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const creds = await getCredentials(platform, appId);
  const token = await getOAuthAccessToken(platform, appId);

  if (!creds && !token) {
    return new Response(
      JSON.stringify({
        healthy: false,
        message: "No credentials stored for this app",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }

  const testFn = PROVIDER_TESTS[appId] || genericTest;
  const result = await testFn(creds || {}, token);

  // Persist test result
  await updateTestStatus(platform, appId, result.ok);

  return new Response(
    JSON.stringify({ healthy: result.ok, message: result.message }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
};
