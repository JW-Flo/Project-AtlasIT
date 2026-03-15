import type { ConnectorManifest } from "../../../connector-schema/src/manifest.js";

function generateSecretComments(manifest: ConnectorManifest): string {
  const secrets: string[] = [];

  secrets.push("# ADAPTER_SECRET - HMAC secret for webhook verification");

  if (manifest.auth.model === "oauth2") {
    secrets.push(`# ${manifest.auth.oauth2.clientIdEnvVar} - OAuth2 client ID`);
    secrets.push(
      `# ${manifest.auth.oauth2.clientSecretEnvVar} - OAuth2 client secret`,
    );
  } else if (manifest.auth.model === "api_key") {
    secrets.push(
      `# ${manifest.auth.apiKey.envVar} - API key for ${manifest.provider}`,
    );
  } else if (manifest.auth.model === "service_account") {
    secrets.push(
      "# SERVICE_ACCOUNT_CREDENTIALS - Service account credentials JSON",
    );
  }

  for (const field of manifest.configFields) {
    if (field.type === "secret") {
      secrets.push(`# ${field.key.toUpperCase()} - ${field.description}`);
    }
  }

  return secrets.join("\n");
}

function generateVars(manifest: ConnectorManifest): string {
  const vars: string[] = [];
  vars.push(`ADAPTER_NAME = "${manifest.slug}"`);
  vars.push(`ORCHESTRATOR_URL = "https://orchestrator.atlasit.pro"`);

  if (manifest.auth.model === "oauth2") {
    vars.push(
      `OAUTH2_REDIRECT_URI = "https://adapter-${manifest.slug}.atlasit.pro/auth/callback"`,
    );
  }

  return vars.join("\n");
}

function generateRateLimitComment(manifest: ConnectorManifest): string {
  if (!manifest.rateLimit) return "";

  const lines: string[] = [
    "",
    `# Rate limit: ${manifest.rateLimit.requestsPerSecond} req/s`,
  ];
  if (manifest.rateLimit.burstSize) {
    lines.push(`# Burst size: ${manifest.rateLimit.burstSize}`);
  }

  return lines.join("\n");
}

export function generateWranglerTemplate(manifest: ConnectorManifest): string {
  const secretComments = generateSecretComments(manifest);
  const vars = generateVars(manifest);
  const rateLimitComment = generateRateLimitComment(manifest);

  return `name = "atlasit-adapter-${manifest.slug}"
main = "src/index.ts"
compatibility_date = "2024-03-20"
compatibility_flags = ["nodejs_compat"]
workers_dev = true

[vars]
${vars}

# Secrets (set via wrangler secret put):
${secretComments}

[[d1_databases]]
binding = "DB"
database_name = "atlas-shared-db"
database_id = "" # Set per environment

[observability.logs]
enabled = true
${rateLimitComment}
`;
}
