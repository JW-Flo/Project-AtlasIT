/**
 * Main entry point for GitHub MCP Server
 */

import express from "express";
import dotenv from "dotenv";
import { setupGitHubTools } from "./github-tools.js";
import { setupGitHubResources } from "./github-resources.js";
import { setupWorkflowTools } from "./github-workflow-tools.js";
import { setupAuthentication } from "./authentication.js";

dotenv.config();

const app = express();
app.use(express.json());

// Setup authentication middleware
setupAuthentication(app);

// Initialize GitHub tools, workflow tools, and resources
setupGitHubTools(app);
setupWorkflowTools(app);
setupGitHubResources(app);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`GitHub MCP Server running on port ${PORT}`);
});
