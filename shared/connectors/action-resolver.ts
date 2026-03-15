import type { Connector } from "./types";
import type { CredentialFetcher } from "./credential-loader";
import { loadConnectorCredentials } from "./credential-loader";
import { createConnector } from "./registry";

type ConnectorMethod =
  | "createUser"
  | "updateUser"
  | "suspendUser"
  | "deleteUser"
  | "addToGroup"
  | "removeFromGroup";

const ACTION_MAP: Record<string, ConnectorMethod> = {
  provision_user: "createUser",
  create_user: "createUser",
  update_user: "updateUser",
  suspend_user: "suspendUser",
  disable_user: "suspendUser",
  delete_user: "deleteUser",
  add_to_group: "addToGroup",
  remove_from_group: "removeFromGroup",
  revoke_access: "removeFromGroup",
};

const ACTION_REF_REGEX = /^atlas\.connectors\.([a-z0-9_]+)\.([a-z0-9_]+)$/;

/**
 * Resolve a workflow action_ref to a connector method call.
 *
 * @param fetcher - Credential fetcher (injected, not imported from console-app)
 * @param actionRef - e.g. "atlas.connectors.slack.provision_user"
 * @param stepInputs - Workflow step inputs to pass to the connector method
 */
export async function resolveConnectorAction(
  fetcher: CredentialFetcher,
  actionRef: string,
  stepInputs: Record<string, unknown>,
) {
  const match = ACTION_REF_REGEX.exec(actionRef || "");
  if (!match) {
    throw new Error(`Unsupported action_ref format: ${actionRef}`);
  }

  const [, appId, actionName] = match;
  const methodName = ACTION_MAP[actionName];
  if (!methodName) {
    throw new Error(`Unsupported connector action: ${actionName}`);
  }

  const { credentials, oauthToken } = await loadConnectorCredentials(
    fetcher,
    appId,
  );
  const connector = createConnector(appId, credentials, oauthToken);

  return (connector[methodName] as Connector[ConnectorMethod]).call(
    connector,
    stepInputs as never,
  );
}
