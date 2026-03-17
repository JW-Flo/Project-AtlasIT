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
    values["cloudId"] === undefined ||
    values["cloudId"] === null ||
    values["cloudId"] === ""
  ) {
    errors.push({
      field: "cloudId",
      message: 'Required field "Atlassian Cloud ID" is missing',
    });
  }

  if (
    values["cloudId"] !== undefined &&
    values["cloudId"] !== null &&
    typeof values["cloudId"] !== "string"
  ) {
    errors.push({
      field: "cloudId",
      message: 'Field "Atlassian Cloud ID" must be a string',
    });
  }

  if (
    values["directoryId"] !== undefined &&
    values["directoryId"] !== null &&
    typeof values["directoryId"] !== "string"
  ) {
    errors.push({
      field: "directoryId",
      message: 'Field "SCIM Directory ID" must be a string',
    });
  }

  return { valid: errors.length === 0, errors };
}

export function applyDefaults(
  values: Record<string, unknown>,
): Record<string, unknown> {
  return { ...CONFIG_DEFAULTS, ...values };
}
