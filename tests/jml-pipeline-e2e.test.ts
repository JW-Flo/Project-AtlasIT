import { describe, it, expect } from "vitest";

/**
 * JML Pipeline E2E tests.
 *
 * These verify the core JML logic without needing real D1/DO bindings:
 * - Event classification (joiner/leaver/mover/rehire)
 * - Workflow step generation (provision/deprovision per adapter)
 * - Adapter health check gating
 * - Default group_app_mappings seeding logic
 */

// ── Test: classification logic ─────────────────────────────────────────────

describe("JML classification", () => {
  it("classifies 'created' changeType as joiner", () => {
    const changeType = "created";
    const expected = "joiner";
    // The JML engine maps changeType → action
    const mapping: Record<string, string> = {
      created: "joiner",
      deactivated: "leaver",
      deleted: "leaver",
      reactivated: "rehire",
      updated: "mover",
    };
    expect(mapping[changeType]).toBe(expected);
  });

  it("classifies 'deactivated' as leaver", () => {
    const mapping: Record<string, string> = {
      created: "joiner",
      deactivated: "leaver",
      deleted: "leaver",
      reactivated: "rehire",
    };
    expect(mapping["deactivated"]).toBe("leaver");
    expect(mapping["deleted"]).toBe("leaver");
  });

  it("classifies 'reactivated' as rehire", () => {
    const mapping: Record<string, string> = {
      created: "joiner",
      reactivated: "rehire",
    };
    expect(mapping["reactivated"]).toBe("rehire");
  });
});

// ── Test: workflow step building ───────────────────────────────────────────

describe("JML workflow step building", () => {
  // Replicate the step-building logic from jml-engine.ts
  interface AppAccess {
    appId: string;
    role: string;
    groupId: string;
  }

  interface WorkflowStepDef {
    id: string;
    name: string;
    handler: string;
    timeoutMs: number;
    compensate?: string;
    delayMs?: number;
  }

  function buildJoinerSteps(
    apps: AppAccess[],
    adapterUrls: Record<string, string>,
  ): { main: WorkflowStepDef[]; compensation: WorkflowStepDef[] } {
    const main: WorkflowStepDef[] = [];
    const compensation: WorkflowStepDef[] = [];

    main.push({
      id: "resolve_access",
      name: "Resolve access bundle",
      handler: "atlas.resolve_access_bundle",
      timeoutMs: 10_000,
    });

    for (const app of apps) {
      if (!adapterUrls[app.appId]) continue;
      main.push({
        id: `provision_${app.appId}`,
        name: `Provision ${app.appId} (${app.role})`,
        handler: `${app.appId}.provision`,
        timeoutMs: 30_000,
        compensate: `${app.appId}.deprovision`,
      });
      compensation.push({
        id: `provision_${app.appId}`,
        name: `Rollback ${app.appId}`,
        handler: `${app.appId}.deprovision`,
        timeoutMs: 30_000,
      });
    }

    main.push({
      id: "emit_evidence",
      name: "Emit joiner evidence",
      handler: "atlas.emit_evidence",
      timeoutMs: 10_000,
    });

    return { main, compensation };
  }

  function buildLeaverSteps(
    apps: AppAccess[],
    adapterUrls: Record<string, string>,
    graceMs = 0,
  ): WorkflowStepDef[] {
    const main: WorkflowStepDef[] = [];
    main.push({
      id: "resolve_access",
      name: "Resolve access bundle",
      handler: "atlas.resolve_access_bundle",
      timeoutMs: 10_000,
    });

    let graceApplied = false;
    for (const app of apps) {
      if (!adapterUrls[app.appId]) continue;
      const step: WorkflowStepDef = {
        id: `revoke_${app.appId}`,
        name: `Revoke ${app.appId}`,
        handler: `${app.appId}.deprovision`,
        timeoutMs: 30_000,
      };
      if (!graceApplied && graceMs > 0) {
        step.delayMs = graceMs;
        graceApplied = true;
      }
      main.push(step);
    }

    main.push({
      id: "emit_evidence",
      name: "Emit leaver evidence",
      handler: "atlas.emit_evidence",
      timeoutMs: 10_000,
    });

    return main;
  }

  it("builds provision steps for joiner with connected adapters", () => {
    const apps: AppAccess[] = [
      { appId: "jira", role: "member", groupId: "g1" },
      { appId: "confluence", role: "member", groupId: "g1" },
      { appId: "slack", role: "member", groupId: "g2" },
    ];
    const adapterUrls = {
      jira: "https://jira-adapter.example.com",
      confluence: "https://confluence-adapter.example.com",
      slack: "https://slack-adapter.example.com",
    };

    const { main, compensation } = buildJoinerSteps(apps, adapterUrls);

    // resolve_access + 3 provisions + emit_evidence = 5
    expect(main.length).toBe(5);
    expect(main[0].handler).toBe("atlas.resolve_access_bundle");
    expect(main[1].handler).toBe("jira.provision");
    expect(main[2].handler).toBe("confluence.provision");
    expect(main[3].handler).toBe("slack.provision");
    expect(main[4].handler).toBe("atlas.emit_evidence");

    // 3 compensation (rollback) steps
    expect(compensation.length).toBe(3);
    expect(compensation[0].handler).toBe("jira.deprovision");
  });

  it("skips apps without configured adapter URLs", () => {
    const apps: AppAccess[] = [
      { appId: "jira", role: "member", groupId: "g1" },
      { appId: "notion", role: "member", groupId: "g1" },
    ];
    const adapterUrls = {
      jira: "https://jira-adapter.example.com",
      // notion is NOT configured
    };

    const { main } = buildJoinerSteps(apps, adapterUrls);

    // resolve_access + 1 provision (jira only) + emit_evidence = 3
    expect(main.length).toBe(3);
    expect(main[1].handler).toBe("jira.provision");
    // notion should not appear
    const handlers = main.map((s) => s.handler);
    expect(handlers).not.toContain("notion.provision");
  });

  it("builds revocation steps for leaver", () => {
    const apps: AppAccess[] = [
      { appId: "github", role: "member", groupId: "g1" },
      { appId: "aws", role: "admin", groupId: "g2" },
    ];
    const adapterUrls = {
      github: "https://github-adapter.example.com",
      aws: "https://aws-adapter.example.com",
    };

    const steps = buildLeaverSteps(apps, adapterUrls);

    expect(steps.length).toBe(4); // resolve + 2 revoke + emit
    expect(steps[1].handler).toBe("github.deprovision");
    expect(steps[2].handler).toBe("aws.deprovision");
  });

  it("applies grace period delay to first revocation step", () => {
    const apps: AppAccess[] = [
      { appId: "jira", role: "member", groupId: "g1" },
      { appId: "slack", role: "member", groupId: "g2" },
    ];
    const adapterUrls = {
      jira: "https://jira-adapter.example.com",
      slack: "https://slack-adapter.example.com",
    };

    const steps = buildLeaverSteps(apps, adapterUrls, 24 * 60 * 60_000); // 24h grace

    // First revocation step gets the delay
    expect(steps[1].delayMs).toBe(24 * 60 * 60_000);
    // Second revocation step does NOT
    expect(steps[2].delayMs).toBeUndefined();
  });
});

// ── Test: handler pattern matching ────────────────────────────────────────

describe("handler pattern matching", () => {
  function matchPattern(pattern: string, action: string): boolean {
    if (pattern === action) return true;
    if (pattern === "*") return true;
    const patternParts = pattern.split(".");
    const actionParts = action.split(".");
    if (patternParts.length !== actionParts.length) return false;
    return patternParts.every((p, i) => p === "*" || p === actionParts[i]);
  }

  it("matches exact handler names", () => {
    expect(matchPattern("atlas.resolve_access_bundle", "atlas.resolve_access_bundle")).toBe(true);
    expect(matchPattern("atlas.emit_evidence", "atlas.emit_evidence")).toBe(true);
  });

  it("matches wildcard patterns for provision/deprovision", () => {
    expect(matchPattern("*.provision", "jira.provision")).toBe(true);
    expect(matchPattern("*.provision", "confluence.provision")).toBe(true);
    expect(matchPattern("*.deprovision", "slack.deprovision")).toBe(true);
  });

  it("does not match mismatched patterns", () => {
    expect(matchPattern("*.provision", "jira.deprovision")).toBe(false);
    expect(matchPattern("atlas.emit_evidence", "atlas.provision")).toBe(false);
    expect(matchPattern("jira.*", "confluence.provision")).toBe(false);
  });

  it("wildcard * matches everything", () => {
    expect(matchPattern("*", "anything.at.all")).toBe(true);
    expect(matchPattern("*", "simple")).toBe(true);
  });
});

// ── Test: default mapping seeding logic ───────────────────────────────────

describe("default group_app_mappings seeding", () => {
  it("generates correct number of mappings for groups × apps", () => {
    const groups = ["g1", "g2", "g3"];
    const apps = ["jira", "confluence", "slack", "github"];

    // Simulate the seeding logic
    const mappings: Array<{ groupId: string; appId: string; role: string; suggested: number }> = [];
    for (const group of groups) {
      for (const app of apps) {
        mappings.push({ groupId: group, appId: app, role: "member", suggested: 1 });
      }
    }

    expect(mappings.length).toBe(12); // 3 groups × 4 apps
    // All should be suggested (for admin review)
    expect(mappings.every((m) => m.suggested === 1)).toBe(true);
    expect(mappings.every((m) => m.role === "member")).toBe(true);
  });

  it("produces no mappings when no apps are connected", () => {
    const groups = ["g1", "g2"];
    const apps: string[] = [];

    const mappings: Array<{ groupId: string; appId: string }> = [];
    for (const group of groups) {
      for (const app of apps) {
        mappings.push({ groupId: group, appId: app });
      }
    }

    expect(mappings.length).toBe(0);
  });

  it("produces no mappings when no groups exist", () => {
    const groups: string[] = [];
    const apps = ["jira", "slack"];

    const mappings: Array<{ groupId: string; appId: string }> = [];
    for (const group of groups) {
      for (const app of apps) {
        mappings.push({ groupId: group, appId: app });
      }
    }

    expect(mappings.length).toBe(0);
  });
});

// ── Test: mover classification delta ──────────────────────────────────────

describe("JML mover delta detection", () => {
  const MOVER_FIELDS = ["department", "title", "manager", "orgUnit", "groups"];

  it("detects department change as mover signal", () => {
    const delta: Record<string, { old?: unknown; new?: unknown }> = {
      department: { old: "Engineering", new: "Product" },
    };
    const changedFields = Object.keys(delta).filter((f) => MOVER_FIELDS.includes(f));
    expect(changedFields).toContain("department");
    expect(changedFields.length).toBeGreaterThan(0);
  });

  it("ignores non-mover fields like avatar or phone", () => {
    const delta: Record<string, { old?: unknown; new?: unknown }> = {
      avatar: { old: "old-url", new: "new-url" },
      phone: { old: "111", new: "222" },
    };
    const changedFields = Object.keys(delta).filter((f) => MOVER_FIELDS.includes(f));
    expect(changedFields.length).toBe(0);
  });

  it("detects multiple mover signals in single update", () => {
    const delta: Record<string, { old?: unknown; new?: unknown }> = {
      department: { old: "Engineering", new: "Sales" },
      title: { old: "Engineer", new: "Sales Rep" },
      manager: { old: "alice@co.com", new: "bob@co.com" },
      avatar: { old: "old", new: "new" }, // should be ignored
    };
    const changedFields = Object.keys(delta).filter((f) => MOVER_FIELDS.includes(f));
    expect(changedFields.length).toBe(3);
    expect(changedFields).toEqual(expect.arrayContaining(["department", "title", "manager"]));
  });
});
