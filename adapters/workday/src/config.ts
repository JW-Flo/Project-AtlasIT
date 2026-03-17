interface ConfigValidationError {
  field: string;
  message: string;
}

interface ConfigValidationResult {
  valid: boolean;
  errors: ConfigValidationError[];
}

export const CONFIG_DEFAULTS: Record<string, unknown> = {
  syncInterval: 60,
};

export function validateConfig(
  values: Record<string, unknown>,
): ConfigValidationResult {
  const errors: ConfigValidationError[] = [];

  if (
    values["tenantUrl"] === undefined ||
    values["tenantUrl"] === null ||
    values["tenantUrl"] === ""
  ) {
    errors.push({
      field: "tenantUrl",
      message: 'Required field "Tenant URL" is missing',
    });
  }

  if (values["tenantUrl"] !== undefined && values["tenantUrl"] !== null) {
    try {
      new URL(String(values["tenantUrl"]));
    } catch {
      errors.push({
        field: "tenantUrl",
        message: 'Field "Tenant URL" must be a valid URL',
      });
    }
  }

  if (
    values["tenantName"] === undefined ||
    values["tenantName"] === null ||
    values["tenantName"] === ""
  ) {
    errors.push({
      field: "tenantName",
      message: 'Required field "Tenant Name" is missing',
    });
  }

  if (
    values["tenantName"] !== undefined &&
    values["tenantName"] !== null &&
    typeof values["tenantName"] !== "string"
  ) {
    errors.push({
      field: "tenantName",
      message: 'Field "Tenant Name" must be a string',
    });
  }

  if (
    values["syncInterval"] !== undefined &&
    values["syncInterval"] !== null &&
    typeof values["syncInterval"] !== "number"
  ) {
    errors.push({
      field: "syncInterval",
      message: 'Field "Sync Interval (minutes)" must be a number',
    });
  }

  if (
    typeof values["syncInterval"] === "number" &&
    values["syncInterval"] < 30
  ) {
    errors.push({
      field: "syncInterval",
      message: 'Field "Sync Interval (minutes)" must be at least 30',
    });
  }

  if (
    typeof values["syncInterval"] === "number" &&
    values["syncInterval"] > 1440
  ) {
    errors.push({
      field: "syncInterval",
      message: 'Field "Sync Interval (minutes)" must be at most 1440',
    });
  }

  return { valid: errors.length === 0, errors };
}

export function applyDefaults(
  values: Record<string, unknown>,
): Record<string, unknown> {
  return { ...CONFIG_DEFAULTS, ...values };
}
