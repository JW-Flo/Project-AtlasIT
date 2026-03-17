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
    values["orgName"] === undefined ||
    values["orgName"] === null ||
    values["orgName"] === ""
  ) {
    errors.push({
      field: "orgName",
      message: 'Required field "Organization Name" is missing',
    });
  }

  if (
    values["orgName"] !== undefined &&
    values["orgName"] !== null &&
    typeof values["orgName"] !== "string"
  ) {
    errors.push({
      field: "orgName",
      message: 'Field "Organization Name" must be a string',
    });
  }

  if (
    values["defaultTeamSlug"] !== undefined &&
    values["defaultTeamSlug"] !== null &&
    typeof values["defaultTeamSlug"] !== "string"
  ) {
    errors.push({
      field: "defaultTeamSlug",
      message: 'Field "Default Team" must be a string',
    });
  }

  return { valid: errors.length === 0, errors };
}

export function applyDefaults(
  values: Record<string, unknown>,
): Record<string, unknown> {
  return { ...CONFIG_DEFAULTS, ...values };
}
