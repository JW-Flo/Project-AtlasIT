import { Hono } from "hono";
import type { Context } from "hono";
import {
  SCIM_SCHEMAS,
  type ScimUserResource,
  type ScimGroupResource,
  type ScimListResponse,
  type ScimError,
  type ScimCreateUserRequest,
  type ScimCreateGroupRequest,
  type ScimPatchRequest,
  type ScimMeta,
  type DirectoryUserRow,
  type DirectoryGroupRow,
  type DirectoryMembershipRow,
} from "./types.js";
import { parseScimFilter, mapUserFilterToSql, mapGroupFilterToSql } from "./filter.js";

interface ScimBindings {
  DB: D1Database;
  SCIM_API_TOKEN: string;
  CONNECTOR_ID: string;
}

type ScimContext = Context<{ Bindings: ScimBindings }>;

const scimRouter = new Hono<{ Bindings: ScimBindings }>();

// ---------- Middleware ----------

scimRouter.use("*", async (c, next) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader) {
    return c.json(scimError("Authentication required", "401"), 401);
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return c.json(scimError("Invalid authentication scheme", "401"), 401);
  }

  const token = parts[1];
  if (token !== c.env.SCIM_API_TOKEN) {
    return c.json(scimError("Invalid Bearer token", "401"), 401);
  }

  await next();
});

// ---------- Helper functions ----------

function scimError(detail: string, status: string, scimType?: string): ScimError {
  return {
    schemas: [SCIM_SCHEMAS.ERROR],
    detail,
    status,
    ...(scimType ? { scimType } : {}),
  };
}

function tenantId(c: ScimContext): string {
  return c.req.header("X-Tenant-ID") ?? "default";
}

function baseUrl(c: ScimContext): string {
  const url = new URL(c.req.url);
  return `${url.protocol}//${url.host}`;
}

function userMeta(c: ScimContext, id: string, created: string, updated: string): ScimMeta {
  return {
    resourceType: "User",
    created,
    lastModified: updated,
    location: `${baseUrl(c)}/scim/v2/Users/${id}`,
  };
}

function groupMeta(c: ScimContext, id: string, created: string, updated: string): ScimMeta {
  return {
    resourceType: "Group",
    created,
    lastModified: updated,
    location: `${baseUrl(c)}/scim/v2/Groups/${id}`,
  };
}

function rowToScimUser(c: ScimContext, row: DirectoryUserRow): ScimUserResource {
  const rawAttrs = row.raw_attributes
    ? (JSON.parse(row.raw_attributes) as Record<string, string>)
    : {};

  const givenName = rawAttrs.firstName ?? row.display_name?.split(" ")[0] ?? "";
  const familyName = rawAttrs.lastName ?? row.display_name?.split(" ").slice(1).join(" ") ?? "";

  return {
    schemas: [SCIM_SCHEMAS.USER],
    id: row.id,
    externalId: row.external_id,
    userName: row.email,
    name: {
      givenName,
      familyName,
      formatted: row.display_name ?? undefined,
    },
    displayName: row.display_name ?? row.email,
    emails: [{ value: row.email, type: "work", primary: true }],
    active: row.status === "active",
    title: row.title ?? undefined,
    department: row.department ?? undefined,
    meta: userMeta(c, row.id, row.created_at, row.updated_at),
  };
}

async function rowToScimGroup(c: ScimContext, row: DirectoryGroupRow): Promise<ScimGroupResource> {
  const db = c.env.DB;
  const tid = tenantId(c);

  const memberRows = await db
    .prepare(
      `SELECT dm.user_id, du.display_name
       FROM directory_memberships dm
       JOIN directory_users du ON du.id = dm.user_id AND du.tenant_id = dm.tenant_id
       WHERE dm.group_id = ?1 AND dm.tenant_id = ?2`,
    )
    .bind(row.id, tid)
    .all<DirectoryMembershipRow>();

  const members = (memberRows.results ?? []).map((m) => ({
    value: m.user_id,
    display: m.display_name ?? undefined,
    $ref: `${baseUrl(c)}/scim/v2/Users/${m.user_id}`,
  }));

  return {
    schemas: [SCIM_SCHEMAS.GROUP],
    id: row.id,
    externalId: row.external_id,
    displayName: row.name,
    members,
    meta: groupMeta(c, row.id, row.created_at, row.updated_at),
  };
}

// ---------- User endpoints ----------

// GET /scim/v2/Users
scimRouter.get("/Users", async (c) => {
  const db = c.env.DB;
  const tid = tenantId(c);
  const filter = c.req.query("filter");
  const startIndex = Math.max(1, parseInt(c.req.query("startIndex") ?? "1", 10));
  const count = Math.min(100, Math.max(1, parseInt(c.req.query("count") ?? "100", 10)));

  let rows: { results: DirectoryUserRow[] };

  if (filter) {
    const parsed = parseScimFilter(filter);
    if (!parsed) {
      return c.json(scimError("Invalid filter syntax", "400", "invalidFilter"), 400);
    }

    const sqlFilter = mapUserFilterToSql(parsed);
    if (!sqlFilter) {
      return c.json(scimError("Unsupported filter attribute", "400", "invalidFilter"), 400);
    }

    const filterClause = sqlFilter.clause.replace("?", "?2");
    rows = await db
      .prepare(
        `SELECT * FROM directory_users WHERE tenant_id = ?1 AND ${filterClause} ORDER BY created_at LIMIT ?3 OFFSET ?4`,
      )
      .bind(tid, sqlFilter.value, count, startIndex - 1)
      .all<DirectoryUserRow>();
  } else {
    rows = await db
      .prepare(
        "SELECT * FROM directory_users WHERE tenant_id = ?1 ORDER BY created_at LIMIT ?2 OFFSET ?3",
      )
      .bind(tid, count, startIndex - 1)
      .all<DirectoryUserRow>();
  }

  const totalResult = await db
    .prepare("SELECT COUNT(*) as cnt FROM directory_users WHERE tenant_id = ?1")
    .bind(tid)
    .first<{ cnt: number }>();

  const totalResults = totalResult?.cnt ?? 0;
  const resources = (rows.results ?? []).map((row) => rowToScimUser(c, row));

  const response: ScimListResponse<ScimUserResource> = {
    schemas: [SCIM_SCHEMAS.LIST_RESPONSE],
    totalResults,
    startIndex,
    itemsPerPage: resources.length,
    Resources: resources,
  };

  return c.json(response);
});

// GET /scim/v2/Users/:id
scimRouter.get("/Users/:id", async (c) => {
  const db = c.env.DB;
  const tid = tenantId(c);
  const userId = c.req.param("id");

  const row = await db
    .prepare("SELECT * FROM directory_users WHERE id = ?1 AND tenant_id = ?2")
    .bind(userId, tid)
    .first<DirectoryUserRow>();

  if (!row) {
    return c.json(scimError("User not found", "404"), 404);
  }

  return c.json(rowToScimUser(c, row));
});

// POST /scim/v2/Users
scimRouter.post("/Users", async (c) => {
  const db = c.env.DB;
  const tid = tenantId(c);

  const body = await c.req.json<ScimCreateUserRequest>();

  if (!body.userName) {
    return c.json(scimError("userName is required", "400", "invalidValue"), 400);
  }

  // Check for duplicate
  const existing = await db
    .prepare("SELECT id FROM directory_users WHERE tenant_id = ?1 AND email = ?2")
    .bind(tid, body.userName)
    .first<{ id: string }>();

  if (existing) {
    return c.json(scimError("User already exists", "409", "uniqueness"), 409);
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const displayName =
    body.displayName ??
    (`${body.name?.givenName ?? ""} ${body.name?.familyName ?? ""}`.trim() || body.userName);

  const rawAttributes = JSON.stringify({
    firstName: body.name?.givenName ?? "",
    lastName: body.name?.familyName ?? "",
    email: body.userName,
    login: body.userName,
    title: body.title,
    department: body.department,
  });

  await db
    .prepare(
      `INSERT INTO directory_users (id, tenant_id, external_id, email, display_name, department, title, status, raw_attributes, created_at, updated_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)`,
    )
    .bind(
      id,
      tid,
      body.externalId ?? id,
      body.userName,
      displayName,
      body.department ?? null,
      body.title ?? null,
      body.active === false ? "inactive" : "active",
      rawAttributes,
      now,
      now,
    )
    .run();

  const created = await db
    .prepare("SELECT * FROM directory_users WHERE id = ?1 AND tenant_id = ?2")
    .bind(id, tid)
    .first<DirectoryUserRow>();

  if (!created) {
    return c.json(scimError("Failed to create user", "500"), 500);
  }

  return c.json(rowToScimUser(c, created), 201);
});

// PATCH /scim/v2/Users/:id
scimRouter.patch("/Users/:id", async (c) => {
  const db = c.env.DB;
  const tid = tenantId(c);
  const userId = c.req.param("id");

  const row = await db
    .prepare("SELECT * FROM directory_users WHERE id = ?1 AND tenant_id = ?2")
    .bind(userId, tid)
    .first<DirectoryUserRow>();

  if (!row) {
    return c.json(scimError("User not found", "404"), 404);
  }

  const body = await c.req.json<ScimPatchRequest>();

  if (!body.schemas?.includes(SCIM_SCHEMAS.PATCH_OP) || !Array.isArray(body.Operations)) {
    return c.json(scimError("Invalid PATCH request", "400", "invalidSyntax"), 400);
  }

  let status = row.status;
  let displayName = row.display_name;
  let email = row.email;
  let title = row.title;
  let department = row.department;

  for (const op of body.Operations) {
    if (op.op === "replace") {
      if (typeof op.value === "object" && op.value !== null) {
        const vals = op.value as Record<string, unknown>;
        if ("active" in vals) {
          status = vals.active ? "active" : "inactive";
        }
        if ("displayName" in vals && typeof vals.displayName === "string") {
          displayName = vals.displayName;
        }
        if ("userName" in vals && typeof vals.userName === "string") {
          email = vals.userName;
        }
        if ("title" in vals && typeof vals.title === "string") {
          title = vals.title;
        }
        if ("department" in vals && typeof vals.department === "string") {
          department = vals.department;
        }
      }
      if (op.path === "active" && typeof op.value === "boolean") {
        status = op.value ? "active" : "inactive";
      }
      if (op.path === "displayName" && typeof op.value === "string") {
        displayName = op.value;
      }
      if (op.path === "userName" && typeof op.value === "string") {
        email = op.value;
      }
      if (op.path === "title" && typeof op.value === "string") {
        title = op.value;
      }
      if (op.path === "department" && typeof op.value === "string") {
        department = op.value;
      }
    }
  }

  await db
    .prepare(
      `UPDATE directory_users
       SET email = ?1, display_name = ?2, title = ?3, department = ?4,
           status = ?5, updated_at = datetime('now')
       WHERE id = ?6 AND tenant_id = ?7`,
    )
    .bind(email, displayName, title, department, status, userId, tid)
    .run();

  const updated = await db
    .prepare("SELECT * FROM directory_users WHERE id = ?1 AND tenant_id = ?2")
    .bind(userId, tid)
    .first<DirectoryUserRow>();

  if (!updated) {
    return c.json(scimError("Failed to retrieve updated user", "500"), 500);
  }

  return c.json(rowToScimUser(c, updated));
});

// DELETE /scim/v2/Users/:id
scimRouter.delete("/Users/:id", async (c) => {
  const db = c.env.DB;
  const tid = tenantId(c);
  const userId = c.req.param("id");

  const row = await db
    .prepare("SELECT id FROM directory_users WHERE id = ?1 AND tenant_id = ?2")
    .bind(userId, tid)
    .first<{ id: string }>();

  if (!row) {
    return c.json(scimError("User not found", "404"), 404);
  }

  // Remove memberships first
  await db
    .prepare("DELETE FROM directory_memberships WHERE user_id = ?1 AND tenant_id = ?2")
    .bind(userId, tid)
    .run();

  // Mark as inactive (soft delete) to preserve audit trail
  await db
    .prepare(
      `UPDATE directory_users SET status = 'inactive', updated_at = datetime('now')
       WHERE id = ?1 AND tenant_id = ?2`,
    )
    .bind(userId, tid)
    .run();

  return c.body(null, 204);
});

// ---------- Group endpoints ----------

// GET /scim/v2/Groups
scimRouter.get("/Groups", async (c) => {
  const db = c.env.DB;
  const tid = tenantId(c);
  const filter = c.req.query("filter");
  const startIndex = Math.max(1, parseInt(c.req.query("startIndex") ?? "1", 10));
  const count = Math.min(100, Math.max(1, parseInt(c.req.query("count") ?? "100", 10)));

  let rows: { results: DirectoryGroupRow[] };

  if (filter) {
    const parsed = parseScimFilter(filter);
    if (!parsed) {
      return c.json(scimError("Invalid filter syntax", "400", "invalidFilter"), 400);
    }

    const sqlFilter = mapGroupFilterToSql(parsed);
    if (!sqlFilter) {
      return c.json(scimError("Unsupported filter attribute", "400", "invalidFilter"), 400);
    }

    const filterClause = sqlFilter.clause.replace("?", "?2");
    rows = await db
      .prepare(
        `SELECT * FROM directory_groups WHERE tenant_id = ?1 AND ${filterClause} ORDER BY created_at LIMIT ?3 OFFSET ?4`,
      )
      .bind(tid, sqlFilter.value, count, startIndex - 1)
      .all<DirectoryGroupRow>();
  } else {
    rows = await db
      .prepare(
        "SELECT * FROM directory_groups WHERE tenant_id = ?1 ORDER BY created_at LIMIT ?2 OFFSET ?3",
      )
      .bind(tid, count, startIndex - 1)
      .all<DirectoryGroupRow>();
  }

  const totalResult = await db
    .prepare("SELECT COUNT(*) as cnt FROM directory_groups WHERE tenant_id = ?1")
    .bind(tid)
    .first<{ cnt: number }>();

  const totalResults = totalResult?.cnt ?? 0;

  const resources: ScimGroupResource[] = [];
  for (const row of rows.results ?? []) {
    resources.push(await rowToScimGroup(c, row));
  }

  const response: ScimListResponse<ScimGroupResource> = {
    schemas: [SCIM_SCHEMAS.LIST_RESPONSE],
    totalResults,
    startIndex,
    itemsPerPage: resources.length,
    Resources: resources,
  };

  return c.json(response);
});

// GET /scim/v2/Groups/:id
scimRouter.get("/Groups/:id", async (c) => {
  const db = c.env.DB;
  const tid = tenantId(c);
  const groupId = c.req.param("id");

  const row = await db
    .prepare("SELECT * FROM directory_groups WHERE id = ?1 AND tenant_id = ?2")
    .bind(groupId, tid)
    .first<DirectoryGroupRow>();

  if (!row) {
    return c.json(scimError("Group not found", "404"), 404);
  }

  return c.json(await rowToScimGroup(c, row));
});

// POST /scim/v2/Groups
scimRouter.post("/Groups", async (c) => {
  const db = c.env.DB;
  const tid = tenantId(c);

  const body = await c.req.json<ScimCreateGroupRequest>();

  if (!body.displayName) {
    return c.json(scimError("displayName is required", "400", "invalidValue"), 400);
  }

  // Check for duplicate
  const existing = await db
    .prepare("SELECT id FROM directory_groups WHERE tenant_id = ?1 AND name = ?2")
    .bind(tid, body.displayName)
    .first<{ id: string }>();

  if (existing) {
    return c.json(scimError("Group already exists", "409", "uniqueness"), 409);
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await db
    .prepare(
      `INSERT INTO directory_groups (id, tenant_id, external_id, name, description, created_at, updated_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`,
    )
    .bind(id, tid, body.externalId ?? id, body.displayName, null, now, now)
    .run();

  // Add members if provided
  if (body.members?.length) {
    for (const member of body.members) {
      await db
        .prepare(
          `INSERT OR IGNORE INTO directory_memberships (id, tenant_id, user_id, group_id)
           VALUES (?1, ?2, ?3, ?4)`,
        )
        .bind(crypto.randomUUID(), tid, member.value, id)
        .run();
    }
  }

  const created = await db
    .prepare("SELECT * FROM directory_groups WHERE id = ?1 AND tenant_id = ?2")
    .bind(id, tid)
    .first<DirectoryGroupRow>();

  if (!created) {
    return c.json(scimError("Failed to create group", "500"), 500);
  }

  return c.json(await rowToScimGroup(c, created), 201);
});

// PATCH /scim/v2/Groups/:id
scimRouter.patch("/Groups/:id", async (c) => {
  const db = c.env.DB;
  const tid = tenantId(c);
  const groupId = c.req.param("id");

  const row = await db
    .prepare("SELECT * FROM directory_groups WHERE id = ?1 AND tenant_id = ?2")
    .bind(groupId, tid)
    .first<DirectoryGroupRow>();

  if (!row) {
    return c.json(scimError("Group not found", "404"), 404);
  }

  const body = await c.req.json<ScimPatchRequest>();

  if (!body.schemas?.includes(SCIM_SCHEMAS.PATCH_OP) || !Array.isArray(body.Operations)) {
    return c.json(scimError("Invalid PATCH request", "400", "invalidSyntax"), 400);
  }

  let displayName = row.name;

  for (const op of body.Operations) {
    if (op.op === "replace") {
      if (op.path === "displayName" && typeof op.value === "string") {
        displayName = op.value;
      }
      if (typeof op.value === "object" && op.value !== null) {
        const vals = op.value as Record<string, unknown>;
        if ("displayName" in vals && typeof vals.displayName === "string") {
          displayName = vals.displayName;
        }
      }
    }

    if (op.op === "add" && op.path === "members") {
      const members = Array.isArray(op.value) ? (op.value as Array<{ value: string }>) : [];
      for (const member of members) {
        await db
          .prepare(
            `INSERT OR IGNORE INTO directory_memberships (id, tenant_id, user_id, group_id)
             VALUES (?1, ?2, ?3, ?4)`,
          )
          .bind(crypto.randomUUID(), tid, member.value, groupId)
          .run();
      }
    }

    if (op.op === "remove" && op.path) {
      // Path format: members[value eq "userId"]
      const memberMatch = op.path.match(/^members\[value\s+eq\s+"([^"]+)"\]$/);
      if (memberMatch) {
        const memberId = memberMatch[1];
        await db
          .prepare(
            "DELETE FROM directory_memberships WHERE tenant_id = ?1 AND user_id = ?2 AND group_id = ?3",
          )
          .bind(tid, memberId, groupId)
          .run();
      }
    }
  }

  await db
    .prepare(
      `UPDATE directory_groups SET name = ?1, updated_at = datetime('now')
       WHERE id = ?2 AND tenant_id = ?3`,
    )
    .bind(displayName, groupId, tid)
    .run();

  const updated = await db
    .prepare("SELECT * FROM directory_groups WHERE id = ?1 AND tenant_id = ?2")
    .bind(groupId, tid)
    .first<DirectoryGroupRow>();

  if (!updated) {
    return c.json(scimError("Failed to retrieve updated group", "500"), 500);
  }

  return c.json(await rowToScimGroup(c, updated));
});

// DELETE /scim/v2/Groups/:id
scimRouter.delete("/Groups/:id", async (c) => {
  const db = c.env.DB;
  const tid = tenantId(c);
  const groupId = c.req.param("id");

  const row = await db
    .prepare("SELECT id FROM directory_groups WHERE id = ?1 AND tenant_id = ?2")
    .bind(groupId, tid)
    .first<{ id: string }>();

  if (!row) {
    return c.json(scimError("Group not found", "404"), 404);
  }

  // Remove memberships first
  await db
    .prepare("DELETE FROM directory_memberships WHERE group_id = ?1 AND tenant_id = ?2")
    .bind(groupId, tid)
    .run();

  await db
    .prepare("DELETE FROM directory_groups WHERE id = ?1 AND tenant_id = ?2")
    .bind(groupId, tid)
    .run();

  return c.body(null, 204);
});

// ---------- Discovery endpoints ----------

// GET /scim/v2/ServiceProviderConfig
scimRouter.get("/ServiceProviderConfig", (c) => {
  return c.json({
    schemas: [SCIM_SCHEMAS.SERVICE_PROVIDER_CONFIG],
    documentationUri: "https://docs.atlasit.pro/scim",
    patch: { supported: true },
    bulk: { supported: false, maxOperations: 0, maxPayloadSize: 0 },
    filter: { supported: true, maxResults: 100 },
    changePassword: { supported: false },
    sort: { supported: false },
    etag: { supported: false },
    authenticationSchemes: [
      {
        type: "oauthbearertoken",
        name: "OAuth Bearer Token",
        description: "Authentication scheme using the OAuth Bearer Token Standard",
        specUri: "https://www.rfc-editor.org/info/rfc6750",
        primary: true,
      },
    ],
    meta: {
      resourceType: "ServiceProviderConfig",
      location: `${baseUrl(c)}/scim/v2/ServiceProviderConfig`,
    },
  });
});

// GET /scim/v2/Schemas
scimRouter.get("/Schemas", (c) => {
  return c.json({
    schemas: [SCIM_SCHEMAS.LIST_RESPONSE],
    totalResults: 2,
    startIndex: 1,
    itemsPerPage: 2,
    Resources: [
      {
        schemas: [SCIM_SCHEMAS.SCHEMA],
        id: SCIM_SCHEMAS.USER,
        name: "User",
        description: "User Account",
        attributes: [
          {
            name: "userName",
            type: "string",
            multiValued: false,
            required: true,
            caseExact: false,
            mutability: "readWrite",
            returned: "default",
            uniqueness: "server",
          },
          {
            name: "name",
            type: "complex",
            multiValued: false,
            required: true,
            mutability: "readWrite",
            returned: "default",
            subAttributes: [
              {
                name: "givenName",
                type: "string",
                multiValued: false,
                required: false,
                mutability: "readWrite",
                returned: "default",
              },
              {
                name: "familyName",
                type: "string",
                multiValued: false,
                required: false,
                mutability: "readWrite",
                returned: "default",
              },
              {
                name: "formatted",
                type: "string",
                multiValued: false,
                required: false,
                mutability: "readWrite",
                returned: "default",
              },
            ],
          },
          {
            name: "displayName",
            type: "string",
            multiValued: false,
            required: false,
            mutability: "readWrite",
            returned: "default",
          },
          {
            name: "emails",
            type: "complex",
            multiValued: true,
            required: false,
            mutability: "readWrite",
            returned: "default",
            subAttributes: [
              {
                name: "value",
                type: "string",
                multiValued: false,
                required: true,
                mutability: "readWrite",
                returned: "default",
              },
              {
                name: "type",
                type: "string",
                multiValued: false,
                required: false,
                mutability: "readWrite",
                returned: "default",
              },
              {
                name: "primary",
                type: "boolean",
                multiValued: false,
                required: false,
                mutability: "readWrite",
                returned: "default",
              },
            ],
          },
          {
            name: "active",
            type: "boolean",
            multiValued: false,
            required: false,
            mutability: "readWrite",
            returned: "default",
          },
          {
            name: "title",
            type: "string",
            multiValued: false,
            required: false,
            mutability: "readWrite",
            returned: "default",
          },
        ],
        meta: {
          resourceType: "Schema",
          location: `${baseUrl(c)}/scim/v2/Schemas/${SCIM_SCHEMAS.USER}`,
        },
      },
      {
        schemas: [SCIM_SCHEMAS.SCHEMA],
        id: SCIM_SCHEMAS.GROUP,
        name: "Group",
        description: "Group",
        attributes: [
          {
            name: "displayName",
            type: "string",
            multiValued: false,
            required: true,
            mutability: "readWrite",
            returned: "default",
            uniqueness: "server",
          },
          {
            name: "members",
            type: "complex",
            multiValued: true,
            required: false,
            mutability: "readWrite",
            returned: "default",
            subAttributes: [
              {
                name: "value",
                type: "string",
                multiValued: false,
                required: true,
                mutability: "immutable",
                returned: "default",
              },
              {
                name: "display",
                type: "string",
                multiValued: false,
                required: false,
                mutability: "readOnly",
                returned: "default",
              },
              {
                name: "$ref",
                type: "reference",
                multiValued: false,
                required: false,
                mutability: "readOnly",
                returned: "default",
              },
            ],
          },
        ],
        meta: {
          resourceType: "Schema",
          location: `${baseUrl(c)}/scim/v2/Schemas/${SCIM_SCHEMAS.GROUP}`,
        },
      },
    ],
  });
});

export { scimRouter };
