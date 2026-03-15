import { getCredentials, getOAuthAccessToken } from "../../console-app/src/lib/server/credentials";

export async function loadConnectorCredentials(
  platform: any,
  appId: string,
): Promise<{ credentials: Record<string, string>; oauthToken: string | null }> {
  const safeAppId = typeof appId === "string" ? appId.trim() : "";
  if (!safeAppId) {
    throw new Error("Connector appId is required to load credentials");
  }

  const credentials = (await getCredentials(platform, safeAppId)) || {};
  const oauthToken = await getOAuthAccessToken(platform, safeAppId);

  return {
    credentials,
    oauthToken,
  };
}
