#!/usr/bin/env zsh
set -euo pipefail

# Create & activate virtualenv
[ -d .mistral-venv ] || python3 -m venv .mistral-venv
source .mistral-venv/bin/activate

# Upgrade pip and install Mistral packages
pip install --upgrade pip
pip install mistral mistralai

# Verify installation via Python module
echo "Mistral version: $(python -m mistral --version)"
# ci-test
