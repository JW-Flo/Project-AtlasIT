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
    values["clientEmail"] === undefined ||
    values["clientEmail"] === null ||
    values["clientEmail"] === ""
  ) {
    errors.push({
      field: "clientEmail",
      message: 'Required field "Service Account Email" is missing',
    });
  }

  if (
    values["clientEmail"] !== undefined &&
    values["clientEmail"] !== null &&
    typeof values["clientEmail"] !== "string"
  ) {
    errors.push({
      field: "clientEmail",
      message: 'Field "Service Account Email" must be a string',
    });
  }

  if (
    values["privateKey"] === undefined ||
    values["privateKey"] === null ||
    values["privateKey"] === ""
  ) {
    errors.push({
      field: "privateKey",
      message: 'Required field "Service Account Key (JSON)" is missing',
    });
  }

  if (
    values["privateKey"] !== undefined &&
    values["privateKey"] !== null &&
    typeof values["privateKey"] !== "string"
  ) {
    errors.push({
      field: "privateKey",
      message: 'Field "Service Account Key (JSON)" must be a string',
    });
  }

  if (
    values["customerId"] === undefined ||
    values["customerId"] === null ||
    values["customerId"] === ""
  ) {
    errors.push({
      field: "customerId",
      message: 'Required field "Workspace Customer ID" is missing',
    });
  }

  if (
    values["customerId"] !== undefined &&
    values["customerId"] !== null &&
    typeof values["customerId"] !== "string"
  ) {
    errors.push({
      field: "customerId",
      message: 'Field "Workspace Customer ID" must be a string',
    });
  }

  if (
    values["adminEmail"] === undefined ||
    values["adminEmail"] === null ||
    values["adminEmail"] === ""
  ) {
    errors.push({
      field: "adminEmail",
      message: 'Required field "Admin Email" is missing',
    });
  }

  if (
    values["adminEmail"] !== undefined &&
    values["adminEmail"] !== null &&
    typeof values["adminEmail"] !== "string"
  ) {
    errors.push({
      field: "adminEmail",
      message: 'Field "Admin Email" must be a string',
    });
  }

  return { valid: errors.length === 0, errors };
}

export function applyDefaults(
  values: Record<string, unknown>,
): Record<string, unknown> {
  return { ...CONFIG_DEFAULTS, ...values };
}
