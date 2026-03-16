import type { ScimFilterExpression } from "./types.js";

/**
 * Parse a SCIM filter expression.
 * Supports: attribute eq "value", attribute co "value"
 * RFC 7644 Section 3.4.2.2
 */
export function parseScimFilter(
  filter: string,
): ScimFilterExpression | null {
  const trimmed = filter.trim();
  if (!trimmed) return null;

  // Match: attribute operator "value"
  const match = trimmed.match(
    /^(\w+)\s+(eq|co|sw|ew|pr)\s+"([^"]*)"$/i,
  );

  if (!match) return null;

  const [, attribute, operator, value] = match;

  const normalizedOp = operator.toLowerCase() as ScimFilterExpression["operator"];

  return {
    attribute,
    operator: normalizedOp,
    value,
  };
}

/**
 * Map SCIM attribute names to D1 column names.
 */
export function mapUserFilterToSql(
  parsed: ScimFilterExpression,
): { clause: string; value: string } | null {
  const columnMap: Record<string, string> = {
    userName: "email",
    "name.givenName": "display_name",
    "name.familyName": "display_name",
    displayName: "display_name",
    externalId: "external_id",
    title: "title",
    "urn:ietf:params:scim:schemas:core:2.0:User:userName": "email",
  };

  const column = columnMap[parsed.attribute];
  if (!column) return null;

  switch (parsed.operator) {
    case "eq":
      return { clause: `${column} = ?`, value: parsed.value };
    case "co":
      return { clause: `${column} LIKE ?`, value: `%${parsed.value}%` };
    case "sw":
      return { clause: `${column} LIKE ?`, value: `${parsed.value}%` };
    case "ew":
      return { clause: `${column} LIKE ?`, value: `%${parsed.value}` };
    default:
      return null;
  }
}

export function mapGroupFilterToSql(
  parsed: ScimFilterExpression,
): { clause: string; value: string } | null {
  const columnMap: Record<string, string> = {
    displayName: "name",
    externalId: "external_id",
  };

  const column = columnMap[parsed.attribute];
  if (!column) return null;

  switch (parsed.operator) {
    case "eq":
      return { clause: `${column} = ?`, value: parsed.value };
    case "co":
      return { clause: `${column} LIKE ?`, value: `%${parsed.value}%` };
    default:
      return null;
  }
}
