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
    values["portalId"] === undefined ||
    values["portalId"] === null ||
    values["portalId"] === ""
  ) {
    errors.push({
      field: "portalId",
      message: 'Required field "HubSpot Portal ID" is missing',
    });
  }

  if (
    values["portalId"] !== undefined &&
    values["portalId"] !== null &&
    typeof values["portalId"] !== "string"
  ) {
    errors.push({
      field: "portalId",
      message: 'Field "HubSpot Portal ID" must be a string',
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
