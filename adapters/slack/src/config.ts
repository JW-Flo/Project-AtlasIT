interface ConfigValidationError {
  field: string;
  message: string;
}

interface ConfigValidationResult {
  valid: boolean;
  errors: ConfigValidationError[];
}

export const CONFIG_DEFAULTS: Record<string, unknown> = {
  notifyOnIncident: true,
};

export function validateConfig(
  values: Record<string, unknown>,
): ConfigValidationResult {
  const errors: ConfigValidationError[] = [];

  if (
    values["defaultChannel"] !== undefined &&
    values["defaultChannel"] !== null &&
    typeof values["defaultChannel"] !== "string"
  ) {
    errors.push({
      field: "defaultChannel",
      message: 'Field "Default Channel" must be a string',
    });
  }

  if (
    values["notifyOnIncident"] !== undefined &&
    values["notifyOnIncident"] !== null &&
    typeof values["notifyOnIncident"] !== "boolean"
  ) {
    errors.push({
      field: "notifyOnIncident",
      message: 'Field "Notify on Incident" must be a boolean',
    });
  }

  return { valid: errors.length === 0, errors };
}

export function applyDefaults(
  values: Record<string, unknown>,
): Record<string, unknown> {
  return { ...CONFIG_DEFAULTS, ...values };
}
