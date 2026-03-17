interface ConfigValidationError {
  field: string;
  message: string;
}

interface ConfigValidationResult {
  valid: boolean;
  errors: ConfigValidationError[];
}

export const CONFIG_DEFAULTS: Record<string, unknown> = {
  defaultRole: "limited_user",
};

export function validateConfig(
  values: Record<string, unknown>,
): ConfigValidationResult {
  const errors: ConfigValidationError[] = [];

  if (
    values["defaultRole"] !== undefined &&
    values["defaultRole"] !== null &&
    ![
      "admin",
      "limited_user",
      "observer",
      "owner",
      "read_only_limited_user",
      "read_only_user",
      "restricted_access",
      "user",
    ].includes(String(values["defaultRole"]))
  ) {
    errors.push({
      field: "defaultRole",
      message:
        'Field "Default User Role" must be one of: admin, limited_user, observer, owner, read_only_limited_user, read_only_user, restricted_access, user',
    });
  }

  return { valid: errors.length === 0, errors };
}

export function applyDefaults(
  values: Record<string, unknown>,
): Record<string, unknown> {
  return { ...CONFIG_DEFAULTS, ...values };
}
