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
    values["companyDomain"] === undefined ||
    values["companyDomain"] === null ||
    values["companyDomain"] === ""
  ) {
    errors.push({
      field: "companyDomain",
      message: 'Required field "Company Subdomain" is missing',
    });
  }

  if (
    values["companyDomain"] !== undefined &&
    values["companyDomain"] !== null &&
    typeof values["companyDomain"] !== "string"
  ) {
    errors.push({
      field: "companyDomain",
      message: 'Field "Company Subdomain" must be a string',
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
    values["syncInterval"] < 15
  ) {
    errors.push({
      field: "syncInterval",
      message: 'Field "Sync Interval (minutes)" must be at least 15',
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
