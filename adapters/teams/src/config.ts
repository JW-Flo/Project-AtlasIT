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
    values["tenantId"] === undefined ||
    values["tenantId"] === null ||
    values["tenantId"] === ""
  ) {
    errors.push({
      field: "tenantId",
      message: 'Required field "Azure AD Tenant ID" is missing',
    });
  }

  if (
    values["tenantId"] !== undefined &&
    values["tenantId"] !== null &&
    typeof values["tenantId"] !== "string"
  ) {
    errors.push({
      field: "tenantId",
      message: 'Field "Azure AD Tenant ID" must be a string',
    });
  }

  return { valid: errors.length === 0, errors };
}

export function applyDefaults(
  values: Record<string, unknown>,
): Record<string, unknown> {
  return { ...CONFIG_DEFAULTS, ...values };
}
