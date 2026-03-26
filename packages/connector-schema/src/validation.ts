import { z } from "zod";
import { ConnectorManifestSchema, type ConfigField } from "./manifest.js";

export interface ValidationResult {
  success: boolean;
  errors: Array<{ path: string; message: string }>;
}

export function validateManifest(data: unknown): ValidationResult {
  const result = ConnectorManifestSchema.safeParse(data);

  if (result.success) {
    return { success: true, errors: [] };
  }

  return {
    success: false,
    errors: result.error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    })),
  };
}

export function validateConfigValues(
  configFields: ConfigField[],
  values: Record<string, unknown>,
): ValidationResult {
  const errors: Array<{ path: string; message: string }> = [];

  for (const field of configFields) {
    const value = values[field.key];

    if (
      field.required &&
      (value === undefined || value === null || value === "")
    ) {
      errors.push({
        path: field.key,
        message: `Required field "${field.label}" is missing`,
      });
      continue;
    }

    if (value === undefined || value === null) {
      continue;
    }

    switch (field.type) {
      case "string":
      case "secret":
        if (typeof value !== "string") {
          errors.push({
            path: field.key,
            message: `Field "${field.label}" must be a string`,
          });
        }
        break;
      case "number":
        if (typeof value !== "number") {
          errors.push({
            path: field.key,
            message: `Field "${field.label}" must be a number`,
          });
        }
        break;
      case "boolean":
        if (typeof value !== "boolean") {
          errors.push({
            path: field.key,
            message: `Field "${field.label}" must be a boolean`,
          });
        }
        break;
      case "url":
        if (
          typeof value !== "string" ||
          !z.string().url().safeParse(value).success
        ) {
          errors.push({
            path: field.key,
            message: `Field "${field.label}" must be a valid URL`,
          });
        }
        break;
      case "select":
        if (field.options && !field.options.includes(String(value))) {
          errors.push({
            path: field.key,
            message: `Field "${field.label}" must be one of: ${field.options.join(", ")}`,
          });
        }
        break;
    }

    if (field.validation?.pattern && typeof value === "string") {
      const regex = new RegExp(field.validation.pattern);
      if (!regex.test(value)) {
        errors.push({
          path: field.key,
          message: `Field "${field.label}" does not match required pattern`,
        });
      }
    }

    if (field.validation?.min !== undefined && typeof value === "number") {
      if (value < field.validation.min) {
        errors.push({
          path: field.key,
          message: `Field "${field.label}" must be at least ${field.validation.min}`,
        });
      }
    }

    if (field.validation?.max !== undefined && typeof value === "number") {
      if (value > field.validation.max) {
        errors.push({
          path: field.key,
          message: `Field "${field.label}" must be at most ${field.validation.max}`,
        });
      }
    }
  }

  return {
    success: errors.length === 0,
    errors,
  };
}
