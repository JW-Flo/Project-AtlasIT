import type { RuleTemplate } from "./types";

/** Predefined automation rule templates for common tenant scenarios */
export const ruleTemplates: RuleTemplate[] = [
  {
    id: "auto-provision-on-group-join",
    name: "Auto-provision app on group join",
    description: "Automatically grant app access when a user joins a mapped directory group",
    category: "provisioning",
    triggerType: "user_joined_group",
    triggerConfig: {},
    conditions: [],
    actions: [
      {
        type: "provision_app_access",
        config: { useGroupMapping: true },
        order: 1,
      },
      {
        type: "send_notification",
        config: {
          channel: "slack",
          template: "user_provisioned",
          notifyUser: true,
        },
        order: 2,
      },
    ],
  },
  {
    id: "auto-revoke-on-group-leave",
    name: "Auto-revoke app on group leave",
    description: "Automatically revoke app access when a user leaves a mapped directory group",
    category: "provisioning",
    triggerType: "user_left_group",
    triggerConfig: {},
    conditions: [],
    actions: [
      {
        type: "revoke_app_access",
        config: { useGroupMapping: true },
        order: 1,
      },
      {
        type: "send_notification",
        config: {
          channel: "slack",
          template: "user_deprovisioned",
          notifyAdmin: true,
        },
        order: 2,
      },
    ],
  },
  {
    id: "offboard-user-on-deactivation",
    name: "Full offboarding on user deactivation",
    description:
      "Run leaver workflow across all connected apps when a user is deactivated in the directory",
    category: "lifecycle",
    triggerType: "user_deactivated",
    triggerConfig: {},
    conditions: [],
    actions: [
      {
        type: "run_workflow",
        config: { workflowType: "leaver", scope: "all_connected_apps" },
        order: 1,
      },
      {
        type: "send_notification",
        config: {
          channel: "ops",
          message: "User offboarded: {{email}}",
        },
        order: 2,
      },
    ],
  },
  {
    id: "onboard-new-user",
    name: "Auto-onboard new directory user",
    description:
      "Run joiner workflow to provision all mapped apps when a new user appears in directory sync",
    category: "lifecycle",
    triggerType: "user_created",
    triggerConfig: {},
    conditions: [],
    actions: [
      {
        type: "run_workflow",
        config: { workflowType: "joiner", scope: "mapped_apps" },
        order: 1,
      },
      {
        type: "send_notification",
        config: {
          channel: "slack",
          template: "new_user_onboarded",
          notifyAdmin: true,
          notifyUser: true,
        },
        order: 2,
      },
    ],
  },
  {
    id: "health-degradation-alert",
    name: "Alert on app health degradation",
    description: "Create an incident and notify admins when a connected app becomes unhealthy",
    category: "security",
    triggerType: "app_health_changed",
    triggerConfig: {},
    conditions: [{ field: "healthy", operator: "equals", value: "false" }],
    actions: [
      {
        type: "create_incident",
        config: {
          severity: "medium",
          title: "App unhealthy: {{app.name}}",
        },
        order: 1,
      },
      {
        type: "send_notification",
        config: {
          channel: "slack",
          template: "app_health_alert",
          notifyAdmin: true,
        },
        order: 2,
      },
    ],
  },
  {
    id: "compliance-score-drop",
    name: "Alert on compliance score drop",
    description: "Notify when a compliance framework score drops below threshold",
    category: "compliance",
    triggerType: "compliance_score_changed",
    triggerConfig: { threshold: 70, direction: "below" },
    conditions: [],
    actions: [
      {
        type: "create_incident",
        config: {
          severity: "high",
          title: "Compliance score dropped: {{framework}} at {{score}}%",
        },
        order: 1,
      },
      {
        type: "send_notification",
        config: {
          channel: "slack",
          template: "compliance_alert",
          notifyAdmin: true,
        },
        order: 2,
      },
    ],
  },
  {
    id: "sync-directory-on-app-connect",
    name: "Sync directory after app connection",
    description:
      "Trigger a directory sync whenever a new app is connected to ensure user mappings are current",
    category: "provisioning",
    triggerType: "app_connected",
    triggerConfig: {},
    conditions: [],
    actions: [
      {
        type: "sync_directory",
        config: {},
        order: 1,
      },
    ],
  },
];
