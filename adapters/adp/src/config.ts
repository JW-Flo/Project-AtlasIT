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
    values["sslCert"] === undefined ||
    values["sslCert"] === null ||
    values["sslCert"] === ""
  ) {
    errors.push({
      field: "sslCert",
      message: 'Required field "SSL Certificate (PEM)" is missing',
    });
  }

  if (
    values["sslCert"] !== undefined &&
    values["sslCert"] !== null &&
    typeof values["sslCert"] !== "string"
  ) {
    errors.push({
      field: "sslCert",
      message: 'Field "SSL Certificate (PEM)" must be a string',
    });
  }

  if (
    values["sslKey"] === undefined ||
    values["sslKey"] === null ||
    values["sslKey"] === ""
  ) {
    errors.push({
      field: "sslKey",
      message: 'Required field "SSL Private Key (PEM)" is missing',
    });
  }

  if (
    values["sslKey"] !== undefined &&
    values["sslKey"] !== null &&
    typeof values["sslKey"] !== "string"
  ) {
    errors.push({
      field: "sslKey",
      message: 'Field "SSL Private Key (PEM)" must be a string',
    });
  }

  return { valid: errors.length === 0, errors };
}

export function applyDefaults(
  values: Record<string, unknown>,
): Record<string, unknown> {
  return { ...CONFIG_DEFAULTS, ...values };
}
