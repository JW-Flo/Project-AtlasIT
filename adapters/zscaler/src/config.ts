interface ConfigValidationError {
  field: string;
  message: string;
}

interface ConfigValidationResult {
  valid: boolean;
  errors: ConfigValidationError[];
}

export const CONFIG_DEFAULTS: Record<string, unknown> = {
  cloud: "zscaler",
};

const REQUIRED_STRING_FIELDS: Array<{ key: string; label: string }> = [
  { key: "clientId", label: "Client ID" },
  { key: "clientSecret", label: "Client Secret" },
  { key: "vanityDomain", label: "Vanity Domain" },
  { key: "cloud", label: "Cloud" },
  { key: "customerId", label: "Customer ID" },
];

export function validateConfig(
  values: Record<string, unknown>,
): ConfigValidationResult {
  const errors: ConfigValidationError[] = [];

  for (const { key, label } of REQUIRED_STRING_FIELDS) {
    if (values[key] === undefined || values[key] === null || values[key] === "") {
      errors.push({ field: key, message: `Required field "${label}" is missing` });
    } else if (typeof values[key] !== "string") {
      errors.push({ field: key, message: `Field "${label}" must be a string` });
    }
  }

  return { valid: errors.length === 0, errors };
}

export function applyDefaults(
  values: Record<string, unknown>,
): Record<string, unknown> {
  return { ...CONFIG_DEFAULTS, ...values };
}
