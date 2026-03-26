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
    values["appKey"] === undefined ||
    values["appKey"] === null ||
    values["appKey"] === ""
  ) {
    errors.push({
      field: "appKey",
      message: 'Required field "Application Key" is missing',
    });
  }

  if (
    values["appKey"] !== undefined &&
    values["appKey"] !== null &&
    typeof values["appKey"] !== "string"
  ) {
    errors.push({
      field: "appKey",
      message: 'Field "Application Key" must be a string',
    });
  }

  if (
    values["site"] === undefined ||
    values["site"] === null ||
    values["site"] === ""
  ) {
    errors.push({
      field: "site",
      message: 'Required field "Datadog Site" is missing',
    });
  }

  if (
    values["site"] !== undefined &&
    values["site"] !== null &&
    typeof values["site"] !== "string"
  ) {
    errors.push({
      field: "site",
      message: 'Field "Datadog Site" must be a string',
    });
  }

  return { valid: errors.length === 0, errors };
}

export function applyDefaults(
  values: Record<string, unknown>,
): Record<string, unknown> {
  return { ...CONFIG_DEFAULTS, ...values };
}
