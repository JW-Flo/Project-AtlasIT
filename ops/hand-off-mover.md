# PR-JML-004: Mover Flow Implementation Hand-off

**Status**: Ready for Execution  
**Owner**: Copilot Orchestration  
**Date**: 2025-11-05  
**Assignees**: `agent:codegen`, `agent:cursor`

---

## CONTEXT

### Current Baseline (Joiner Flow - PR-JML-001)

The JML Engine already implements:

- **Durable Object orchestrator** (`index.js` with `JMLEngine` class)
- **Joiner flow** tested and working (see `tests/jml-engine.test.ts`)
- **Test fixtures** in `fixtures/jml/joiner.json` and `fixtures/jml/mover.json`
- **Evidence emission** to `/artifacts/jml/` directory structure
- **Saga-based execution** with retry/compensation logic

The existing test at `tests/jml-engine.test.ts` line 81-94 already validates mover flow:

```typescript
it("applies mover role change and reconciles to target entitlements", async () => {
  const mover = await loadFixture("mover");
  const response = await engine.handleEnqueue(mover);
  const { runId } = await response.json();

  const run = await state.storage.get(`run:${runId}`);
  expect(run?.status).toBe("completed");

  const reconciliation = run?.history?.find(
    (entry: any) => entry.stepId === "reconcile-entitlements",
  );
  expect(reconciliation?.output?.applied).toStrictEqual(
    mover.entitlements.target,
  );

  const roleChange = run?.history?.find(
    (entry: any) => entry.stepId === "apply-role-change",
  );
  expect(roleChange?.output?.newRole).toMatchObject(mover.newRole);
});
```

### New Requirements (Mover Flow - PR-JML-004)

1. **Worker Module**: `/workers/jml/mover.ts`
   - Handle attribute deltas (department, title, manager)
   - Detect changes between previous and new role
   - Calculate entitlement differences (add/remove)

2. **Connector Updates**: Update adapters with new role data
   - Okta: Update user profile attributes
   - Slack: Update channels based on department change
   - Google Workspace: Update groups/org units

3. **Policy Enforcement**:
   - Remove obsolete group/channel access
   - Confirm continued MFA compliance
   - Validate new entitlements against policy

4. **Orchestration Extension**: Extend JML engine in `index.js`
   - Add mover-specific step handlers
   - Integrate with existing saga execution
   - Handle step: `apply-role-change`
   - Handle step: `reconcile-entitlements`
   - Handle step: `notify-stakeholders`

5. **Evidence Emission**:
   - Write to `/artifacts/jml/mover/EV-mover-<trace_id>.json`
   - Include: `trace_id`, `timestamp`, `delta_summary`, `control_ids`
   - Create local proof: `EV-mover-local.json`

6. **Testing**: `/tests/jml/mover.test.ts`
   - Test attribute delta detection
   - Test entitlement reconciliation
   - Test policy enforcement
   - Test evidence emission
   - Test error handling and DLQ

7. **Documentation**: Update `/docs/JML_ENGINE.md`
   - Add Mover flow section
   - Document steps and decision points
   - Include evidence schema

---

## FILES TO CREATE

### Primary Implementation

1. **`/workers/jml/mover.ts`**
   - Export `MoverWorker` class with methods:
     - `detectAttributeDeltas(previous, newRole)` → delta object
     - `calculateEntitlementChanges(previous, target)` → {add: [], remove: []}
     - `applyRoleChange(user, newRole, connectors)` → result
     - `reconcileEntitlements(user, changes, connectors)` → result
     - `enforcePolicy(user, newRole, policy)` → violations[]
     - `emitEvidence(traceId, delta, result)` → evidencePath

2. **`/workers/jml/index.ts`** (if needed)
   - Export barrel for JML workers
   - Re-export `MoverWorker`

### Testing

3. **`/tests/jml/mover.test.ts`**
   - Unit tests for MoverWorker methods
   - Integration test with mocked connectors
   - Evidence emission validation
   - Error handling and retry logic

### Evidence & Artifacts

4. **`/artifacts/jml/mover/.gitkeep`**
   - Ensure directory exists for evidence files

5. **`.codex.done`** (at project root)
   - Marker file indicating completion

### Documentation

6. **Update `/docs/JML_ENGINE.md`**
   - Add "Mover Flow" section after line 56
   - Document steps: validate-profile → apply-role-change → reconcile-entitlements → notify-stakeholders
   - Include evidence schema example

---

## COMMAND PLAN

### Phase 1: Scaffold Structure

```bash
# Create directories
mkdir -p /home/runner/work/Project-AtlasIT/Project-AtlasIT/workers/jml
mkdir -p /home/runner/work/Project-AtlasIT/Project-AtlasIT/tests/jml
mkdir -p /home/runner/work/Project-AtlasIT/Project-AtlasIT/artifacts/jml/mover

# Create placeholder files
touch /home/runner/work/Project-AtlasIT/Project-AtlasIT/workers/jml/mover.ts
touch /home/runner/work/Project-AtlasIT/Project-AtlasIT/tests/jml/mover.test.ts
touch /home/runner/work/Project-AtlasIT/Project-AtlasIT/artifacts/jml/mover/.gitkeep
```

### Phase 2: Implement Mover Worker

**File: `/workers/jml/mover.ts`**

Structure:

```typescript
export interface RoleChange {
  previous: { department: string; title: string; manager?: string };
  new: { department: string; title: string; manager?: string };
  effectiveDate: string;
}

export interface EntitlementChanges {
  add: string[];
  remove: string[];
  retain: string[];
}

export interface MoverEvidence {
  trace_id: string;
  timestamp: string;
  user_id: string;
  delta_summary: {
    department: { from: string; to: string };
    title: { from: string; to: string };
    manager?: { from: string; to: string };
  };
  entitlement_changes: EntitlementChanges;
  control_ids: string[];
  status: "completed" | "failed" | "partial";
}

export class MoverWorker {
  detectAttributeDeltas(previous, newRole): delta;
  calculateEntitlementChanges(previous, target): EntitlementChanges;
  applyRoleChange(user, newRole, connectors): Promise<result>;
  reconcileEntitlements(user, changes, connectors): Promise<result>;
  enforcePolicy(user, newRole, policy): violations[];
  emitEvidence(traceId, delta, result): Promise<string>;
}
```

### Phase 3: Extend JML Engine Orchestration

**Update: `/index.js` (JMLEngine class)**

Extend `handleEnqueue` method to recognize `type: "mover"` and execute steps:

1. `validate-profile` - Confirm user exists
2. `apply-role-change` - Update IdP attributes
3. `reconcile-entitlements` - Add/remove access
4. `notify-stakeholders` - Send notifications

Store history with step results as shown in existing test expectations.

### Phase 4: Create Tests

**File: `/tests/jml/mover.test.ts`**

Test cases:

1. Detect department change delta
2. Calculate entitlement add/remove
3. Apply role change to mocked Okta
4. Reconcile entitlements (add Clari, Mode; retain Okta, Salesforce; remove Gong)
5. Emit evidence JSON with correct schema
6. Handle failures and DLQ
7. Verify MFA compliance after role change

### Phase 5: Generate Evidence

Run mover flow with fixture and generate:

- `/artifacts/jml/mover/EV-mover-<uuid>.json`
- `/artifacts/jml/mover/EV-mover-local.json` (for verification)

### Phase 6: Update Documentation

**Update: `/docs/JML_ENGINE.md`**

Add after line 56 (before "Security" section):

```markdown
## Mover Flow

The Mover flow handles user role transitions (department, title, manager changes).

### Steps

1. **validate-profile**: Confirm user exists and fetch current attributes
2. **apply-role-change**: Update IdP with new department/title/manager
3. **reconcile-entitlements**:
   - Remove entitlements no longer needed (based on previous department)
   - Add entitlements required for new role
   - Verify MFA compliance continues
4. **notify-stakeholders**: Email/Slack notifications to new manager and IT ops

### Evidence Schema

Each mover run emits:

- `trace_id`: Unique run identifier
- `timestamp`: ISO 8601 run start time
- `delta_summary`: Object showing attribute changes
- `entitlement_changes`: {add, remove, retain} arrays
- `control_ids`: Array of compliance controls validated (e.g., ["AC-2", "AC-6"])
- `status`: "completed" | "failed" | "partial"

Stored at: `/artifacts/jml/mover/EV-mover-<trace_id>.json`
```

### Phase 7: Create Completion Marker

```bash
echo "PR-JML-004 Mover Flow Implementation - Completed $(date -u +%Y-%m-%dT%H:%M:%SZ)" > .codex.done
```

---

## TEST PLAN

### Unit Tests (via Cursor)

```bash
# Run mover-specific tests
npx vitest run tests/jml/mover.test.ts

# Expected: All tests pass
```

### Integration Test (JML Engine)

```bash
# Run existing JML engine test which already includes mover validation
npx vitest run tests/jml-engine.test.ts

# Expected: Line 81-94 test "applies mover role change..." passes
```

### Local Evidence Validation

```bash
# Verify evidence file created
ls -la artifacts/jml/mover/

# Validate JSON schema
cat artifacts/jml/mover/EV-mover-local.json | jq .

# Expected fields: trace_id, timestamp, delta_summary, control_ids, status
```

### Full Test Suite

```bash
npm run test:unit

# Expected: All tests pass, including new mover tests
```

---

## EVIDENCE EXPECTED

### Artifacts Created

1. **`/artifacts/jml/mover/EV-mover-<trace_id>.json`**
   - Generated during test run
   - Contains full mover execution evidence
   - Schema matches MoverEvidence interface

2. **`/artifacts/jml/mover/EV-mover-local.json`**
   - Local verification copy
   - Can be committed for reference
   - Shows example of successful mover run

### Example Evidence Structure

```json
{
  "trace_id": "mover-run-550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2025-11-05T12:00:00Z",
  "user_id": "user-move-002",
  "delta_summary": {
    "department": {
      "from": "Customer Success",
      "to": "Revenue Operations"
    },
    "title": {
      "from": "Account Manager",
      "to": "Revenue Ops Manager"
    }
  },
  "entitlement_changes": {
    "add": ["clari", "mode"],
    "remove": ["gong"],
    "retain": ["okta", "salesforce"]
  },
  "control_ids": ["AC-2", "AC-6", "IA-2"],
  "status": "completed"
}
```

### Completion Marker

**`.codex.done`** file at project root:

```
PR-JML-004 Mover Flow Implementation - Completed 2025-11-05T12:00:00Z
```

---

## DELEGATION NOTES

### Agent: Codegen

**Task**: Implement `/workers/jml/mover.ts` and extend `/index.js`

1. Create MoverWorker class with all methods
2. Implement attribute delta detection logic
3. Integrate with JMLEngine.handleEnqueue for type="mover"
4. Ensure evidence emission to correct path

**Acceptance**:

- `workers/jml/mover.ts` exists and exports MoverWorker
- JMLEngine handles mover type
- Code is type-safe and follows existing patterns

### Agent: Cursor

**Task**: Validate implementation and create tests

1. Create comprehensive test suite at `/tests/jml/mover.test.ts`
2. Run all tests and verify they pass
3. Generate local evidence file
4. Validate evidence schema matches specification

**Acceptance**:

- All tests pass (unit + integration)
- Evidence files created in `/artifacts/jml/mover/`
- `.codex.done` marker committed

---

## ACCEPTANCE CRITERIA CHECKLIST

- [ ] `/workers/jml/mover.ts` created with MoverWorker class
- [ ] JMLEngine in `index.js` handles mover flow (type="mover")
- [ ] Attribute delta detection implemented
- [ ] Entitlement reconciliation logic (add/remove/retain)
- [ ] Policy enforcement (MFA, access removal)
- [ ] Evidence emission to `/artifacts/jml/mover/EV-mover-<trace_id>.json`
- [ ] `/tests/jml/mover.test.ts` created with comprehensive tests
- [ ] Existing test at `tests/jml-engine.test.ts:81-94` still passes
- [ ] Documentation updated in `/docs/JML_ENGINE.md` with Mover section
- [ ] Local evidence file created: `EV-mover-local.json`
- [ ] `.codex.done` marker file created
- [ ] All tests pass: `npm run test:unit`
- [ ] CI tests pass
- [ ] CodeQL security scan passes

---

## REFERENCES

- **PR-JML-001**: Joiner baseline (implemented)
- **Fixture**: `fixtures/jml/mover.json` (already exists)
- **Existing Test**: `tests/jml-engine.test.ts` lines 81-94
- **JML Engine Docs**: `docs/JML_ENGINE.md`
- **AtlasIT Roadmap**: Phase 4 - Directory & Lifecycle (JML)

---

## NEXT STEPS

Once this hand-off is reviewed:

1. **Copilot** posts confirmation comment:
   > ✅ ops/hand-off-mover.md ready for execution
2. **Create sub-issues** (manual or via workflow):
   - `[AUTO] Codegen — Execute PR-JML-004 (Mover flow)`
   - `[AUTO] Cursor — Validate PR-JML-004 (Mover flow)`

3. **Post delegation comment**:

   ```
   @codegen begin execution per ops/hand-off-mover.md.
   @cursor standby for validation once Codegen tags @copilot.
   ```

4. **Merge PR** once all acceptance criteria met and CI passes.

---

**End of Hand-off Document**
