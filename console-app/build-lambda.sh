#!/bin/bash
#
# Build and package SvelteKit console-app for AWS Lambda deployment
# Output: console-lambda.zip ready for Lambda upload
#

set -e

cd "$(dirname "$0")"

echo "🏗️  Building SvelteKit with adapter-node..."
cp svelte.config.lambda.js svelte.config.js
npm run build

echo "📦 Copying Lambda wrapper..."
cp lambda-handler.js build-lambda/

echo "📦 Creating deployment package..."
cd build-lambda
zip -r ../console-lambda.zip . -x "*.map" > /dev/null

cd ..
echo "✅ Built console-lambda.zip ($(du -h console-lambda.zip | cut -f1))"
echo "   Handler: lambda-handler.handler"
