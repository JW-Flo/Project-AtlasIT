export function researchSchemaToOpenApi(schema: unknown): Record<string, unknown> {
  if (!schema || typeof schema !== "object") {
    throw new Error("Invalid research schema payload");
  }

  const record = schema as Record<string, unknown>;
  if (record.openapi && typeof record.openapi === "object") {
    return record.openapi as Record<string, unknown>;
  }

  throw new Error("Research schema missing openapi property");
}

export function isResearchSchema(value: unknown): boolean {
  return Boolean(
    value &&
      typeof value === "object" &&
      (value as Record<string, unknown>).kind === "atlasit.research-schema",
  );
}
