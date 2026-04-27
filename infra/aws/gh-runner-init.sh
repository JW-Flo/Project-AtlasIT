#!/bin/bash
set -euo pipefail

RUNNER_HOME=/opt/actions-runner
RUNNER_USER=runner

# Install dependencies
yum update -y
yum install -y git jq tar gzip curl unzip docker

# Install Node.js 20 (LTS)
curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
yum install -y nodejs

# Install pnpm
npm install -g pnpm@9

# Start Docker for any container-based steps
systemctl enable docker
systemctl start docker

# Create runner user
useradd -m -s /bin/bash $RUNNER_USER
usermod -aG docker $RUNNER_USER

# Install GitHub Actions runner
mkdir -p $RUNNER_HOME
cd $RUNNER_HOME

RUNNER_VERSION=$(curl -s https://api.github.com/repos/actions/runner/releases/latest | jq -r '.tag_name' | sed 's/^v//')
curl -o actions-runner.tar.gz -L "https://github.com/actions/runner/releases/download/v$${RUNNER_VERSION}/actions-runner-linux-arm64-$${RUNNER_VERSION}.tar.gz"
tar xzf actions-runner.tar.gz
rm actions-runner.tar.gz
chown -R $RUNNER_USER:$RUNNER_USER $RUNNER_HOME

# Get GitHub PAT from SSM to generate a registration token
GH_PAT=$(aws ssm get-parameter --name "${ssm_pat_key}" --with-decryption --query 'Parameter.Value' --output text --region us-east-1)
REG_TOKEN=$(curl -s -X POST \
  -H "Authorization: token $GH_PAT" \
  -H "Accept: application/vnd.github+json" \
  "https://api.github.com/repos/${github_repo}/actions/runners/registration-token" \
  | jq -r '.token')

# Configure the runner
sudo -u $RUNNER_USER bash -c "cd $RUNNER_HOME && ./config.sh \
  --url https://github.com/${github_repo} \
  --token $REG_TOKEN \
  --name ${runner_name} \
  --labels ${labels} \
  --unattended \
  --replace"

# Install and start as a systemd service
cd $RUNNER_HOME
./svc.sh install $RUNNER_USER
./svc.sh start

echo "GitHub Actions runner configured and started."
