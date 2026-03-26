/**
 * GitHub MCP Server Authentication Configuration
 * Implements GitHub App authentication and 1Password integration
 */

import express from 'express';
import { Octokit } from '@octokit/rest';
import { createAppAuth } from '@octokit/auth-app';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

/**
 * Middleware to authenticate GitHub App installation requests
 */
export async function authenticateGitHubApp(req, res, next) {
  try {
    const auth = createAppAuth({
      appId: process.env.GITHUB_APP_ID,
      privateKey: process.env.GITHUB_PRIVATE_KEY.replace(/\\n/g, '\n'),
      installationId: req.headers['x-github-installation-id'],
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    });

    const installationAuthentication = await auth({ type: 'installation' });
    req.octokit = new Octokit({
      auth: installationAuthentication.token,
    });
    next();
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed', details: error.message });
  }
}

/**
 * 1Password integration placeholder
 * Extend with actual 1Password SDK or API calls for secure credential storage
 */
export async function getCredentialsFrom1Password() {
  // Placeholder: Implement 1Password integration here
  return {
    githubToken: process.env.GITHUB_TOKEN,
  };
}

/**
 * Setup authentication routes and middleware
 */
export function setupAuthentication(app) {
  app.use(authenticateGitHubApp);
}

export default app;
