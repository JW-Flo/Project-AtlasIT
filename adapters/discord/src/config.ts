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
    values["guildId"] === undefined ||
    values["guildId"] === null ||
    values["guildId"] === ""
  ) {
    errors.push({
      field: "guildId",
      message: 'Required field "Guild ID" is missing',
    });
  }

  if (
    values["guildId"] !== undefined &&
    values["guildId"] !== null &&
    typeof values["guildId"] !== "string"
  ) {
    errors.push({
      field: "guildId",
      message: 'Field "Guild ID" must be a string',
    });
  }

  return { valid: errors.length === 0, errors };
}

export function applyDefaults(
  values: Record<string, unknown>,
): Record<string, unknown> {
  return { ...CONFIG_DEFAULTS, ...values };
}
