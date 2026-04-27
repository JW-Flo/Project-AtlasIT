#!/bin/bash
set -euo pipefail

RUNNER_HOME=/home/ec2-user/actions-runner

# Install dependencies (AL2023 uses dnf; curl-minimal is pre-installed)
dnf install -y git jq tar gzip unzip zip docker libicu krb5-libs zlib openssl-libs

# Install Node.js 20
dnf install -y nodejs20
npm install -g pnpm@9

# Start Docker for any container-based steps
systemctl enable docker
systemctl start docker
usermod -aG docker ec2-user

# Install GitHub Actions runner
mkdir -p $RUNNER_HOME
cd $RUNNER_HOME

RUNNER_VERSION=$(curl -s https://api.github.com/repos/actions/runner/releases/latest | jq -r '.tag_name' | sed 's/^v//')
curl -o actions-runner.tar.gz -L "https://github.com/actions/runner/releases/download/v$${RUNNER_VERSION}/actions-runner-linux-arm64-$${RUNNER_VERSION}.tar.gz"
tar xzf actions-runner.tar.gz
rm actions-runner.tar.gz
chown -R ec2-user:ec2-user $RUNNER_HOME

# Get GitHub PAT from SSM to generate a registration token
GH_PAT=$(aws ssm get-parameter --name "${ssm_pat_key}" --with-decryption --query 'Parameter.Value' --output text --region us-east-1)
REG_TOKEN=$(curl -s -X POST \
  -H "Authorization: token $GH_PAT" \
  -H "Accept: application/vnd.github+json" \
  "https://api.github.com/repos/${github_repo}/actions/runners/registration-token" \
  | jq -r '.token')

# Configure the runner
su - ec2-user -c "cd $RUNNER_HOME && ./config.sh \
  --url https://github.com/${github_repo} \
  --token $REG_TOKEN \
  --name ${runner_name} \
  --labels ${labels} \
  --unattended \
  --replace"

# Install and start as a systemd service
cd $RUNNER_HOME
./svc.sh install ec2-user
./svc.sh start
