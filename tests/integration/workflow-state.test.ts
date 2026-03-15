import { describe, it, expect } from "vitest";
import {
  VALID_TRANSITIONS,
  type WorkflowStatus,
  type WorkflowDefinition,
  type WorkflowState,
  type StepResult,
  type WorkflowStep,
} from "../../ai-orchestrator/src/workflow/types";

describe("Workflow state machine", () => {
  describe("VALID_TRANSITIONS", () => {
    it("allows CREATED -> RUNNING", () => {
      expect(VALID_TRANSITIONS.CREATED).toContain("RUNNING");
    });

    it("allows RUNNING -> COMPLETED", () => {
      expect(VALID_TRANSITIONS.RUNNING).toContain("COMPLETED");
    });

    it("allows RUNNING -> FAILED", () => {
      expect(VALID_TRANSITIONS.RUNNING).toContain("FAILED");
    });

    it("allows RUNNING -> TIMED_OUT", () => {
      expect(VALID_TRANSITIONS.RUNNING).toContain("TIMED_OUT");
    });

    it("allows RUNNING -> WAITING", () => {
      expect(VALID_TRANSITIONS.RUNNING).toContain("WAITING");
    });

    it("allows WAITING -> RUNNING", () => {
      expect(VALID_TRANSITIONS.WAITING).toContain("RUNNING");
    });

    it("allows WAITING -> COMPLETED", () => {
      expect(VALID_TRANSITIONS.WAITING).toContain("COMPLETED");
    });

    it("blocks COMPLETED -> RUNNING (terminal state)", () => {
      expect(VALID_TRANSITIONS.COMPLETED).not.toContain("RUNNING");
      expect(VALID_TRANSITIONS.COMPLETED).toHaveLength(0);
    });

    it("blocks FAILED -> RUNNING (terminal state)", () => {
      expect(VALID_TRANSITIONS.FAILED).not.toContain("RUNNING");
      expect(VALID_TRANSITIONS.FAILED).toHaveLength(0);
    });

    it("blocks TIMED_OUT -> any (terminal state)", () => {
      expect(VALID_TRANSITIONS.TIMED_OUT).toHaveLength(0);
    });

    it("CREATED only allows RUNNING as next state", () => {
      expect(VALID_TRANSITIONS.CREATED).toEqual(["RUNNING"]);
    });
  });

  describe("WorkflowDefinition types compile correctly", () => {
    it("accepts a valid workflow definition", () => {
      const step: WorkflowStep = {
        id: "step-1",
        name: "Provision User",
        handler: "provision-user",
        timeoutMs: 30000,
        retryConfig: { maxRetries: 2, backoffMs: 1000 },
        compensate: "deprovision-user",
      };

      const definition: WorkflowDefinition = {
        id: "wf-onboard",
        name: "Employee Onboarding",
        steps: [step],
        globalTimeoutMs: 300000,
        onFailure: [
          {
            id: "compensate-1",
            name: "Deprovision User",
            handler: "deprovision-user",
            timeoutMs: 30000,
          },
        ],
      };

      expect(definition.id).toBe("wf-onboard");
      expect(definition.steps).toHaveLength(1);
      expect(definition.steps[0].retryConfig?.maxRetries).toBe(2);
      expect(definition.onFailure).toHaveLength(1);
    });

    it("accepts a valid workflow state", () => {
      const stepResult: StepResult = {
        stepId: "step-1",
        status: "completed",
        output: { userId: "u-1" },
        attempts: 1,
        startedAt: "2026-03-15T00:00:00Z",
        completedAt: "2026-03-15T00:01:00Z",
      };

      const state: WorkflowState = {
        definitionId: "wf-onboard",
        definitionName: "Employee Onboarding",
        status: "COMPLETED",
        currentStepIndex: 1,
        stepResults: { "step-1": stepResult },
        context: { userId: "u-1" },
        tenantId: "tenant-1",
        correlationId: "corr-1",
        startedAt: "2026-03-15T00:00:00Z",
        updatedAt: "2026-03-15T00:01:00Z",
        completedAt: "2026-03-15T00:01:00Z",
      };

      expect(state.status).toBe("COMPLETED");
      expect(state.stepResults["step-1"].status).toBe("completed");
    });

    it("accepts step result in all valid statuses", () => {
      const statuses: StepResult["status"][] = [
        "pending",
        "running",
        "completed",
        "failed",
        "skipped",
      ];
      for (const status of statuses) {
        const result: StepResult = {
          stepId: "step-1",
          status,
          attempts: 0,
        };
        expect(result.status).toBe(status);
      }
    });

    it("accepts all valid workflow statuses", () => {
      const statuses: WorkflowStatus[] = [
        "CREATED",
        "RUNNING",
        "WAITING",
        "COMPLETED",
        "FAILED",
        "TIMED_OUT",
      ];
      for (const status of statuses) {
        expect(VALID_TRANSITIONS).toHaveProperty(status);
      }
    });
  });

  describe("transition validation helper", () => {
    function isValidTransition(
      from: WorkflowStatus,
      to: WorkflowStatus,
    ): boolean {
      return VALID_TRANSITIONS[from].includes(to);
    }

    it("validates the full happy path: CREATED -> RUNNING -> COMPLETED", () => {
      expect(isValidTransition("CREATED", "RUNNING")).toBe(true);
      expect(isValidTransition("RUNNING", "COMPLETED")).toBe(true);
    });

    it("validates the failure path: CREATED -> RUNNING -> FAILED", () => {
      expect(isValidTransition("CREATED", "RUNNING")).toBe(true);
      expect(isValidTransition("RUNNING", "FAILED")).toBe(true);
    });

    it("validates the timeout path: CREATED -> RUNNING -> TIMED_OUT", () => {
      expect(isValidTransition("CREATED", "RUNNING")).toBe(true);
      expect(isValidTransition("RUNNING", "TIMED_OUT")).toBe(true);
    });

    it("validates waiting path: RUNNING -> WAITING -> RUNNING -> COMPLETED", () => {
      expect(isValidTransition("RUNNING", "WAITING")).toBe(true);
      expect(isValidTransition("WAITING", "RUNNING")).toBe(true);
      expect(isValidTransition("RUNNING", "COMPLETED")).toBe(true);
    });

    it("rejects invalid transitions from terminal states", () => {
      const terminalStates: WorkflowStatus[] = [
        "COMPLETED",
        "FAILED",
        "TIMED_OUT",
      ];
      const allStates: WorkflowStatus[] = [
        "CREATED",
        "RUNNING",
        "WAITING",
        "COMPLETED",
        "FAILED",
        "TIMED_OUT",
      ];

      for (const terminal of terminalStates) {
        for (const target of allStates) {
          expect(isValidTransition(terminal, target)).toBe(false);
        }
      }
    });
  });
});
