interface ConfigValidationError {
  field: string;
  message: string;
}

interface ConfigValidationResult {
  valid: boolean;
  errors: ConfigValidationError[];
}

export const CONFIG_DEFAULTS: Record<string, unknown> = {
  defaultConnection: "Username-Password-Authentication",
};

export function validateConfig(
  values: Record<string, unknown>,
): ConfigValidationResult {
  const errors: ConfigValidationError[] = [];

  if (
    values["domain"] === undefined ||
    values["domain"] === null ||
    values["domain"] === ""
  ) {
    errors.push({
      field: "domain",
      message: 'Required field "Auth0 Domain" is missing',
    });
  }

  if (values["domain"] !== undefined && values["domain"] !== null) {
    try {
      new URL(String(values["domain"]));
    } catch {
      errors.push({
        field: "domain",
        message: 'Field "Auth0 Domain" must be a valid URL',
      });
    }
  }

  if (
    values["defaultConnection"] !== undefined &&
    values["defaultConnection"] !== null &&
    typeof values["defaultConnection"] !== "string"
  ) {
    errors.push({
      field: "defaultConnection",
      message: 'Field "Default Connection" must be a string',
    });
  }

  return { valid: errors.length === 0, errors };
}

export function applyDefaults(
  values: Record<string, unknown>,
): Record<string, unknown> {
  return { ...CONFIG_DEFAULTS, ...values };
}
