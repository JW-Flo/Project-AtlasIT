interface ConfigValidationError {
  field: string;
  message: string;
}

interface ConfigValidationResult {
  valid: boolean;
  errors: ConfigValidationError[];
}

export const CONFIG_DEFAULTS: Record<string, unknown> = {
  region: "us-east-1",
};

export function validateConfig(
  values: Record<string, unknown>,
): ConfigValidationResult {
  const errors: ConfigValidationError[] = [];

  if (
    values["accessKeyId"] === undefined ||
    values["accessKeyId"] === null ||
    values["accessKeyId"] === ""
  ) {
    errors.push({
      field: "accessKeyId",
      message: 'Required field "Access Key ID" is missing',
    });
  }

  if (
    values["accessKeyId"] !== undefined &&
    values["accessKeyId"] !== null &&
    typeof values["accessKeyId"] !== "string"
  ) {
    errors.push({
      field: "accessKeyId",
      message: 'Field "Access Key ID" must be a string',
    });
  }

  if (
    values["secretAccessKey"] === undefined ||
    values["secretAccessKey"] === null ||
    values["secretAccessKey"] === ""
  ) {
    errors.push({
      field: "secretAccessKey",
      message: 'Required field "Secret Access Key" is missing',
    });
  }

  if (
    values["secretAccessKey"] !== undefined &&
    values["secretAccessKey"] !== null &&
    typeof values["secretAccessKey"] !== "string"
  ) {
    errors.push({
      field: "secretAccessKey",
      message: 'Field "Secret Access Key" must be a string',
    });
  }

  if (
    values["region"] !== undefined &&
    values["region"] !== null &&
    typeof values["region"] !== "string"
  ) {
    errors.push({
      field: "region",
      message: 'Field "Region" must be a string',
    });
  }

  if (
    values["roleArn"] !== undefined &&
    values["roleArn"] !== null &&
    typeof values["roleArn"] !== "string"
  ) {
    errors.push({
      field: "roleArn",
      message: 'Field "Role ARN (optional)" must be a string',
    });
  }

  return { valid: errors.length === 0, errors };
}

export function applyDefaults(
  values: Record<string, unknown>,
): Record<string, unknown> {
  return { ...CONFIG_DEFAULTS, ...values };
}
