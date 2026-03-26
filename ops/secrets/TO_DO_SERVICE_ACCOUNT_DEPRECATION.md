# Service-account deprecation checklist

This file lists the steps required to fully remove the legacy service-account automation pattern (OP_SERVICE_ACCOUNT_TOKEN) and migrate to Connect/OIDC safely. Keep this as an operational TODO and follow the rotation window before removing the legacy artifacts.

1. Inventory
   - Search for `OP_SERVICE_ACCOUNT_TOKEN` references across the repo and note usage locations.
   - Identify any external tooling or scripts (cron jobs, admins) relying on the service account.

2. Prepare replacement
   - Provision a Connect token `op_atlas_it_connect_server_pat` with appropriate scope.
   - Provide an OIDC exchange endpoint (ops/oidc example) if you prefer short-lived tokens.

3. Migrate
   - Update CI workflows to use Connect or OIDC templates (`.github/workflows/1password-secrets.yml`).
   - Replace any direct `op` CLI usage in automation with `1Password/load-secrets-action@v3` and Connect tokens.

4. Validation
   - Run non-live validator `ci/validate-1password-mappings.sh` in CI.
   - Optionally run `live-fetch` connect checks in a controlled staging workflow.

5. Revoke and remove
   - Revoke and delete the `OP_SERVICE_ACCOUNT_TOKEN` secret and any tokens still in the wild.
   - Remove or deprecate helper scripts (e.g., `utils/store_secret_and_notify.js`) — ensure they are disabled prior to deletion.

6. Audit
   - Record the changes in `ops/.codex.done` and update `artifacts/EV-*.json` evidence record.

7. Post-cleanup
   - Monitor health-checks and alerts for a week to ensure no breakage.

\*\*\* End of checklist
