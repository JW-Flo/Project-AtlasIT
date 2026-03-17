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

  // subdomain is required
  if (
    values["subdomain"] === undefined ||
    values["subdomain"] === null ||
    values["subdomain"] === ""
  ) {
    errors.push({
      field: "subdomain",
      message: 'Required field "BambooHR Subdomain" is missing',
    });
  }

  if (
    values["subdomain"] !== undefined &&
    values["subdomain"] !== null &&
    typeof values["subdomain"] !== "string"
  ) {
    errors.push({
      field: "subdomain",
      message: 'Field "BambooHR Subdomain" must be a string',
    });
  }

  return { valid: errors.length === 0, errors };
}

export function applyDefaults(
  values: Record<string, unknown>,
): Record<string, unknown> {
  return { ...CONFIG_DEFAULTS, ...values };
}
