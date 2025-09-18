import { StaticIdpAdapter } from "./static-adapter.js";
import { IdpAdapter } from "../types.js";

export function createOktaAdapter(): IdpAdapter {
  return new StaticIdpAdapter({
    kind: "okta",
    name: "Okta Preview Sandbox",
    version: "0.1.0",
    defaultAudience: "atlasit-okta",
    users: [
      {
        id: "okta-user-1",
        email: "casey.snow@okta.example",
        displayName: "Casey Snow",
        status: "active",
        attributes: { department: "Engineering" },
      },
      {
        id: "okta-user-2",
        email: "mia.chan@okta.example",
        displayName: "Mia Chan",
        status: "inactive",
        attributes: { department: "Finance" },
      },
    ],
    groups: [
      {
        id: "okta-group-ops",
        name: "Okta Ops",
        description: "Operations administrators",
        members: ["okta-user-1"],
      },
    ],
  });
}

export function createEntraAdapter(): IdpAdapter {
  return new StaticIdpAdapter({
    kind: "entra",
    name: "Microsoft Entra Dev",
    defaultAudience: "atlasit-entra",
    users: [
      {
        id: "entra-user-1",
        email: "olivia.huang@entra.example",
        displayName: "Olivia Huang",
        status: "active",
        attributes: { license: "E5" },
      },
    ],
    groups: [
      {
        id: "entra-group-sec",
        name: "Security Admins",
        members: ["entra-user-1"],
      },
    ],
  });
}

export function createGoogleWorkspaceAdapter(): IdpAdapter {
  return new StaticIdpAdapter({
    kind: "google-workspace",
    name: "Google Workspace QA",
    defaultAudience: "atlasit-google",
    users: [
      {
        id: "google-user-1",
        email: "riley.morgan@workspace.example",
        displayName: "Riley Morgan",
        status: "active",
        attributes: { orgUnit: "/Engineering" },
      },
    ],
    groups: [
      {
        id: "google-group-dev",
        name: "Developers",
        description: "Workspace developers",
        members: ["google-user-1"],
      },
    ],
  });
}

export function createAwsCognitoAdapter(): IdpAdapter {
  return new StaticIdpAdapter({
    kind: "aws-cognito",
    name: "AWS Cognito Sandbox",
    defaultAudience: "atlasit-cognito",
    users: [
      {
        id: "aws-user-1",
        email: "alex.jordan@cognito.example",
        displayName: "Alex Jordan",
        status: "active",
        attributes: { pool: "sandbox" },
      },
    ],
    groups: [
      {
        id: "aws-group-admin",
        name: "Cognito Admin",
        members: ["aws-user-1"],
      },
    ],
  });
}

export function createPaycomAdapter(): IdpAdapter {
  return new StaticIdpAdapter({
    kind: "paycom",
    name: "Paycom QA",
    defaultAudience: "atlasit-paycom",
    users: [
      {
        id: "paycom-user-1",
        email: "harper.wright@paycom.example",
        displayName: "Harper Wright",
        status: "active",
        attributes: { region: "NA" },
      },
    ],
    groups: [
      {
        id: "paycom-group-hr",
        name: "Paycom HR",
        members: ["paycom-user-1"],
      },
    ],
  });
}

export function createCrowdstrikeAdapter(): IdpAdapter {
  return new StaticIdpAdapter({
    kind: "crowdstrike",
    name: "CrowdStrike Falcon",
    defaultAudience: "atlasit-crowdstrike",
    users: [
      {
        id: "crowdstrike-user-1",
        email: "sam.taylor@crowdstrike.example",
        displayName: "Sam Taylor",
        status: "active",
        attributes: { role: "Responder" },
      },
    ],
    groups: [
      {
        id: "crowdstrike-group-ops",
        name: "Falcon Responders",
        members: ["crowdstrike-user-1"],
      },
    ],
  });
}
