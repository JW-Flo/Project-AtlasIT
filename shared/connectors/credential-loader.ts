/**
 * Credential loader for connectors.
 *
 * This module does NOT import from console-app. Instead, the caller provides
 * the credential-fetching functions (dependency injection), which come from
 * the D1 storage layer at the call site.
 */

export interface CredentialFetcher {
  getCredentials(appId: string): Promise<Record<string, string> | null>;
  getOAuthAccessToken(appId: string): Promise<string | null>;
}

export async function loadConnectorCredentials(
  fetcher: CredentialFetcher,
  appId: string,
): Promise<{ credentials: Record<string, string>; oauthToken: string | null }> {
  const safeAppId = typeof appId === "string" ? appId.trim() : "";
  if (!safeAppId) {
    throw new Error("Connector appId is required to load credentials");
  }

  const credentials = (await fetcher.getCredentials(safeAppId)) || {};
  const oauthToken = await fetcher.getOAuthAccessToken(safeAppId);

  return { credentials, oauthToken };
}
