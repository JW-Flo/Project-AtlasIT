package atlasit.grammar

# Grammar rules for Copilot agent interactions and commit messages

# Valid commit prefixes as per organization standards
valid_prefixes := ["feat", "fix", "ops", "docs", "test", "refactor", "chore", "ci", "perf", "style"]

# Evidence tag pattern (optional)
evidence_pattern := `EV-[0-9]{4}`

# Validate commit message format
deny contains msg if {
    input.commit_message
    not valid_commit_format(input.commit_message)
    msg := "Commit message must start with valid prefix (feat, fix, ops, docs, etc.)"
}

valid_commit_format(message) if {
    some prefix in valid_prefixes
    startswith(message, concat("", [prefix, ":"]))
}

valid_commit_format(message) if {
    some prefix in valid_prefixes
    startswith(message, concat("", [prefix, "("]))
}

# Validate PR title format
deny contains msg if {
    input.pr_title
    not valid_pr_title(input.pr_title)
    msg := "PR title must follow format: [PR-ID] Description or standard commit format"
}

valid_pr_title(title) if {
    regex.match(`^\[PR-[A-Z]+-[0-9]+\]`, title)
}

valid_pr_title(title) if {
    regex.match(`^\[AUTO\]`, title)
}

valid_pr_title(title) if {
    valid_commit_format(title)
}

# Validate no hardcoded secrets
deny contains msg if {
    input.file_content
    contains(lower(input.file_content), "secret")
    contains(lower(input.file_content), "=")
    not contains(lower(input.file_content), lower("SECRET_ENV_VAR"))
    not contains(lower(input.file_content), lower("secret_name"))
    msg := "Potential hardcoded secret detected"
}

# Allow passing when no deny rules match
allow if {
    count(deny) == 0
}
