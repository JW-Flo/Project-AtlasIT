# SvelteKit Lambda Deployment Guide

## Problem

The `@sveltejs/adapter-node` is designed for traditional Node.js servers (Express, Polka, http.createServer), **not AWS Lambda**. It exports a `handler` function that expects `(req, res, next)` middleware signature, not Lambda's `(event, context)` signature.

## Solution

Created a Lambda wrapper (`lambda-handler.js`) that:

1. Converts API Gateway/Lambda Function URL events → Node.js HTTP request/response objects
2. Calls the SvelteKit handler
3. Converts Node.js response → Lambda response format

## Handler Configuration

### Terraform (`infra/aws/console-api-lambda.tf`)

```hcl
handler = "lambda-handler.handler"
```

### Build Output Structure

```
build-lambda/
├── lambda-handler.js    # Lambda wrapper (converts event↔HTTP)
├── handler.js           # SvelteKit adapter-node handler
├── index.js             # Standalone server (not used in Lambda)
├── env.js
├── shims.js
├── client/              # Static assets
└── server/              # SSR bundle
```

## Build & Deploy

### Option 1: Manual (for testing)

```bash
cd console-app
./build-lambda.sh
aws lambda update-function-code \
  --function-name atlasit-console-api-dev \
  --zip-file fileb://console-lambda.zip
```

### Option 2: GitHub Actions (CI/CD)

Add to `.github/workflows/deploy-console.yml`:

```yaml
- name: Build Lambda package
  run: |
    cd console-app
    ./build-lambda.sh

- name: Deploy to Lambda
  run: |
    aws lambda update-function-code \
      --function-name atlasit-console-api-${{ env.ENV }} \
      --zip-file fileb://console-app/console-lambda.zip
```

## Key Files

| File                              | Purpose                                       |
| --------------------------------- | --------------------------------------------- |
| `svelte.config.lambda.js`         | adapter-node config (output: `build-lambda/`) |
| `lambda-handler.js`               | Lambda wrapper (event → HTTP → response)      |
| `build-lambda.sh`                 | Build script (generates `console-lambda.zip`) |
| `infra/aws/console-api-lambda.tf` | Terraform Lambda resource                     |

## Event Flow

```
API Gateway / Lambda Function URL
  ↓ (event, context)
lambda-handler.handler
  ↓ (req, res, next)
build-lambda/handler.js (SvelteKit)
  ↓ SSR + API routes
SvelteKit app
  ↓ HTML / JSON response
lambda-handler (formats response)
  ↓ { statusCode, headers, body, isBase64Encoded }
API Gateway / Lambda Function URL
```

## Why Not adapter-node Directly?

The adapter-node documentation explicitly states it's for Node.js servers, not serverless functions:

> "adapter-node creates two files: `index.js` (standalone server) and `handler.js` (compatible with Express, Connect, Polka, or Node's built-in http.createServer)"

Lambda expects:

```js
export async function handler(event, context) {
  return { statusCode: 200, body: "..." };
}
```

adapter-node exports:

```js
export function handler(req, res, next) {
  // middleware signature
}
```

Our wrapper bridges this gap.

## Alternatives Considered

1. **@sveltejs/adapter-vercel / adapter-netlify** - Platform-specific, won't work with raw Lambda
2. **serverless-http / @vendia/serverless-express** - Could work but adds extra dependency; custom wrapper is lighter and gives more control
3. **Custom adapter** - Overkill for a single Lambda wrapper file

## Testing Locally

```bash
# Install dependencies
npm install

# Build
./build-lambda.sh

# Test with AWS SAM
sam local start-api --template sam-template.yaml

# Or use Node.js directly
node -e "
import('./build-lambda/lambda-handler.js').then(m => {
  m.handler({
    rawPath: '/',
    headers: {},
    requestContext: {}
  }, {}).then(console.log);
});
"
```

## Troubleshooting

### 502 Bad Gateway

- Check CloudWatch Logs: `/aws/lambda/atlasit-console-api-dev`
- Verify handler path: `lambda-handler.handler`
- Ensure `lambda-handler.js` is in the deployment package root

### Module not found

- Ensure `"type": "module"` in `package.json`
- Verify `lambda-handler.js` uses `import` not `require`
- Check all dependencies are bundled in `build-lambda/`

### Timeout

- Increase Lambda timeout (default 30s in Terraform)
- Check for blocking operations in SvelteKit load functions
- Enable X-Ray tracing to identify bottlenecks

### Environment Variables

Set via AWS Console or Terraform:

```hcl
environment {
  variables = {
    NODE_ENV = "production"
    DATABASE_URL = "postgresql://..."
    # etc
  }
}
```

## Performance Notes

- Cold start: ~1-2s (SvelteKit SSR bundle + Node.js runtime)
- Warm request: ~50-200ms
- Consider Lambda provisioned concurrency for production
- Use CloudFront caching for static assets (`/build/*`, `/favicon.ico`)
