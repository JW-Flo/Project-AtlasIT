# Migration Runner Lambda

One-off Lambda for running SQL against Aurora RDS (which is in a private VPC).

## Deploy (if not already deployed)

```bash
cd scripts/lambda-migration-runner
npm install --production
powershell.exe -Command "Compress-Archive -Path '.\*' -DestinationPath '.\migrate.zip' -Force"

DB_URL=$(aws lambda get-function-configuration --function-name atlasit-core-api-dev --query "Environment.Variables.DATABASE_URL" --output text)

aws s3 cp migrate.zip s3://atlasit-console-dev-457335975503/tmp/migrate.zip

aws lambda create-function \
  --function-name atlasit-migration-runner \
  --runtime nodejs20.x \
  --role arn:aws:iam::457335975503:role/atlasit-lambda-exec-dev \
  --handler handler.handler \
  --timeout 60 --memory-size 128 \
  --code S3Bucket=atlasit-console-dev-457335975503,S3Key=tmp/migrate.zip \
  --vpc-config SubnetIds=subnet-04703a06669bda271,subnet-0dd3212a106cf2148,SecurityGroupIds=sg-087ba04f136918d3c \
  --environment "Variables={DATABASE_URL=$DB_URL}"
```

## Apply a migration

```bash
# Example: apply migrations/0050_users_password_hash.sql
SQL=$(cat migrations/0050_users_password_hash.sql | node -e "
  const fs = require('fs');
  const sql = fs.readFileSync(0, 'utf8');
  const stmts = sql.split(';').map(s => s.trim()).filter(s => s && !s.split('\n').every(l => l.trim().startsWith('--')));
  console.log(JSON.stringify({ statements: stmts }));
")

aws lambda invoke \
  --function-name atlasit-migration-runner \
  --cli-binary-format raw-in-base64-out \
  --payload "$SQL" \
  result.json

cat result.json
```

## Cleanup

Delete when no migrations pending:

```bash
aws lambda delete-function --function-name atlasit-migration-runner
```
