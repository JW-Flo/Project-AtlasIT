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

  // teamId is required
  if (
    values["teamId"] === undefined ||
    values["teamId"] === null ||
    values["teamId"] === ""
  ) {
    errors.push({
      field: "teamId",
      message: 'Required field "Team ID" is missing',
    });
  }

  if (
    values["teamId"] !== undefined &&
    values["teamId"] !== null &&
    typeof values["teamId"] !== "string"
  ) {
    errors.push({
      field: "teamId",
      message: 'Field "Team ID" must be a string',
    });
  }

  return { valid: errors.length === 0, errors };
}

export function applyDefaults(
  values: Record<string, unknown>,
): Record<string, unknown> {
  return { ...CONFIG_DEFAULTS, ...values };
}
