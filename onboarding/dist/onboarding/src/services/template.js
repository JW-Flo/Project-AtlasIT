export async function generateTemplate(config) {
  const templateId = `template-${Date.now()}`;
  const template = {
    id: templateId,
    name: `${config.industry} Configuration Template`,
    description: `Auto-generated template for ${config.industry} industry with ${config.integrations.length} integrations`,
    config,
    files: [],
  };
  // Generate configuration files
  template.files.push(generateMainConfig(config));
  template.files.push(generateSecurityConfig(config.security));
  template.files.push(generateIntegrationsConfig(config.integrations));
  template.files.push(generateWorkflowsConfig(config.workflows));
  template.files.push(generateDockerfile(config));
  template.files.push(generateReadme(config));
  return template;
}
function generateMainConfig(config) {
  const configContent = {
    version: "1.0.0",
    industry: config.industry,
    environment: "production",
    features: {
      integrations: config.integrations.length > 0,
      workflows: config.workflows.length > 0,
      rbac: config.security.authorization.rbac,
      encryption: config.security.encryption.atRest,
    },
    database: {
      type: "postgresql",
      ssl: true,
      poolSize: 10,
    },
    cache: {
      type: "redis",
      ttl: 3600,
    },
    monitoring: {
      enabled: true,
      metrics: ["requests", "errors", "latency"],
      alerts: {
        errorRate: 0.05,
        responseTime: 2000,
      },
    },
  };
  return {
    path: "config/main.json",
    content: JSON.stringify(configContent, null, 2),
    type: "config",
  };
}
function generateSecurityConfig(security) {
  const securityContent = {
    authentication: security.authentication,
    authorization: security.authorization,
    encryption: security.encryption,
    cors: {
      origins: ["https://*.atlasit.com"],
      methods: ["GET", "POST", "PUT", "DELETE"],
      credentials: true,
    },
    rateLimit: {
      windowMs: 900000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
    },
    helmet: {
      contentSecurityPolicy: true,
      hsts: true,
      noSniff: true,
    },
  };
  return {
    path: "config/security.json",
    content: JSON.stringify(securityContent, null, 2),
    type: "config",
  };
}
function generateIntegrationsConfig(integrations) {
  const integrationsContent = {
    integrations: integrations.map((integration) => ({
      ...integration,
      healthCheck: {
        enabled: true,
        interval: 300000, // 5 minutes
        timeout: 10000, // 10 seconds
      },
      retry: {
        attempts: 3,
        backoff: "exponential",
      },
    })),
  };
  return {
    path: "config/integrations.json",
    content: JSON.stringify(integrationsContent, null, 2),
    type: "config",
  };
}
function generateWorkflowsConfig(workflows) {
  const workflowsContent = {
    workflows: workflows.map((workflow) => ({
      ...workflow,
      metadata: {
        createdAt: new Date().toISOString(),
        version: "1.0.0",
      },
      monitoring: {
        enabled: true,
        alertOnFailure: true,
      },
    })),
  };
  return {
    path: "config/workflows.json",
    content: JSON.stringify(workflowsContent, null, 2),
    type: "config",
  };
}
function generateDockerfile(config) {
  const dockerContent = `# AtlasIT ${config.industry} Service
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S atlasit -u 1001

# Change ownership
RUN chown -R atlasit:nodejs /app
USER atlasit

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD curl -f http://localhost:3000/health || exit 1

# Start application
CMD ["npm", "start"]
`;
  return {
    path: "Dockerfile",
    content: dockerContent,
    type: "config",
  };
}
function generateReadme(config) {
  const readmeContent = `# AtlasIT ${config.industry} Service

Auto-generated configuration for ${config.industry} industry.

## Features

- **Integrations**: ${config.integrations.length} configured integrations
- **Workflows**: ${config.workflows.length} automated workflows
- **Security**: ${config.security.authentication.method.toUpperCase()} authentication
- **RBAC**: ${config.security.authorization.rbac ? "Enabled" : "Disabled"}
- **Encryption**: At rest: ${config.security.encryption.atRest ? "Yes" : "No"}, In transit: ${config.security.encryption.inTransit ? "Yes" : "No"}

## Integrations

${config.integrations.map((integration) => `- **${integration.name}** (${integration.type}): ${integration.enabled ? "Enabled" : "Disabled"}`).join("\n")}

## Workflows

${config.workflows.map((workflow) => `- **${workflow.name}**: Triggered by ${workflow.trigger.type}, ${workflow.actions.length} actions`).join("\n")}

## Security Roles

${config.security.authorization.roles.map((role) => `- **${role.name}**: ${role.permissions.join(", ")}`).join("\n")}

## Getting Started

1. Review the configuration files in the \`config/\` directory
2. Update environment variables as needed
3. Deploy using Docker: \`docker build -t atlasit-${config.industry.toLowerCase()} .\`
4. Run: \`docker run -p 3000:3000 atlasit-${config.industry.toLowerCase()}\`

## Configuration Files

- \`config/main.json\`: Main application configuration
- \`config/security.json\`: Security and authentication settings
- \`config/integrations.json\`: Third-party integration settings
- \`config/workflows.json\`: Automated workflow definitions

## Environment Variables

\`\`\`bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/atlasit
DATABASE_SSL=true

# Cache
REDIS_URL=redis://localhost:6379

# Security
JWT_SECRET=your-jwt-secret
ENCRYPTION_KEY=your-encryption-key

# Integrations
${config.integrations.map((integration) => `${integration.name.toUpperCase().replace(/\s+/g, "_")}_API_KEY=your-api-key`).join("\n")}
\`\`\`

## Support

For support and documentation, visit [AtlasIT Documentation](https://docs.atlasit.com)
`;
  return {
    path: "README.md",
    content: readmeContent,
    type: "documentation",
  };
}
//# sourceMappingURL=template.js.map
