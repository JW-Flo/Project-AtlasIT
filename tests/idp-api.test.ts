import { describe, expect, it } from "vitest";
import { GET as listAdaptersRoute } from "../routes/api/idp/list/+server.ts";
import { POST as provisionRoute } from "../routes/api/idp/provision/+server.ts";

describe("IdP API routes", () => {
  it("lists adapters only when flag enabled", async () => {
    const disabled = await listAdaptersRoute({ locals: { env: {} } });
    const disabledBody = await disabled.json();
    expect(disabledBody.adapters).toEqual([]);

    const enabled = await listAdaptersRoute({
      locals: { env: { FEATURE_IDP_OKTA: "1" } },
    });
    const enabledBody = await enabled.json();
    expect(enabledBody.adapters[0]?.id).toBe("okta");
  });

  it("provisions via Okta adapter", async () => {
    const request = new Request("https://atlasit.test/api/idp/provision", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user: {
          id: "api-user",
          email: "api.user@okta.example",
          displayName: "API User",
        },
      }),
    });
    const response = await provisionRoute({
      request,
      locals: { env: { FEATURE_IDP_OKTA: "1" } },
    });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.result.ok).toBe(true);
  });
});
