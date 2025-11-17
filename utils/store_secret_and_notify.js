#!/usr/bin/env node

// DEPRECATED: This utility previously used a 1Password service-account token
// (OP_SERVICE_ACCOUNT_TOKEN) to create items programmatically. That pattern has
// been removed from the repository in favor of 1Password Connect / OIDC flows.
//
// This file is intentionally left as a non-operative stub to avoid accidental
// execution. If you need to implement automation that writes into 1Password,
// prefer one of the following safer approaches:
//  - 1Password Connect server (OP_CONNECT_HOST + op_atlas_it_connect_server_pat)
//  - An OIDC exchange flow that returns a short-lived token per-run
//
// For audit traceability, this stub remains in the tree. Do NOT reintroduce
// OP_SERVICE_ACCOUNT_TOKEN or direct service-account automation in new code.

console.error(
  "ERROR: utils/store_secret_and_notify.js is deprecated and disabled.",
);
console.error(
  "Use 1Password Connect or OIDC flows instead. See ops/secrets/ for guidance.",
);
process.exit(2);
