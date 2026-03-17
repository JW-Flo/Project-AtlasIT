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

  if (values["connectHost"] !== undefined && values["connectHost"] !== null) {
    try {
      new URL(String(values["connectHost"]));
    } catch {
      errors.push({
        field: "connectHost",
        message: 'Field "Connect Server URL" must be a valid URL',
      });
    }
  }

  if (
    values["scimBridgeUrl"] !== undefined &&
    values["scimBridgeUrl"] !== null
  ) {
    try {
      new URL(String(values["scimBridgeUrl"]));
    } catch {
      errors.push({
        field: "scimBridgeUrl",
        message: 'Field "SCIM Bridge URL" must be a valid URL',
      });
    }
  }

  return { valid: errors.length === 0, errors };
}

export function applyDefaults(
  values: Record<string, unknown>,
): Record<string, unknown> {
  return { ...CONFIG_DEFAULTS, ...values };
}
