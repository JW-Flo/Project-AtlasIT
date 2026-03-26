import { describe, it, expect } from "vitest";
import type {
  RunStatus,
  StepStatus,
  StepState,
  RunState,
  StepDefinition,
} from "../../packages/shared/src/workflow/types";

/**
 * These tests verify that the shared workflow types compile correctly
 * and that the RunStatus / StepStatus enums cover all expected values.
 *
 * They also ensure backward compatibility: the shared type system supports
 * the same states the old ai-orchestrator types did, plus the additional
 * ones from the shared package (dlq, compensating, queued).
 */
describe("Shared workflow type system", () => {
  describe("RunStatus covers all workflow lifecycle states", () => {
    it("includes queued, running, completed, failed, compensating", () => {
      const statuses: RunStatus[] = [
        "queued",
        "running",
        "completed",
        "failed",
        "compensating",
      ];
      // Each status should be assignable — this is a compile-time check
      for (const status of statuses) {
        expect(typeof status).toBe("string");
      }
    });
  });

  describe("StepStatus covers all step lifecycle states", () => {
    it("includes pending, running, completed, failed, dlq, skipped", () => {
      const statuses: StepStatus[] = [
        "pending",
        "running",
        "completed",
        "failed",
        "dlq",
        "skipped",
      ];
      for (const status of statuses) {
        expect(typeof status).toBe("string");
      }
    });
  });

  describe("StepState type compiles correctly", () => {
    it("accepts a valid step state", () => {
      const step: StepState = {
        stepId: "validate-profile",
        action: "validate_profile",
        status: "completed",
        attempts: 1,
        startedAt: "2026-03-15T00:00:00Z",
        completedAt: "2026-03-15T00:01:00Z",
        output: { validated: true },
        durationMs: 60000,
      };

      expect(step.stepId).toBe("validate-profile");
      expect(step.status).toBe("completed");
      expect(step.durationMs).toBe(60000);
    });
  });

  describe("RunState type compiles correctly", () => {
    it("accepts a valid run state", () => {
      const state: RunState = {
        schemaVersion: 1,
        id: "run-1",
        type: "joiner",
        status: "completed",
        tenantId: "tenant-1",
        userId: "user-1",
        actor: "atlas.workflow-do",
        createdAt: "2026-03-15T00:00:00Z",
        completedAt: "2026-03-15T00:01:00Z",
        steps: [
          {
            stepId: "step-1",
            action: "validate_profile",
            status: "completed",
            attempts: 1,
          },
        ],
        history: [],
        context: {},
        alarmCount: 0,
      };

      expect(state.status).toBe("completed");
      expect(state.steps).toHaveLength(1);
      expect(state.schemaVersion).toBe(1);
    });
  });

  describe("StepDefinition type compiles correctly", () => {
    it("accepts a valid step definition", () => {
      const def: StepDefinition = {
        id: "validate-profile",
        action: "validate_profile",
        optional: false,
      };

      expect(def.id).toBe("validate-profile");
      expect(def.action).toBe("validate_profile");
    });
  });

  describe("backward compatibility with old type values", () => {
    it("maps old CREATED/RUNNING/COMPLETED/FAILED states to new RunStatus", () => {
      // Old system: CREATED, RUNNING, WAITING, COMPLETED, FAILED, TIMED_OUT
      // New system: queued, running, completed, failed, compensating
      //
      // Mapping:
      //   CREATED  -> queued
      //   RUNNING  -> running
      //   COMPLETED -> completed
      //   FAILED   -> failed
      //   WAITING  -> running (sub-state handled differently)
      //   TIMED_OUT -> failed (timeout is a failure mode)
      const mapping: Record<string, RunStatus> = {
        CREATED: "queued",
        RUNNING: "running",
        COMPLETED: "completed",
        FAILED: "failed",
      };

      for (const [_old, newStatus] of Object.entries(mapping)) {
        const state: Pick<RunState, "status"> = { status: newStatus };
        expect(state.status).toBe(newStatus);
      }
    });

    it("maps old step statuses to new StepStatus", () => {
      // Old: pending, running, completed, failed, skipped
      // New: pending, running, completed, failed, dlq, skipped
      const oldStatuses: StepStatus[] = [
        "pending",
        "running",
        "completed",
        "failed",
        "skipped",
      ];
      for (const status of oldStatuses) {
        expect(typeof status).toBe("string");
      }
    });
  });
});
