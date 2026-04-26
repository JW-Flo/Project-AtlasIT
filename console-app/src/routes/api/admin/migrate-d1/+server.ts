import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { queryPg, queryPgOne } from "$lib/server/pg";

const D1_CONSOLE_USERS = [
  {
    id: "9233a973-a93a-43e2-bb10-c05b3dc2bdb3",
    email: "joe.whittle@atlasit.app",
    password_hash: "pbkdf2$100000$37eae5ab165ed8cb0e50fe647dd030a378ac548df9577793cc73cf18c6fc6006",
    salt: "f00ac25b-e853-40bc-8ad3-7be2030d1de3",
    tenant_id: "atlasit",
    roles: '["super-admin","owner","admin"]',
    display_name: "Joe Whittle",
  },
  {
    id: "b42d5a58-fe5a-4978-a5e9-e4fab5b00c20",
    email: "demo@hardworkco.com",
    password_hash: "pbkdf2$100000$0886f0d5515a17b4762fede56f51d7ccdd6010637710164538c2e6ada243aa72",
    salt: "35f71d64-7cce-4f23-b99a-29dc7feff1f3",
    tenant_id: "test",
    roles: '["owner","admin"]',
    display_name: "Test",
  },
  {
    id: "95ed90c9-ced7-45c3-973f-0d75934fba7b",
    email: "joe.whittle6600@gmail.com",
    password_hash: "pbkdf2$100000$d5735c0127381e3f3d79f015af547f5d1d2450de4210bdaa97fa1e9de4ac60b6",
    salt: "289780c4-2e2f-4da2-83cc-9a5f56ecab51",
    tenant_id: "test-03",
    roles: '["owner","admin"]',
    display_name: "Joe Whittle",
  },
  {
    id: "f884e83f-5386-4c89-aa49-2a9b02cd00cc",
    email: "business@awhittlewandering.com",
    password_hash: "pbkdf2$100000$e8d1c5679e6c402991834d790283458c8757621b5123e00b940bcd9db4e58a5a",
    salt: "38f74d36-6bce-439a-b66f-1bedac49c4a8",
    tenant_id: "a-whittle-wandering",
    roles: '["owner","admin"]',
    display_name: "Andrey Kontarev",
  },
  {
    id: "f5bec6f9-6190-4ec0-b521-f2e8bd6363ef",
    email: "support@atlasit.app",
    password_hash: "pbkdf2$100000$6c0751a6cc13befb2fa385acbdae9220ce69b5ca8b1081119bb1c5ec9215c982",
    salt: "ff6962ea-1f6e-4691-95c1-e0f997206f26",
    tenant_id: "atlasit",
    roles: '["admin"]',
    display_name: "Support",
  },
  {
    id: "fedd7c82-5fed-40e5-a17d-31ece4819ef9",
    email: "service01@atlasit.app",
    password_hash: "pbkdf2$100000$c59de69fb3c022f3b25b892e395f0293a43354c795751711d3fa789e64ff09aa",
    salt: "03c9cbb2-1314-440b-8a2b-21eda15b6e5d",
    tenant_id: "atlasit",
    roles: '["member"]',
    display_name: "Service Account 01",
  },
  {
    id: "63bbc933-1fd5-4ed6-ab4d-1c113f6dcdef",
    email: "service02@atlasit.app",
    password_hash: "pbkdf2$100000$27552174894312b27284d56afc6d50b5fcde31ad1818fc23b219738bfe35aff9",
    salt: "68f1def3-917c-4b50-84e7-cb50ac66027c",
    tenant_id: "atlasit",
    roles: '["member"]',
    display_name: "Service Account 2",
  },
  {
    id: "be60cebc-9a73-42a2-b786-78460271817d",
    email: "joe.whittle@awhittlewandering.com",
    password_hash: "pbkdf2$100000$a6c68e509a25469d775c74c32d2c1e9c7a82da978a330e861b93d9bd42164233",
    salt: "c6ec6be5-32c7-4ea7-8afb-7541961b9e43",
    tenant_id: "a-whittle-wandering",
    roles: '["admin"]',
    display_name: "Joe",
  },
  {
    id: "6132670e-5269-4992-970a-5d8d003ee52d",
    email: "test03@atlasit.pro",
    password_hash: "pbkdf2$100000$1a0e068355889faf28db6419696623bbb91bccce4a7066af4f65fa213a7f5db1",
    salt: "f95cae43-671b-42d5-8487-2862444277fb",
    tenant_id: "test03",
    roles: '["owner","admin"]',
    display_name: "Test01",
  },
];

const D1_TENANTS = [
  { id: "atlasit", name: "AtlasIT", slug: "atlasit" },
  { id: "test", name: "HardWorkCo2", slug: "test" },
  { id: "test-2", name: "Test 2", slug: "test-2" },
  { id: "test-03", name: "Test_03", slug: "test-03" },
  { id: "a-whittle-wandering", name: "A Whittle Wandering", slug: "a-whittle-wandering" },
  { id: "test03", name: "Test03", slug: "test03" },
];

export const POST: RequestHandler = async ({ request }) => {
  const authHeader = request.headers.get("authorization");
  const internalKey = process.env.INTERNAL_API_KEY;
  if (!internalKey || authHeader !== `Bearer ${internalKey}`) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: string[] = [];

  // Ensure tables exist
  await queryPg(`CREATE TABLE IF NOT EXISTS tenants (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT,
    plan TEXT DEFAULT 'free',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`);
  results.push("tenants table ensured");

  await queryPg(`CREATE TABLE IF NOT EXISTS console_users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    display_name TEXT,
    roles JSONB NOT NULL DEFAULT '["admin"]',
    tenant_id TEXT NOT NULL DEFAULT 'atlasit',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login TIMESTAMPTZ
  )`);
  results.push("console_users table ensured");

  // Seed tenants
  for (const t of D1_TENANTS) {
    try {
      await queryPg(
        `INSERT INTO tenants (id, name, slug) VALUES ($1, $2, $3) ON CONFLICT (id) DO UPDATE SET name = $2, slug = $3`,
        [t.id, t.name, t.slug],
      );
      results.push(`tenant ${t.id} upserted`);
    } catch (e: unknown) {
      results.push(`tenant ${t.id} error: ${(e as Error).message}`);
    }
  }

  // Seed console_users
  for (const u of D1_CONSOLE_USERS) {
    try {
      await queryPg(
        `INSERT INTO console_users (id, email, password_hash, salt, display_name, roles, tenant_id)
         VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7)
         ON CONFLICT (id) DO UPDATE SET password_hash = $3, salt = $4, display_name = $5, roles = $6::jsonb, tenant_id = $7`,
        [u.id, u.email, u.password_hash, u.salt, u.display_name, u.roles, u.tenant_id],
      );
      results.push(`user ${u.email} upserted`);
    } catch (e: unknown) {
      results.push(`user ${u.email} error: ${(e as Error).message}`);
    }
  }

  // Verify
  const userCount = await queryPg<{ count: string }>("SELECT COUNT(*) as count FROM console_users");
  const tenantCount = await queryPg<{ count: string }>("SELECT COUNT(*) as count FROM tenants");

  return json({
    results,
    counts: {
      console_users: userCount[0]?.count,
      tenants: tenantCount[0]?.count,
    },
  });
};
