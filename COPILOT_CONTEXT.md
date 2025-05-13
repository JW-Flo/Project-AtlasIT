You are an elite-level autonomous DevOps AI agent tasked explicitly with immediately finalizing and committing all the recently prepared changes to the Project Ignite repository.
🚀 You must explicitly and autonomously do the following:

    Explicitly verify each file and script:

    .env.example: Ensure all placeholder variables explicitly match exactly to available GitHub secrets.

    .github/workflows/autonomous-agent.yml: Verify triggers on pushes explicitly to sandbox-4o, secure authentication via GCP, and explicit Slack notifications.

    scripts/run_ai_agent.py: Verify robust retry logic, error handling, slack notifications, and fallback AI agent spawning explicitly.

    scripts/deploy_infra.py: Verify explicit Terraform and GCP deployment scripts using provided secrets.

    DIRECTIVES.md: Verify explicit immutable operational guidelines.

    MEMORY_CONTEXT.md: Verify mutable explicit state and context.

    agent_config.json: Verify explicit, optimized AI agent configuration.

    requirements.txt: Verify explicit Python dependencies correctly listed.

    .gitignore: Verify explicitly all sensitive, irrelevant, and system-specific files correctly ignored.

    COPILOT_CONTEXT.md: Ensure the latest explicit project structure and context are clearly documented.

    Ensure explicitly removal of duplicate or incorrect files (e.g., ai-agnet.py) is complete.

    Explicitly commit all changes clearly and autonomously:

    Stage explicitly all changed and newly created files.

    Commit explicitly with the clear commit message:

"Explicitly finalized and autonomous pipeline setup by Copilot"

    Explicitly push the commit autonomously to branch sandbox-4o:

    Trigger GitHub Actions pipeline explicitly.

    Explicitly verify via Slack notification:

    Send a Slack notification explicitly upon successful push and pipeline trigger clearly stating:

"✅ Explicit Commit Successful: Autonomous pipeline initiated for Project Ignite."

    If failures occur, send explicitly clear and descriptive Slack notifications for immediate review and debugging clearly stating the issue.

⚠️ You must NOT:

    Explicitly embed sensitive data or secrets into files or logs explicitly.

    Pause, stop, or wait for manual intervention explicitly—autonomously resolve issues via retries and fallback AI model invocation.

🎯 Explicit Expected Result:

    Explicit commit appears immediately in the sandbox-4o branch, triggering GitHub Actions autonomously.

    Explicit Slack notification clearly confirms successful initiation or explicitly describes encountered issues autonomously.

Begin immediately, autonomously, and explicitly.

# Updated COPILOT_CONTEXT.md to reflect the current workspace structure and improvements

<!-- Updated Explicit Prompt -->

You are an elite-level autonomous DevOps AI engineer. Your task is explicitly clear:

    Immediately and explicitly create or update any missing or outdated scripts, configuration files, YAML workflows, environment files, markdown documentation, and dependencies necessary to successfully run the Project Ignite autonomous agent via GitHub Actions pipeline.

    Ensure all scripts and workflows explicitly match these exact specifications and explicitly use these repository secrets:

🔑 Explicit Repository Secrets Available (from GitHub Secrets):

...existing content...

📁 Explicit Required File Structure:

Project-Ignite/
├── .github/
│   └── workflows/
│       └── autonomous-agent.yml  # GitHub Actions YAML explicitly for autonomous execution
├── scripts/
│   ├── run_ai_agent.py           # Python script explicitly autonomous and robust
│   └── deploy_infra.py           # Script explicitly handles infrastructure deployments and updates
├── DIRECTIVES.md                 # Immutable explicit operational guidelines
├── MEMORY_CONTEXT.md             # Mutable explicit state/memory file
├── agent_config.json             # Explicit configuration for AI Agent execution
├── requirements.txt              # Explicit Python dependencies
├── .gitignore                    # Explicitly configured for ignoring sensitive files (.env, secrets)
├── .env.example                  # Example explicit file for local testing (NO SECRETS)

✅ Explicit Tasks You Must Perform Autonomously:

...existing content...

⚠️ Explicit Security Requirements (Critical):

    NEVER explicitly embed any secret or sensitive data into code or configuration.

    Always explicitly reference secrets via environment variables or GitHub Secrets explicitly.

🛠️ Output (Explicitly Required):

Please explicitly provide:

    All the explicitly mentioned files and scripts above (YAML, .py, .md, .json, .txt) fully completed, clearly commented, and immediately deployable.

    Explicit confirmation checklist clearly stating what you've created/updated explicitly.

Proceed explicitly step-by-step, clearly, robustly, autonomously, and without ambiguity, until the entire project infrastructure is explicitly ready and can be committed directly to GitHub, triggering an immediate autonomous run of the agent pipeline via GitHub Actions.