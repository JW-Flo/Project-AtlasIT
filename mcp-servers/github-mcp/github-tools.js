/**
 * GitHub Tools Implementation
 * Implements core GitHub API tools using @octokit/rest
 */

import { Octokit } from '@octokit/rest';

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

/**
 * List all accessible repositories for the authenticated user
 */
export async function listRepositories(req, res) {
  try {
    const response = await octokit.repos.listForAuthenticatedUser();
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Create a new issue in a repository
 */
export async function createIssue(req, res) {
  const { owner, repo, title, body } = req.body;
  try {
    const response = await octokit.issues.create({
      owner,
      repo,
      title,
      body,
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * List pull requests for a repository
 */
export async function listPullRequests(req, res) {
  const { owner, repo } = req.query;
  try {
    const response = await octokit.pulls.list({
      owner,
      repo,
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Create a new pull request
 */
export async function createPullRequest(req, res) {
  const { owner, repo, title, head, base, body } = req.body;
  try {
    const response = await octokit.pulls.create({
      owner,
      repo,
      title,
      head,
      base,
      body,
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Get the contents of a file in a repository
 */
export async function getFileContents(req, res) {
  const { owner, repo, path, ref } = req.query;
  try {
    const response = await octokit.repos.getContent({
      owner,
      repo,
      path,
      ref,
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Update a file in a repository
 */
export async function updateFile(req, res) {
  const { owner, repo, path, message, content, sha, branch } = req.body;
  try {
    const response = await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message,
      content,
      sha,
      branch,
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Trigger a GitHub Action workflow
 */
export async function runGitHubAction(req, res) {
  const { owner, repo, workflow_id, ref, inputs } = req.body;
  try {
    const response = await octokit.actions.createWorkflowDispatch({
      owner,
      repo,
      workflow_id,
      ref,
      inputs,
    });
    res.json({ message: 'Workflow triggered' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Setup routes for GitHub tools
 */
export function setupGitHubTools(app) {
  app.get('/list_repositories', listRepositories);
  app.post('/create_issue', createIssue);
  app.get('/list_pull_requests', listPullRequests);
  app.post('/create_pull_request', createPullRequest);
  app.get('/get_file_contents', getFileContents);
  app.post('/update_file', updateFile);
  app.post('/run_github_action', runGitHubAction);
}
