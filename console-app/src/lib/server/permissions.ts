/**
 * Centralized RBAC permission matrix.
 *
 * Route pattern -> HTTP method -> required roles.
 *   - string[]  = one of these roles is required
 *   - null      = any authenticated user can access
 *   - undefined = no restriction defined (public or handled elsewhere)
 */

type Permission = string[] | null;

interface RoutePermission {
  pattern: RegExp;
  methods: Record<string, Permission>;
}

const PERMISSIONS: RoutePermission[] = [
  // ── Directory mutations ──────────────────────────────────────────
  {
    pattern: /^\/api\/directory\/users$/,
    methods: { POST: ["owner", "admin"] },
  },
  {
    pattern: /^\/api\/directory\/users\/[^/]+$/,
    methods: { PATCH: ["owner", "admin"], DELETE: ["owner"] },
  },
  {
    pattern: /^\/api\/directory\/groups$/,
    methods: { POST: ["owner", "admin"] },
  },
  {
    pattern: /^\/api\/directory\/groups\/[^/]+$/,
    methods: { PATCH: ["owner", "admin"], DELETE: ["owner"] },
  },
  {
    pattern: /^\/api\/directory\/groups\/[^/]+\/members$/,
    methods: { POST: ["owner", "admin"], DELETE: ["owner", "admin"] },
  },
  {
    pattern: /^\/api\/directory\/sync$/,
    methods: { POST: ["owner", "admin"] },
  },
  {
    pattern: /^\/api\/directory\/connect$/,
    methods: { POST: ["owner", "admin"] },
  },
  {
    pattern: /^\/api\/directory\/mappings$/,
    methods: { POST: ["owner", "admin"] },
  },
  {
    pattern: /^\/api\/directory\/mappings\/[^/]+$/,
    methods: { PATCH: ["owner", "admin"], DELETE: ["owner", "admin"] },
  },

  // ── App mutations ────────────────────────────────────────────────
  {
    pattern: /^\/api\/apps\/credentials$/,
    methods: { PUT: ["owner", "admin"], POST: ["owner", "admin"] },
  },
  {
    pattern: /^\/api\/apps\/connect$/,
    methods: { POST: ["owner", "admin"] },
  },
  {
    pattern: /^\/api\/apps\/disconnect$/,
    methods: { POST: ["owner", "admin"] },
  },
  {
    pattern: /^\/api\/apps\/[^/]+\/groups$/,
    methods: { POST: ["owner", "admin"], DELETE: ["owner", "admin"] },
  },
  {
    pattern: /^\/api\/apps\/[^/]+\/groups\/[^/]+$/,
    methods: { PATCH: ["owner", "admin"], DELETE: ["owner", "admin"] },
  },
  {
    pattern: /^\/api\/apps\/[^/]+\/roles$/,
    methods: { POST: ["owner", "admin"] },
  },
  {
    pattern: /^\/api\/apps\/[^/]+\/roles\/[^/]+$/,
    methods: { PATCH: ["owner", "admin"], DELETE: ["owner", "admin"] },
  },

  // ── Automation ───────────────────────────────────────────────────
  {
    pattern: /^\/api\/automation\/rules$/,
    methods: { POST: ["owner", "admin"] },
  },
  {
    pattern: /^\/api\/automation\/rules\/[^/]+$/,
    methods: { PATCH: ["owner", "admin"], DELETE: ["owner"] },
  },

  // ── Tenant user management ──────────────────────────────────────
  {
    pattern: /^\/api\/tenant\/users\/invite$/,
    methods: { POST: ["owner", "admin"] },
  },
  {
    pattern: /^\/api\/tenant\/users\/[^/]+\/role$/,
    methods: { PATCH: ["owner"] },
  },
  {
    pattern: /^\/api\/tenant\/users\/[^/]+$/,
    methods: { PATCH: ["owner"], DELETE: ["owner"] },
  },
  {
    pattern: /^\/api\/tenant\/settings$/,
    methods: { PATCH: ["owner"] },
  },

  // ── Incidents ────────────────────────────────────────────────────
  // Any authenticated user can create an incident
  { pattern: /^\/api\/incidents$/, methods: { POST: null } },
  {
    pattern: /^\/api\/incidents\/[^/]+\/resolve$/,
    methods: { POST: ["owner", "admin"] },
  },

  // ── Access requests ──────────────────────────────────────────────
  // Any authenticated user can create a request
  { pattern: /^\/api\/access-requests$/, methods: { POST: null } },
  {
    pattern: /^\/api\/access-requests\/[^/]+\/(approve|deny|fulfill)$/,
    methods: { POST: ["owner", "admin"] },
  },

  // ── Lifecycle ────────────────────────────────────────────────────
  {
    pattern: /^\/api\/apps\/lifecycle\/movement$/,
    methods: { POST: ["owner", "admin"] },
  },
  {
    pattern: /^\/api\/apps\/lifecycle\/workflows$/,
    methods: { POST: ["owner", "admin"] },
  },

  // ── Evidence ────────────────────────────────────────────────────
  {
    pattern: /^\/api\/tenant-compliance\/evidence$/,
    methods: { POST: ["owner", "admin"] },
  },
  {
    pattern: /^\/api\/tenant-compliance\/evidence\/[^/]+\/link$/,
    methods: { POST: ["owner", "admin"] },
  },

  // ── Tenant preferences ─────────────────────────────────────────
  {
    pattern: /^\/api\/tenants\/preferences$/,
    methods: { POST: ["owner", "admin"] },
  },

  // ── Platform (super-admin only — uses "super-admin" role) ───────
  {
    pattern: /^\/api\/platform\/dashboard$/,
    methods: { GET: ["super-admin"] },
  },
  {
    pattern: /^\/api\/platform\/usage$/,
    methods: { GET: ["super-admin"] },
  },
  {
    pattern: /^\/api\/admin\//,
    methods: {
      GET: ["super-admin"],
      POST: ["super-admin"],
      PATCH: ["super-admin"],
      DELETE: ["super-admin"],
    },
  },
];

/**
 * Match a request pathname + method against the permission matrix.
 *
 * Returns:
 *   - string[]   roles required (user must have at least one)
 *   - null        any authenticated user is allowed
 *   - undefined   no restriction in the matrix (route handles its own auth or is public)
 */
export function matchRoutePermission(
  pathname: string,
  method: string,
): string[] | null | undefined {
  for (const route of PERMISSIONS) {
    if (route.pattern.test(pathname)) {
      return route.methods[method];
    }
  }
  return undefined; // no restriction defined
}
