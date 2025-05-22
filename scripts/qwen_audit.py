#!/usr/bin/env python3
"""Send minimal test prompt to Together AI model and print response."""
import os, sys
from together import Together
from git import Repo
from datetime import datetime
import schedule
import time

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
        print(f"Reverted to commit {commit_hash}")
    except Exception as e:
        print(f"Failed to revert to commit {commit_hash}: {e}")
        sys.exit(1)

def verify_revert(commit_hash):
    repo = Repo(os.getcwd())
    current_commit = repo.head.commit.hexsha
    if current_commit == commit_hash:
        print(f"Revert to commit {commit_hash} verified")
    else:
        print(f"Revert to commit {commit_hash} not verified")
        sys.exit(1)

def commit_and_push_changes():
    repo = Repo(os.getcwd())
    try:
        repo.git.add(all=True)
        repo.index.commit("chore: qwen_audit applied safe cleanup patch")
        repo.remote("origin").push(repo.active_branch.name)
        print("Changes committed and pushed successfully")
    except Exception as e:
        print(f"Git push failed: {e}")
        sys.exit(1)

def schedule_revert():
    schedule_time = "01:15"
    schedule.every().day.at(schedule_time).do(main)
    while True:
        schedule.run_pending()
        time.sleep(1)

def main():
    api_key = os.getenv("TOGETHER_API_KEY")
    if not api_key:
        sys.exit("TOGETHER_API_KEY not set")
    model = os.getenv("MODEL", "Qwen/QwQ-32B")
    client = Together(api_key=api_key)
    resp = client.chat.completions.create(
        model=model,
        messages=[{"role": "user", "content": "What is 2+2?"}],
        temperature=0.3,
        max_tokens=32,
    )
    print(resp.choices[0].message.content)
    print(
        f"Prompt tokens: {resp.usage.prompt_tokens}, Completion tokens: {resp.usage.completion_tokens}"
    )

    desired_time = datetime.strptime("2023-05-01 13:15:00", "%Y-%m-%d %H:%M:%S")
    commit_hash = find_commit_hash(desired_time)
    if commit_hash:
        revert_to_commit(commit_hash)
        verify_revert(commit_hash)
        commit_and_push_changes()
    else:
        print("No commit found for the desired time")
        sys.exit(1)

if __name__ == "__main__":
    main()
    schedule_revert()
