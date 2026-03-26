/**
 * Re-export from shared package.
 * The NL automation builder lives in @atlasit/shared so both
 * ai-orchestrator and console-app can use it.
 */
export {
  buildAutomationFromNL,
  type NLBuildRequest,
  type NLBuildResult,
  type CompliancePreview,
} from "@atlasit/shared";
