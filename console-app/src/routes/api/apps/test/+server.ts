import type { RequestHandler } from "@sveltejs/kit";
import {
  getCredentials,
  getOAuthAccessToken,
  updateTestStatus,
} from "$lib/server/credentials";

/** AWS Signature V4 helpers */
async function hmacSha256(
  key: ArrayBuffer | Uint8Array,
  data: string,
): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key instanceof Uint8Array ? key : new Uint8Array(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(data));
}

async function sha256Hex(data: string): Promise<string> {
  const hash = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(data),
  );
  return bufToHex(hash);
}

function bufToHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

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

  aws: async (creds) => {
    const accessKey = creds.access_key_id;
    const secretKey = creds.secret_access_key;
    const region = creds.region || "us-east-1";
    if (!accessKey || !secretKey)
      return {
        ok: false,
        message: "Missing access_key_id or secret_access_key",
      };

    // AWS STS GetCallerIdentity with Signature V4
    const host = "sts.amazonaws.com";
    const now = new Date();
    const dateStamp = now.toISOString().replace(/[-:]/g, "").slice(0, 8);
    const amzDate =
      dateStamp +
      "T" +
      now.toISOString().replace(/[-:]/g, "").slice(9, 15) +
      "Z";
    const service = "sts";
    const body = "Action=GetCallerIdentity&Version=2011-06-15";
    const bodyHash = await sha256Hex(body);

    const canonicalHeaders = `content-type:application/x-www-form-urlencoded\nhost:${host}\nx-amz-date:${amzDate}\n`;
    const signedHeaders = "content-type;host;x-amz-date";
    const canonicalRequest = `POST\n/\n\n${canonicalHeaders}\n${signedHeaders}\n${bodyHash}`;

    const scope = `${dateStamp}/${region}/${service}/aws4_request`;
    const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${scope}\n${await sha256Hex(canonicalRequest)}`;

    const kDate = await hmacSha256(
      new TextEncoder().encode("AWS4" + secretKey),
      dateStamp,
    );
    const kRegion = await hmacSha256(kDate, region);
    const kService = await hmacSha256(kRegion, service);
    const kSigning = await hmacSha256(kService, "aws4_request");
    const signature = bufToHex(await hmacSha256(kSigning, stringToSign));

    const authHeader = `AWS4-HMAC-SHA256 Credential=${accessKey}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    try {
      const res = await fetch(`https://${host}/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Host: host,
          "X-Amz-Date": amzDate,
          Authorization: authHeader,
        },
        body,
      });
      if (res.ok) {
        const text = await res.text();
        const arnMatch = text.match(/<Arn>([^<]+)<\/Arn>/);
        const accountMatch = text.match(/<Account>([^<]+)<\/Account>/);
        const arn = arnMatch?.[1] || "unknown";
        const account = accountMatch?.[1] || "unknown";
        return { ok: true, message: `AWS account ${account} (${arn})` };
      }
      return { ok: false, message: `AWS STS error: ${res.status}` };
    } catch (e: any) {
      return { ok: false, message: `AWS connection failed: ${e.message}` };
    }
  },

  github: async (creds, token) => {
    const tok =
      token ||
      creds.personal_access_token ||
      creds.pat ||
      creds.client_secret ||
      creds.api_key;
    if (!tok)
      return {
        ok: false,
        message: "No token available. Connect via OAuth or provide a PAT.",
      };
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

export const POST: RequestHandler = async ({ request, platform, locals }) => {
  const user = locals.user;
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  const tenantId = user.tenantId;
  if (!tenantId) {
    return new Response(JSON.stringify({ error: "Tenant context required" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }
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

  const creds = await getCredentials(platform, appId, tenantId);
  const token = await getOAuthAccessToken(platform, appId, tenantId);

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
  await updateTestStatus(platform, appId, result.ok, tenantId);

  return new Response(
    JSON.stringify({ healthy: result.ok, message: result.message }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
};
