import { slugify } from "./utils.js";

export interface NormalizeOptions {
  content: string;
  sourcePath: string;
  serviceName: string;
  serviceSlug?: string;
  summaryOverride?: string;
  capturedAt?: string;
}

export interface ResearchField {
  name: string;
  type: string;
  required: boolean;
  description?: string;
  source?: {
    line: number;
    text: string;
  };
}

export interface ResearchEntity {
  name: string;
  description?: string;
  fields: ResearchField[];
}

export interface ResearchOperation {
  name: string;
  method: string;
  path: string;
  summary?: string;
  returns?: string;
  description?: string;
}

export interface ResearchSchema {
  kind: "atlasit.research-schema";
  version: string;
  service: {
    name: string;
    slug: string;
    summary: string;
  };
  sources: Array<{
    type: "markdown";
    path: string;
  }>;
  entities: ResearchEntity[];
  operations: ResearchOperation[];
  openapi: Record<string, unknown>;
}

interface ParsedState {
  title?: string;
  summaryLines: string[];
  entities: ResearchEntity[];
  operations: ResearchOperation[];
  currentSection?: "summary" | "entities" | "operations";
  currentEntity?: ResearchEntity;
  currentOperation?: ResearchOperation;
}

const simpleTypeMap: Record<string, string> = {
  string: "string",
  number: "number",
  float: "number",
  double: "number",
  integer: "integer",
  int: "integer",
  boolean: "boolean",
  bool: "boolean",
  date: "string",
  datetime: "string",
};

export function normalizeDocs(options: NormalizeOptions): ResearchSchema {
  const capturedAt = options.capturedAt ?? new Date().toISOString();
  const serviceSlug = options.serviceSlug ?? slugify(options.serviceName);
  const lines = options.content.split(/\r?\n/);

  const state: ParsedState = {
    summaryLines: [],
    entities: [],
    operations: [],
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (trimmed.startsWith("# ")) {
      state.title = trimmed.slice(2).trim();
      return;
    }

    if (trimmed.startsWith("## ")) {
      const heading = trimmed.slice(3).trim().toLowerCase();
      if (heading.startsWith("summary")) {
        state.currentSection = "summary";
        return;
      }
      if (heading.startsWith("entities")) {
        state.currentSection = "entities";
        state.currentEntity = undefined;
        return;
      }
      if (heading.startsWith("operations")) {
        state.currentSection = "operations";
        state.currentOperation = undefined;
        return;
      }
    }

    if (trimmed.startsWith("### ")) {
      const heading = trimmed.slice(4).trim();
      if (state.currentSection === "entities") {
        const entity: ResearchEntity = {
          name: heading,
          fields: [],
        };
        state.entities.push(entity);
        state.currentEntity = entity;
        return;
      }
      if (state.currentSection === "operations") {
        const parts = heading.split(/\s+/);
        const method = parts[0]?.toUpperCase() ?? "GET";
        const path = parts[1] ?? "/";
        const op: ResearchOperation = {
          name: heading,
          method,
          path,
        };
        state.operations.push(op);
        state.currentOperation = op;
        return;
      }
    }

    if (!trimmed) {
      return;
    }

    if (state.currentSection === "summary") {
      state.summaryLines.push(trimmed);
      return;
    }

    if (state.currentSection === "entities" && state.currentEntity && trimmed.startsWith("- ")) {
      const field = parseField(trimmed, index + 1);
      state.currentEntity.fields.push(field);
      return;
    }

    if (state.currentSection === "operations" && state.currentOperation && trimmed.startsWith("- ")) {
      parseOperationDetail(trimmed, state.currentOperation);
      return;
    }

    if (state.currentSection === "entities" && state.currentEntity && !trimmed.startsWith("- ")) {
      state.currentEntity.description = state.currentEntity.description
        ? `${state.currentEntity.description} ${trimmed}`
        : trimmed;
    }

    if (state.currentSection === "operations" && state.currentOperation && !trimmed.startsWith("- ")) {
      state.currentOperation.description = state.currentOperation.description
        ? `${state.currentOperation.description} ${trimmed}`
        : trimmed;
    }
  });

  const summary = options.summaryOverride ?? state.summaryLines.join(" ").trim();

  const openapi = buildOpenApiDocument({
    name: options.serviceName,
    slug: serviceSlug,
    summary,
    capturedAt,
    entities: state.entities,
    operations: state.operations,
  });

  return {
    kind: "atlasit.research-schema",
    version: capturedAt,
    service: {
      name: options.serviceName,
      slug: serviceSlug,
      summary,
    },
    sources: [
      {
        type: "markdown",
        path: options.sourcePath,
      },
    ],
    entities: state.entities,
    operations: state.operations,
    openapi,
  };
}

function parseField(line: string, lineNumber: number): ResearchField {
  // Pattern: - name: type (required) - description
  const bullet = line.replace(/^\-\s*/, "");
  const [left, descriptionPart] = bullet.split(/\s+-\s+/, 2);
  const [namePart, typePartRaw] = left.split(/:\s*/, 2);
  const typePart = typePartRaw ?? "string";
  const required = /\b(required|primary key)\b/i.test(typePart);
  const cleanedType = typePart.replace(/\b(optional|required|primary key)\b/gi, "").trim();

  return {
    name: (namePart ?? "field").trim(),
    type: cleanedType || "string",
    required,
    description: descriptionPart?.trim(),
    source: {
      line: lineNumber,
      text: line.trim(),
    },
  };
}

function parseOperationDetail(line: string, op: ResearchOperation) {
  const bullet = line.replace(/^\-\s*/, "");
  const [key, valueRaw] = bullet.split(/:\s*/, 2);
  if (!key || !valueRaw) return;
  const keyLower = key.toLowerCase();
  const value = valueRaw.trim();

  if (keyLower === "summary" || keyLower === "description") {
    op.summary = value;
  }
  if (keyLower === "returns" || keyLower === "response") {
    op.returns = value;
  }
}

interface OpenApiContext {
  name: string;
  slug: string;
  summary: string;
  capturedAt: string;
  entities: ResearchEntity[];
  operations: ResearchOperation[];
}

function buildOpenApiDocument(ctx: OpenApiContext): Record<string, unknown> {
  const components = { schemas: {} as Record<string, unknown> };
  const entityNames = new Set(ctx.entities.map((entity) => entity.name));

  ctx.entities.forEach((entity) => {
    (components.schemas as Record<string, unknown>)[entity.name] = {
      type: "object",
      description: entity.description,
      properties: buildProperties(entity.fields, entityNames),
      required: entity.fields.filter((field) => field.required).map((field) => field.name),
    };
  });

  const paths: Record<string, unknown> = {};
  ctx.operations.forEach((operation) => {
    const method = operation.method.toLowerCase();
    if (!paths[operation.path]) {
      paths[operation.path] = {};
    }
    const responses: Record<string, unknown> = {
      200: {
        description: operation.summary ?? `Successful ${operation.method} ${operation.path}`,
      },
    };

    const responseSchema = buildResponseSchema(operation.returns, entityNames);
    if (responseSchema) {
      responses[200] = {
        description: operation.summary ?? `Successful ${operation.method} ${operation.path}`,
        content: {
          "application/json": {
            schema: responseSchema,
          },
        },
      };
    }

    paths[operation.path] = {
      ...(paths[operation.path] as Record<string, unknown>),
      [method]: {
        operationId: slugify(`${operation.method} ${operation.path}`),
        summary: operation.summary ?? operation.name,
        description: operation.description,
        responses,
      },
    };
  });

  return {
    openapi: "3.1.0",
    info: {
      title: ctx.name,
      version: ctx.capturedAt,
      description: ctx.summary,
    },
    paths,
    components,
  };
}

function buildProperties(
  fields: ResearchField[],
  entityNames: Set<string>,
): Record<string, unknown> {
  const properties: Record<string, unknown> = {};
  fields.forEach((field) => {
    properties[field.name] = shapeForType(field.type, entityNames);
    if (field.description) {
      (properties[field.name] as Record<string, unknown>).description = field.description;
    }
  });
  return properties;
}

function shapeForType(typeInput: string, entityNames: Set<string>): Record<string, unknown> {
  const type = typeInput.trim();
  if (!type) {
    return { type: "string" };
  }

  const enumMatch = type.match(/^enum\[(.+)\]$/i);
  if (enumMatch) {
    return {
      type: "string",
      enum: enumMatch[1].split(/\s*,\s*/).filter(Boolean),
    };
  }

  if (type.endsWith("[]")) {
    const inner = type.slice(0, -2).trim();
    return {
      type: "array",
      items: referenceForType(inner, entityNames),
    };
  }

  const lower = type.toLowerCase();
  if (simpleTypeMap[lower]) {
    return { type: simpleTypeMap[lower] };
  }

  return referenceForType(type, entityNames);
}

function referenceForType(type: string, entityNames: Set<string>): Record<string, unknown> {
  if (entityNames.has(type)) {
    return { $ref: `#/components/schemas/${type}` };
  }
  if (simpleTypeMap[type.toLowerCase()]) {
    return { type: simpleTypeMap[type.toLowerCase()] };
  }
  return { type: "string" };
}

function buildResponseSchema(
  returns: string | undefined,
  entityNames: Set<string>,
): Record<string, unknown> | undefined {
  if (!returns) return undefined;
  const trimmed = returns.trim();
  if (!trimmed) return undefined;

  if (trimmed.endsWith("[]")) {
    const inner = trimmed.slice(0, -2).trim();
    return {
      type: "array",
      items: referenceForType(inner, entityNames),
    };
  }

  return referenceForType(trimmed, entityNames);
}
