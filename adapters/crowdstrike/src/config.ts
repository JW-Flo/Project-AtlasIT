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
    values["clientId"] === undefined ||
    values["clientId"] === null ||
    values["clientId"] === ""
  ) {
    errors.push({
      field: "clientId",
      message: 'Required field "API Client ID" is missing',
    });
  }

  if (
    values["clientId"] !== undefined &&
    values["clientId"] !== null &&
    typeof values["clientId"] !== "string"
  ) {
    errors.push({
      field: "clientId",
      message: 'Field "API Client ID" must be a string',
    });
  }

  if (
    values["clientSecret"] === undefined ||
    values["clientSecret"] === null ||
    values["clientSecret"] === ""
  ) {
    errors.push({
      field: "clientSecret",
      message: 'Required field "API Client Secret" is missing',
    });
  }

  if (
    values["clientSecret"] !== undefined &&
    values["clientSecret"] !== null &&
    typeof values["clientSecret"] !== "string"
  ) {
    errors.push({
      field: "clientSecret",
      message: 'Field "API Client Secret" must be a string',
    });
  }

  if (
    values["baseUrl"] === undefined ||
    values["baseUrl"] === null ||
    values["baseUrl"] === ""
  ) {
    errors.push({
      field: "baseUrl",
      message: 'Required field "Cloud Region Base URL" is missing',
    });
  }

  if (values["baseUrl"] !== undefined && values["baseUrl"] !== null) {
    try {
      new URL(String(values["baseUrl"]));
    } catch {
      errors.push({
        field: "baseUrl",
        message: 'Field "Cloud Region Base URL" must be a valid URL',
      });
    }
  }

  return { valid: errors.length === 0, errors };
}

export function applyDefaults(
  values: Record<string, unknown>,
): Record<string, unknown> {
  return { ...CONFIG_DEFAULTS, ...values };
}
