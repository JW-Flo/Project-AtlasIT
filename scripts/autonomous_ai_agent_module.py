import os
from openai import OpenAI
from github import Github
from dotenv import load_dotenv

# Load credentials explicitly
load_dotenv()

# Initialize clients explicitly
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
gh = Github(os.getenv("GH_PAT"))

# Explicitly define repository
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
            files.append(f"### {file_content.path}\n```\n{file_content.decoded_content.decode()}\n```")
    return "\n\n".join(files)

# Get the current repository state explicitly
repo_state = fetch_repo_files()

# Explicit AI prompt (as provided by you, directly embedded)
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

Here’s the explicit current repository state:

{repo_state}

Output explicitly:

- An explicit and detailed list of identified issues (if any).
- Explicit step-by-step instructions or commands to resolve each identified issue clearly.
- Explicitly corrected and finalized YAML and Python script explicitly ready to copy and immediately deploy without any further adjustments.
- Explicit verification commands or explicit tests to immediately confirm success upon redeployment.

You must operate autonomously, relentlessly, with absolute precision and clarity until the pipeline runs successfully, autonomously, and flawlessly without human intervention.
"""

# Explicit API call to OpenAI
completion = client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {"role": "system", "content": "You explicitly debug, validate, and autonomously fix DevOps pipeline configurations."},
        {"role": "user", "content": explicit_prompt}
    ],
    temperature=0
    # Removed function_call parameter as it is not required
)

# Explicitly print the actionable output
print(completion.choices[0].message.content)

