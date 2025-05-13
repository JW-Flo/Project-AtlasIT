#!/bin/bash

# Ensure GAM directory exists
mkdir -p ~/.gam

# Copy required configuration files
if [ -f "gam/oauth2.txt" ]; then
  cp gam/oauth2.txt ~/.gam/oauth2.txt
  echo "Copied oauth2.txt to GAM directory."
else
  echo "ERROR: oauth2.txt not found in gam/ directory. Please add it."
  exit 1
fi

if [ -f "gam/oauth2service.json" ]; then
  cp gam/oauth2service.json ~/.gam/oauth2service.json
  echo "Copied oauth2service.json to GAM directory."
else
  echo "ERROR: oauth2service.json not found in gam/ directory. Please add it."
  exit 1
fi

# Set permissions
chmod 600 ~/.gam/oauth2.txt ~/.gam/oauth2service.json

echo "GAM setup completed successfully."