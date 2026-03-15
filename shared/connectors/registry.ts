import { BambooHrConnector } from "./bamboohr";
import { GitHubConnector } from "./github";
import { GoogleWorkspaceConnector } from "./google_workspace";
import { Microsoft365Connector } from "./microsoft_365";
import { OktaConnector } from "./okta";
import { SlackConnector } from "./slack";
import type { Connector } from "./types";

export function createConnector(
  appId: string,
  credentials: Record<string, string>,
  oauthToken?: string | null,
): Connector {
  switch (appId) {
    case "okta":
      return new OktaConnector(credentials, oauthToken);
    case "slack":
      return new SlackConnector(credentials, oauthToken);
    case "google_workspace":
      return new GoogleWorkspaceConnector(credentials, oauthToken);
    case "microsoft_365":
      return new Microsoft365Connector(credentials, oauthToken);
    case "github":
      return new GitHubConnector(credentials, oauthToken);
    case "bamboohr":
      return new BambooHrConnector(credentials);
    default:
      throw new Error(`Unsupported connector appId: ${appId}`);
  }
}
