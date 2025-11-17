#!/usr/bin/env node

const { execSync } = require('child_process');
const https = require('https');

const VAULT_ID = '7miu6z6kxqreys7op6ckgvfhvq';
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;
const OP_SERVICE_ACCOUNT_TOKEN = process.env.OP_SERVICE_ACCOUNT_TOKEN;

if (!OP_SERVICE_ACCOUNT_TOKEN) {
  console.error('Error: OP_SERVICE_ACCOUNT_TOKEN is not set in the environment.');
  process.exit(1);
}
if (!SLACK_WEBHOOK_URL) {
  console.error('Error: SLACK_WEBHOOK_URL is not set in the environment.');
  process.exit(1);
}

const [,, secretName, secretValue, ...notesArr] = process.argv;
const notes = notesArr.join(' ') || `Created by AI system on ${new Date().toISOString()}`;

if (!secretName || !secretValue) {
  console.error('Usage: node store_secret_and_notify.js <secretName> <secretValue> [notes]');
  process.exit(1);
}

try {
  // Store secret in 1Password
  execSync(`OP_SERVICE_ACCOUNT_TOKEN="${OP_SERVICE_ACCOUNT_TOKEN}" op item create --vault ${VAULT_ID} --category "API Credential" "credential name=${secretName}" "password=${secretValue}" "notes=${notes}"`, { stdio: 'inherit' });

  // Send Slack notification (without secret value)
  const slackMsg = {
    text: `:lock: *New secret stored in 1Password vault*\n*Name:* ${secretName}\n*Vault:* AtlasIT Secrets\n*Notes:* ${notes}`
  };
  const data = JSON.stringify(slackMsg);
  const url = new URL(SLACK_WEBHOOK_URL);
  const req = https.request({
    hostname: url.hostname,
    path: url.pathname + url.search,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  });
  req.write(data);
  req.end();
  req.on('close', () => process.exit(0));
} catch (err) {
  console.error('Failed to store secret or notify Slack:', err);
  process.exit(1);
} 