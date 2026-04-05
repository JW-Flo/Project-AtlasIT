import joinerTemplate from "../../../../tests/fixtures/jml/joiner.json";
import moverTemplate from "../../../../tests/fixtures/jml/mover.json";
import leaverTemplate from "../../../../tests/fixtures/jml/leaver.json";

export type WorkflowType = "joiner" | "mover" | "leaver";

export interface WorkflowTemplate {
  type: WorkflowType;
  [key: string]: unknown;
}

const TEMPLATE_MAP: Record<WorkflowType, WorkflowTemplate> = {
  joiner: joinerTemplate as WorkflowTemplate,
  mover: moverTemplate as WorkflowTemplate,
  leaver: leaverTemplate as WorkflowTemplate,
};

function cloneTemplate(template: WorkflowTemplate): WorkflowTemplate {
  if (typeof structuredClone === "function") {
    return structuredClone(template);
  }
  return JSON.parse(JSON.stringify(template)) as WorkflowTemplate;
}

export function listTemplates(): WorkflowTemplate[] {
  return Object.values(TEMPLATE_MAP).map(cloneTemplate);
}

export function getTemplate(type: WorkflowType): WorkflowTemplate {
  const template = TEMPLATE_MAP[type];
  if (!template) {
    throw new Error(`Unknown workflow template: ${type}`);
  }
  return cloneTemplate(template);
}
