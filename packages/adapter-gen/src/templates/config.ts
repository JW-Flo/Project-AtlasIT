import type {
  ConnectorManifest,
  ConfigField,
} from "../../../connector-schema/src/manifest.js";

function generateFieldValidation(field: ConfigField): string {
  const checks: string[] = [];
  const valueAccess = `values["${field.key}"]`;

  if (field.required) {
    checks.push(`  if (${valueAccess} === undefined || ${valueAccess} === null || ${valueAccess} === "") {
    errors.push({ field: "${field.key}", message: "Required field \\"${field.label}\\" is missing" });
  }`);
  }

  switch (field.type) {
    case "string":
    case "secret":
      checks.push(`  if (${valueAccess} !== undefined && ${valueAccess} !== null && typeof ${valueAccess} !== "string") {
    errors.push({ field: "${field.key}", message: "Field \\"${field.label}\\" must be a string" });
  }`);
      break;
    case "number":
      checks.push(`  if (${valueAccess} !== undefined && ${valueAccess} !== null && typeof ${valueAccess} !== "number") {
    errors.push({ field: "${field.key}", message: "Field \\"${field.label}\\" must be a number" });
  }`);
      break;
    case "boolean":
      checks.push(`  if (${valueAccess} !== undefined && ${valueAccess} !== null && typeof ${valueAccess} !== "boolean") {
    errors.push({ field: "${field.key}", message: "Field \\"${field.label}\\" must be a boolean" });
  }`);
      break;
    case "url":
      checks.push(`  if (${valueAccess} !== undefined && ${valueAccess} !== null) {
    try {
      new URL(String(${valueAccess}));
    } catch {
      errors.push({ field: "${field.key}", message: "Field \\"${field.label}\\" must be a valid URL" });
    }
  }`);
      break;
    case "select":
      if (field.options) {
        checks.push(`  if (${valueAccess} !== undefined && ${valueAccess} !== null && !${JSON.stringify(field.options)}.includes(String(${valueAccess}))) {
    errors.push({ field: "${field.key}", message: "Field \\"${field.label}\\" must be one of: ${field.options.join(", ")}" });
  }`);
      }
      break;
  }

  if (field.validation?.pattern) {
    checks.push(`  if (typeof ${valueAccess} === "string" && !/${field.validation.pattern}/.test(${valueAccess})) {
    errors.push({ field: "${field.key}", message: "Field \\"${field.label}\\" does not match required pattern" });
  }`);
  }

  if (field.validation?.min !== undefined) {
    checks.push(`  if (typeof ${valueAccess} === "number" && ${valueAccess} < ${field.validation.min}) {
    errors.push({ field: "${field.key}", message: "Field \\"${field.label}\\" must be at least ${field.validation.min}" });
  }`);
  }

  if (field.validation?.max !== undefined) {
    checks.push(`  if (typeof ${valueAccess} === "number" && ${valueAccess} > ${field.validation.max}) {
    errors.push({ field: "${field.key}", message: "Field \\"${field.label}\\" must be at most ${field.validation.max}" });
  }`);
  }

  return checks.join("\n\n");
}

function generateDefaults(fields: ConfigField[]): string {
  const defaults: string[] = [];
  for (const field of fields) {
    if (field.default !== undefined) {
      const value =
        typeof field.default === "string"
          ? `"${field.default}"`
          : String(field.default);
      defaults.push(`  "${field.key}": ${value},`);
    }
  }

  if (defaults.length === 0) return "{}";
  return `{\n${defaults.join("\n")}\n}`;
}

export function generateConfigTemplate(manifest: ConnectorManifest): string {
  const fieldValidations = manifest.configFields
    .map(generateFieldValidation)
    .join("\n\n");

  const defaults = generateDefaults(manifest.configFields);

  return `interface ConfigValidationError {
  field: string;
  message: string;
}

interface ConfigValidationResult {
  valid: boolean;
  errors: ConfigValidationError[];
}

export const CONFIG_DEFAULTS: Record<string, unknown> = ${defaults};

export function validateConfig(values: Record<string, unknown>): ConfigValidationResult {
  const errors: ConfigValidationError[] = [];

${fieldValidations}

  return { valid: errors.length === 0, errors };
}

export function applyDefaults(values: Record<string, unknown>): Record<string, unknown> {
  return { ...CONFIG_DEFAULTS, ...values };
}
`;
}
