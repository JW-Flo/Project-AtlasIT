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

export function defineAppJml(appId, category) {
  const base = CATEGORY_BASE[category] || {
    joiner: ["provision_account", "assign_baseline_access", "notify_manager"],
    mover: ["reconcile_entitlements", "update_role_access", "notify_manager"],
    leaver: ["suspend_account", "revoke_access", "archive_audit_event"],
  };
  const byIdp = {};
  for (const idp of IDP_SOURCES) {
    const overlay = IDP_OVERLAYS[idp];
    byIdp[idp] = {
      joiner: unique([...overlay.joiner, ...base.joiner]),
      mover: unique([...overlay.mover, ...base.mover]),
      leaver: unique([...overlay.leaver, ...base.leaver]),
    };
  }
  return {
    appId,
    category,
    connector: {
      integrationId: appId,
      slug: `${appId}-connector`,
      mode: "planned",
      joinerWorkflowFile: `shared/integrations/jml/workflows/${appId}/joiner.workflow.yaml`,
    },
    workflows: byIdp,
  };
}
