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
    values["orgId"] === undefined ||
    values["orgId"] === null ||
    values["orgId"] === ""
  ) {
    errors.push({
      field: "orgId",
      message: 'Required field "Figma Organization ID" is missing',
    });
  }

  if (
    values["orgId"] !== undefined &&
    values["orgId"] !== null &&
    typeof values["orgId"] !== "string"
  ) {
    errors.push({
      field: "orgId",
      message: 'Field "Figma Organization ID" must be a string',
    });
  }

  return { valid: errors.length === 0, errors };
}

export function applyDefaults(
  values: Record<string, unknown>,
): Record<string, unknown> {
  return { ...CONFIG_DEFAULTS, ...values };
}
