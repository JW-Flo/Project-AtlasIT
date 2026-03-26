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
    values["realmId"] === undefined ||
    values["realmId"] === null ||
    values["realmId"] === ""
  ) {
    errors.push({
      field: "realmId",
      message: 'Required field "Company ID (Realm ID)" is missing',
    });
  }

  if (
    values["realmId"] !== undefined &&
    values["realmId"] !== null &&
    typeof values["realmId"] !== "string"
  ) {
    errors.push({
      field: "realmId",
      message: 'Field "Company ID (Realm ID)" must be a string',
    });
  }

  return { valid: errors.length === 0, errors };
}

export function applyDefaults(
  values: Record<string, unknown>,
): Record<string, unknown> {
  return { ...CONFIG_DEFAULTS, ...values };
}
