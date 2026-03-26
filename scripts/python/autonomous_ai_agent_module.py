import os
from openai import OpenAI
from github import Github
from dotenv import load_dotenv
import subprocess
from datetime import datetime
import schedule
import time

# Load credentials explicitly
load_dotenv()


def main():
    """Entry point so external scripts can invoke the agent safely."""
    # Validate GitHub token
    gh_pat = os.getenv("GH_PAT")
    if not gh_pat:
        raise EnvironmentError("GH_PAT environment variable is required but not set.")

    # Only initialise OpenAI client if we have a key, otherwise warn & skip AI step
    openai_key = os.getenv("OPENAI_API_KEY")

    # Initialise GitHub client
    gh = Github(gh_pat)

    # Define repository
    repo_name = "JW-Flo/Project-Ignite"
    repo = gh.get_repo(repo_name)

    # Function explicitly fetching all repository files
    def fetch_repo_files(path=""):
        contents = repo.get_contents(path)
        files = []
        while contents:
            file_content = contents.pop(0)
            if file_content.type == "dir":
                contents.extend(repo.get_contents(file_content.path))
            else:
                try:
                    files.append(
                        f"### {file_content.path}\n```\n{file_content.decoded_content.decode('utf-8', errors='replace')}\n```"
                    )
                except Exception as e:
                    files.append(
                        f"### {file_content.path}\n[Error decoding file: {e}]\n"
                    )
        return "\n\n".join(files)

    # Get the current repository state explicitly
    repo_state = fetch_repo_files()

    # If OpenAI key present, run LLM analysis; otherwise, print repo state and exit.
    if not openai_key:
        print(
            "[WARN] OPENAI_API_KEY not set – skipping OpenAI analysis. Repo state captured for debugging.\n"
        )
        print(repo_state)
        return

    # OpenAI analysis section
    client = OpenAI(api_key=openai_key)

    explicit_prompt = f"""
You are a senior autonomous DevOps AI expert. Your goal is to immediately fix, verify, and fully finalize an existing CI/CD pipeline implementation for a project called "Project-Ignite" in GitHub and Google Cloud Platform.

Current explicit context and tools:

- GitHub repository name: "JW-Flo/Project-Ignite"
- YAML workflow explicitly located at: ".github/workflows/autonomous-agent.yml"
- Python script explicitly located at: "scripts/run_ai_agent.py"
- GitHub Actions explicitly using OAuth via Google Cloud Workload Identity Federation with service account: "ProjectAdmin@ignite-459301.iam.gserviceaccount.com"
- OpenAI API key stored explicitly in GitHub Secrets as OPENAI_API_KEY
- GitHub Personal Access Token stored explicitly as GH_PAT (admin and repo permissions enabled)
- Slack notifications explicitly configured using secret: SLACK_WEBHOOK_URL

Explicit tasks you must autonomously execute and document clearly:

- Immediately verify and explicitly correct all YAML configurations for perfect OAuth integration with GCP via Workload Identity Federation.
- Explicitly verify and correct the Python script (scripts/run_ai_agent.py), ensuring:
  - The correct GitHub repository reference explicitly matches ("JW-Flo/Project-Ignite").
  - GitHub authentication explicitly references the "GH_PAT" environment variable.
  - Ensure the autonomous AI script clearly handles, retries, and logs any exceptions robustly and explicitly.
  - Explicitly verify Slack notifications work correctly, clearly communicating pipeline success or errors.
- Explicitly remove or correct any redundant, confusing, or duplicate files, scripts, or workflows within the repository.
- Explicitly provide precise, ready-to-run commands or YAML fixes needed, with zero ambiguity.
- If missing resources, scripts, or configurations are identified, explicitly provide clear and immediately actionable code or commands to autonomously create and provision them.
- Explicitly confirm the final pipeline will execute flawlessly, fully autonomously, and hands-free without additional human intervention once you have completed your corrections.

Here's the explicit current repository state:

{repo_state}

Output explicitly:

- An explicit and detailed list of identified issues (if any).
- Explicit step-by-step instructions or commands to resolve each identified issue clearly.
- Explicitly corrected and finalized YAML and Python script explicitly ready to copy and immediately deploy without any further adjustments.
- Explicit verification commands or explicit tests to immediately confirm success upon redeployment.

You must operate autonomously, relentlessly, with absolute precision and clarity until the pipeline runs successfully, autonomously, and flawlessly without human intervention.
"""

    completion = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {
                "role": "system",
                "content": "You explicitly debug, validate, and autonomously fix DevOps pipeline configurations.",
            },
            {"role": "user", "content": explicit_prompt},
        ],
        temperature=0,
    )

    print(completion.choices[0].message.content)


def find_commit_hash(desired_time):
    repo = Repo(os.getcwd())
    commits = list(repo.iter_commits('main'))
    for commit in commits:
        commit_time = datetime.fromtimestamp(commit.committed_date)
        if commit_time <= desired_time:
            return commit.hexsha
    return None


def revert_to_commit(commit_hash):
    repo = Repo(os.getcwd())
    try:
        repo.git.revert(commit_hash, no_edit=True)
        logging.info(f"Reverted to commit {commit_hash}")
    except Exception as e:
        logging.error(f"Failed to revert to commit {commit_hash}: {e}")
        sys.exit(1)


def verify_revert(commit_hash):
    repo = Repo(os.getcwd())
    current_commit = repo.head.commit.hexsha
    if current_commit == commit_hash:
        logging.info(f"Revert to commit {commit_hash} verified")
    else:
        logging.error(f"Revert to commit {commit_hash} not verified")
        sys.exit(1)


def commit_and_push_changes():
    repo = Repo(os.getcwd())
    try:
        repo.git.add(all=True)
        repo.index.commit("chore: agent_fixer applied safe cleanup patch")
        repo.remote("origin").push(repo.active_branch.name)
        logging.info("Changes committed and pushed successfully")
    except Exception as e:
        logging.error(f"Git push failed: {e}")
        sys.exit(1)


def schedule_revert():
    schedule_time = "01:15"
    schedule.every().day.at(schedule_time).do(main)
    while True:
        schedule.run_pending()
        time.sleep(1)


# Ensure the module does nothing if imported without explicit call
if __name__ == "__main__":
    main()
    schedule_revert()
