import os
import openai
import subprocess
from dotenv import load_dotenv
from github import Github

load_dotenv()

openai.api_key = os.getenv("OPENAI_API_KEY")
model = os.getenv("AI_MODEL")
repo_name = os.getenv("GITHUB_REPO")
gh = Github(os.getenv("GITHUB_TOKEN"))
repo = gh.get_repo(repo_name)

def get_repo_files(path=""):
    contents = repo.get_contents(path)
    files = []
    while contents:
        file_content = contents.pop(0)
        if file_content.type == "dir":
            contents.extend(repo.get_contents(file_content.path))
        else:
            files.append((file_content.path, file_content.decoded_content.decode()))
    return files

def autonomous_evaluate_and_fix():
    files = get_repo_files()
    context = "\n\n".join(f"### {path}\n\n```{content}```" for path, content in files)

    prompt = f"""
    You're an autonomous senior DevOps AI. Fully review, debug, correct, and optimize the following files autonomously:

    {context}

    Clearly specify exact shell commands, GitHub Actions workflow changes, Terraform adjustments, or Cloud Functions corrections needed to autonomously deploy the entire infrastructure without further user input.

    Provide clear, actionable commands only.
    """

    response = openai.ChatCompletion.create(
        model=model,
        messages=[{"role": "system", "content": "You autonomously evaluate and correct infrastructure code."},
                  {"role": "user", "content": prompt}]
    )
    actions = response.choices[0].message.content
    print("\nAutonomous Actions to Perform:\n", actions)

    # Optionally auto-execute shell commands:
    # subprocess.run(actions, shell=True)

autonomous_evaluate_and_fix()
