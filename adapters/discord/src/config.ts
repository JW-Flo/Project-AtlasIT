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
      message: 'Required field "Server (Guild) ID" is missing',
    });
  }

  if (
    values["guildId"] !== undefined &&
    values["guildId"] !== null &&
    typeof values["guildId"] !== "string"
  ) {
    errors.push({
      field: "guildId",
      message: 'Field "Server (Guild) ID" must be a string',
    });
  }

  if (
    values["botToken"] === undefined ||
    values["botToken"] === null ||
    values["botToken"] === ""
  ) {
    errors.push({
      field: "botToken",
      message: 'Required field "Bot Token" is missing',
    });
  }

  if (
    values["botToken"] !== undefined &&
    values["botToken"] !== null &&
    typeof values["botToken"] !== "string"
  ) {
    errors.push({
      field: "botToken",
      message: 'Field "Bot Token" must be a string',
    });
  }

  return { valid: errors.length === 0, errors };
}

export function applyDefaults(
  values: Record<string, unknown>,
): Record<string, unknown> {
  return { ...CONFIG_DEFAULTS, ...values };
}
