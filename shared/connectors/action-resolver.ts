import type { Connector } from "./types";
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
  delete_user: "deleteUser",
  add_to_group: "addToGroup",
  remove_from_group: "removeFromGroup",
  revoke_access: "removeFromGroup",
};

const ACTION_REF_REGEX = /^atlas\.connectors\.([a-z0-9_]+)\.([a-z0-9_]+)$/;

export async function resolveConnectorAction(
  platform: unknown,
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

  const { credentials, oauthToken } = await loadConnectorCredentials(platform, appId);
  const connector = createConnector(appId, credentials, oauthToken);

  return (connector[methodName] as Connector[ConnectorMethod]).call(
    connector,
    stepInputs as never,
  );
}
