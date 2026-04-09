const CATEGORY_BASE = {
  productivity: {
    joiner: [
      "provision_account",
      "assign_team_groups",
      "configure_default_channels",
    ],
    mover: [
      "reconcile_group_membership",
      "apply_role_mapping",
      "validate_data_access",
    ],
    leaver: ["disable_sign_in", "transfer_owned_assets", "remove_memberships"],
  },
  hr: {
    joiner: [
      "create_hr_profile",
      "assign-hr-workflows",
      "link-manager-hierarchy",
    ],
    mover: [
      "update-org-structure",
      "reconcile-sensitive-record-access",
      "update-approval-matrix",
    ],
    leaver: [
      "disable_hr_profile",
      "revoke-sensitive-access",
      "archive-employment-record",
    ],
  },
  finance: {
    joiner: [
      "provision_finance_user",
      "assign_cost-center-scopes",
      "enable-spend-controls",
    ],
    mover: [
      "reconcile_cost-center-ownership",
      "update-approval-limits",
      "validate-separation-of-duties",
    ],
    leaver: [
      "disable_finance_user",
      "revoke-payment-access",
      "freeze-approval-workflows",
    ],
  },
  security: {
    joiner: [
      "create_identity_profile",
      "enforce_mfa",
      "register_security_baseline",
    ],
    mover: [
      "revalidate_privileged_access",
      "rotate_access_tokens",
      "reconcile_policy_scope",
    ],
    leaver: ["deactivate_identity", "revoke_sessions", "archive_access_audit"],
  },
  infrastructure: {
    joiner: [
      "create_iam_principal",
      "attach_least_privilege_policy",
      "enable_audit_logging",
    ],
    mover: [
      "replace_policy_bindings",
      "recompute_access_boundaries",
      "verify_admin_assignments",
    ],
    leaver: [
      "disable_iam_principal",
      "revoke_long_lived_keys",
      "remove_group_bindings",
    ],
  },
  communication: {
    joiner: [
      "provision_communication_profile",
      "assign-channel-baseline",
      "enable-retention-policy",
    ],
    mover: [
      "reconcile-channel-permissions",
      "update-role-groups",
      "verify-external-collab-rules",
    ],
    leaver: [
      "disable-communication-login",
      "remove-channel-access",
      "transfer-owned-resources",
    ],
  },
};

const IDP_OVERLAYS = {
  okta: {
    joiner: ["sync_okta_user", "apply_okta_group_rules"],
    mover: ["recompute_okta_group_rules"],
    leaver: ["suspend_okta_user"],
  },
  google_workspace: {
    joiner: ["sync_google_directory_user", "apply_google_org_unit"],
    mover: ["update_google_org_unit"],
    leaver: ["suspend_google_workspace_user"],
  },
  active_directory: {
    joiner: ["create_ad_user", "assign_ad_groups"],
    mover: ["reconcile_ad_groups", "update_ad_ou"],
    leaver: ["disable_ad_user", "expire_ad_sessions"],
  },
  entra_id: {
    joiner: ["create_entra_identity", "assign_entra_groups"],
    mover: ["reconcile_entra_groups"],
    leaver: ["disable_entra_identity", "revoke_entra_tokens"],
  },
};

const IDP_SOURCES = Object.keys(IDP_OVERLAYS);

function unique(list) {
  return list.filter((item, idx) => list.indexOf(item) === idx);
}

// Per-app step overrides for adapters with real provisioning capabilities
const APP_STEPS = {
  okta: {
    joiner: ["resolve_access_bundle", "create_okta_user", "assign_groups", "enforce_mfa", "emit_evidence", "update_compliance"],
    mover: ["resolve_new_access", "recompute_group_rules", "reconcile_app_assignments", "emit_evidence", "update_compliance"],
    leaver: ["suspend_okta_user", "revoke_active_sessions", "remove_group_memberships", "emit_evidence", "update_compliance"],
  },
  google_workspace: {
    joiner: ["resolve_access_bundle", "create_workspace_user", "assign_org_unit", "provision_apps", "configure_email", "enforce_mfa", "emit_evidence", "update_compliance"],
    mover: ["update_org_unit", "reconcile_group_membership", "update_shared_drives", "emit_evidence", "update_compliance"],
    leaver: ["suspend_workspace_user", "transfer_drive_ownership", "revoke_app_passwords", "remove_group_access", "emit_evidence"],
  },
  slack: {
    joiner: ["resolve_access_bundle", "invite_to_workspace", "assign_channels", "set_profile", "provision_enterprise_grid", "enforce_mfa", "emit_evidence", "update_compliance"],
    mover: ["reconcile_channel_access", "update_user_groups", "reassign_workspaces", "emit_evidence"],
    leaver: ["deactivate_user", "remove_from_channels", "revoke_tokens", "emit_evidence"],
  },
  github: {
    joiner: ["resolve_access_bundle", "invite_to_org", "assign_teams", "set_repo_access", "enable_sso", "emit_evidence"],
    mover: ["reconcile_team_membership", "update_repo_permissions", "emit_evidence"],
    leaver: ["remove_from_org", "revoke_pat_tokens", "transfer_repos", "emit_evidence"],
  },
  microsoft_365: {
    joiner: ["resolve_access_bundle", "enable_sign_in", "assign_licenses", "configure_mailbox", "assign_groups", "enforce_mfa", "emit_evidence"],
    mover: ["update_license_assignments", "reconcile_group_membership", "update_mailbox_delegation", "emit_evidence"],
    leaver: ["block_sign_in", "revoke_sessions", "convert_to_shared_mailbox", "remove_licenses", "emit_evidence"],
  },
  aws: {
    joiner: ["resolve_access_bundle", "create_iam_user", "attach_policies", "enable_mfa", "configure_console_access", "emit_evidence"],
    mover: ["recompute_policy_bindings", "update_permission_boundaries", "rotate_access_keys", "emit_evidence"],
    leaver: ["delete_access_keys", "remove_policies", "remove_group_memberships", "delete_iam_user", "emit_evidence"],
  },
  zscaler: {
    joiner: ["resolve_access_bundle", "create_zidentity_user", "assign_security_policies", "configure_ztna_access", "emit_evidence"],
    mover: ["update_policy_assignments", "reconcile_app_segments", "emit_evidence"],
    leaver: ["deactivate_user", "revoke_ztna_sessions", "remove_policy_bindings", "emit_evidence"],
  },
};

export function defineAppJml(appId, category, overrides) {
  // Use per-app real steps if available
  const appSteps = APP_STEPS[appId] || overrides?.steps;

  const base = CATEGORY_BASE[category] || {
    joiner: ["provision_account", "assign_baseline_access", "notify_manager"],
    mover: ["reconcile_entitlements", "update_role_access", "notify_manager"],
    leaver: ["suspend_account", "revoke_access", "archive_audit_event"],
  };
  const byIdp = {};
  for (const idp of IDP_SOURCES) {
    const overlay = IDP_OVERLAYS[idp];
    if (appSteps) {
      // Real adapter steps — no need for IDP overlay merge
      byIdp[idp] = {
        joiner: appSteps.joiner,
        mover: appSteps.mover,
        leaver: appSteps.leaver,
      };
    } else {
      byIdp[idp] = {
        joiner: unique([...overlay.joiner, ...base.joiner]),
        mover: unique([...overlay.mover, ...base.mover]),
        leaver: unique([...overlay.leaver, ...base.leaver]),
      };
    }
  }
  return {
    appId,
    category,
    connector: {
      integrationId: appId,
      slug: `${appId}-connector`,
      mode: appSteps ? "active" : "planned",
      joinerWorkflowFile: `shared/integrations/jml/workflows/${appId}/joiner.workflow.yaml`,
    },
    workflows: byIdp,
  };
}
