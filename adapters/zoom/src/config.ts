interface ConfigValidationError {
  field: string;
  message: string;
}

interface ConfigValidationResult {
  valid: boolean;
  errors: ConfigValidationError[];
}

export const CONFIG_DEFAULTS: Record<string, unknown> = {
  defaultUserType: "Licensed",
};

export function validateConfig(
  values: Record<string, unknown>,
): ConfigValidationResult {
  const errors: ConfigValidationError[] = [];

  if (
    values["accountId"] === undefined ||
    values["accountId"] === null ||
    values["accountId"] === ""
  ) {
    errors.push({
      field: "accountId",
      message: 'Required field "Zoom Account ID" is missing',
    });
  }

  if (
    values["accountId"] !== undefined &&
    values["accountId"] !== null &&
    typeof values["accountId"] !== "string"
  ) {
    errors.push({
      field: "accountId",
      message: 'Field "Zoom Account ID" must be a string',
    });
  }

  if (
    values["defaultUserType"] !== undefined &&
    values["defaultUserType"] !== null &&
    !["Basic", "Licensed", "On-Prem"].includes(
      String(values["defaultUserType"]),
    )
  ) {
    errors.push({
      field: "defaultUserType",
      message:
        'Field "Default User Type" must be one of: Basic, Licensed, On-Prem',
    });
  }

  return { valid: errors.length === 0, errors };
}

export function applyDefaults(
  values: Record<string, unknown>,
): Record<string, unknown> {
  return { ...CONFIG_DEFAULTS, ...values };
}
