interface ConfigValidationError {
  field: string;
  message: string;
}

interface ConfigValidationResult {
  valid: boolean;
  errors: ConfigValidationError[];
}

export const CONFIG_DEFAULTS: Record<string, unknown> = {};

export function validateConfig(
  values: Record<string, unknown>,
): ConfigValidationResult {
  const errors: ConfigValidationError[] = [];

  if (
    values["workspaceGid"] === undefined ||
    values["workspaceGid"] === null ||
    values["workspaceGid"] === ""
  ) {
    errors.push({
      field: "workspaceGid",
      message: 'Required field "Workspace GID" is missing',
    });
  }

  if (
    values["workspaceGid"] !== undefined &&
    values["workspaceGid"] !== null &&
    typeof values["workspaceGid"] !== "string"
  ) {
    errors.push({
      field: "workspaceGid",
      message: 'Field "Workspace GID" must be a string',
    });
  }

  return { valid: errors.length === 0, errors };
}

export function applyDefaults(
  values: Record<string, unknown>,
): Record<string, unknown> {
  return { ...CONFIG_DEFAULTS, ...values };
}
