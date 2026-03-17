/** Automation rules engine types for tenant environment management */
export type TriggerType = "user_joined_group" | "user_left_group" | "user_created" | "user_deactivated" | "app_connected" | "app_disconnected" | "app_health_changed" | "schedule" | "compliance_score_changed";
export type ActionType = "provision_app_access" | "revoke_app_access" | "assign_role" | "remove_role" | "send_notification" | "run_workflow" | "sync_directory" | "create_incident" | "update_compliance_status";
export type ConditionOperator = "equals" | "not_equals" | "contains" | "in" | "not_in" | "gt" | "lt";
export interface RuleCondition {
    field: string;
    operator: ConditionOperator;
    value: string | string[] | number;
}
export interface RuleAction {
    type: ActionType;
    config: Record<string, unknown>;
    /** Order of execution within the rule (lower runs first) */
    order: number;
}
export interface TriggerConfig {
    /** For group-based triggers */
    groupId?: string;
    groupName?: string;
    /** For app-based triggers */
    appId?: string;
    /** For schedule triggers (cron expression) */
    cronExpression?: string;
    /** For compliance triggers */
    framework?: string;
    threshold?: number;
    direction?: "above" | "below";
}
export interface AutomationRule {
    id: string;
    tenantId: string;
    name: string;
    description?: string;
    enabled: boolean;
    triggerType: TriggerType;
    triggerConfig: TriggerConfig;
    conditions: RuleCondition[];
    actions: RuleAction[];
    lastRunAt?: string;
    lastStatus?: "success" | "partial" | "failed";
    runCount: number;
    errorCount: number;
    createdAt: string;
    updatedAt: string;
    createdBy?: string;
}
export interface AutomationExecution {
    id: string;
    tenantId: string;
    ruleId: string;
    triggerEvent: Record<string, unknown>;
    status: "running" | "success" | "partial" | "failed";
    actionsRun: number;
    actionsFailed: number;
    results?: ActionResult[];
    durationMs?: number;
    startedAt: string;
    completedAt?: string;
}
export interface ActionResult {
    actionType: ActionType;
    status: "success" | "failed" | "skipped";
    message?: string;
    details?: Record<string, unknown>;
}
export interface AppHealthCheck {
    id: string;
    tenantId: string;
    appId: string;
    healthy: boolean;
    responseMs?: number;
    errorMsg?: string;
    details?: Record<string, unknown>;
    checkedAt: string;
}
export interface CreateRuleInput {
    name: string;
    description?: string;
    triggerType: TriggerType;
    triggerConfig: TriggerConfig;
    conditions?: RuleCondition[];
    actions: RuleAction[];
}
export interface UpdateRuleInput {
    name?: string;
    description?: string;
    enabled?: boolean;
    triggerConfig?: TriggerConfig;
    conditions?: RuleCondition[];
    actions?: RuleAction[];
}
export interface AutomationEvent {
    type: TriggerType;
    tenantId: string;
    payload: Record<string, unknown>;
    timestamp: string;
    source: string;
}
export interface CanonicalUserProfile {
    id: string;
    externalId: string;
    email: string;
    displayName: string;
    status: "active" | "suspended" | "inactive" | "pending";
    source: string;
    tenantId: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    department?: string;
    title?: string;
    manager?: string;
    employeeId?: string;
    location?: string;
    orgUnit?: string;
    groups: string[];
    appAccess: Array<{
        appId: string;
        role: string;
        groupId: string;
    }>;
    rawAttributes: Record<string, unknown>;
}
/** Predefined rule templates for common automation scenarios */
export interface RuleTemplate {
    id: string;
    name: string;
    description: string;
    category: "provisioning" | "security" | "compliance" | "lifecycle";
    triggerType: TriggerType;
    triggerConfig: TriggerConfig;
    conditions: RuleCondition[];
    actions: RuleAction[];
}
//# sourceMappingURL=types.d.ts.map