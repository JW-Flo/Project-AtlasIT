#!/usr/bin/env bash
set -euo pipefail

# Migrate D1 databases to Aurora PostgreSQL
# Usage: ./scripts/migrate-d1-to-aurora.sh <aurora-endpoint> <env>
# Requires: wrangler CLI, psql, sed

AURORA_HOST="${1:?Usage: $0 <aurora-endpoint> [env]}"
ENV="${2:-dev}"
DB_NAME="atlasit"
DB_USER="atlasit_admin"
TMPDIR=$(mktemp -d)
trap 'rm -rf "$TMPDIR"' EXIT

declare -A D1_DBS=(
  ["atlasit-shared"]="4c219864-76be-4453-a494-a4e0904e9cbc"
  ["atlas_core_db"]="4fb2e312-3ba5-4fa2-a91f-7275c71bea64"
  ["atlasit_compliance"]="25c2d388-8a76-4b8c-a594-21973239f0d5"
  ["atlas_audit_db"]="faa2caf5-0219-4507-9d8f-9ddab544615c"
)

echo "==> D1 → Aurora PostgreSQL migration"
echo "    Target: $AURORA_HOST / $DB_NAME"

# Step 1: Apply PostgreSQL schema
echo ""
echo "--- Applying PostgreSQL schema ---"
psql -h "$AURORA_HOST" -U "$DB_USER" -d "$DB_NAME" \
  -f infra/aws/migrations/001_postgresql_schema.sql \
  2>&1 | tail -5
echo "    Schema applied"

# Step 2: Export and import data from each D1 database
for DB_NAME_D1 in "${!D1_DBS[@]}"; do
  DB_ID="${D1_DBS[$DB_NAME_D1]}"
  echo ""
  echo "--- Exporting $DB_NAME_D1 ($DB_ID) ---"

  # Export as SQL
  npx wrangler d1 export "$DB_NAME_D1" --remote --output "$TMPDIR/${DB_NAME_D1}.sql" 2>/dev/null || {
    echo "    Warning: export failed for $DB_NAME_D1, trying alternative..."
    # Fallback: dump via execute
    npx wrangler d1 execute "$DB_NAME_D1" --remote --command ".dump" > "$TMPDIR/${DB_NAME_D1}.sql" 2>/dev/null || true
  }

  if [ ! -s "$TMPDIR/${DB_NAME_D1}.sql" ]; then
    echo "    Skipping $DB_NAME_D1 (empty export)"
    continue
  fi

  # Convert SQLite INSERT syntax to PostgreSQL
  echo "    Converting SQLite → PostgreSQL syntax..."
  sed -i \
    -e "s/INSERT OR REPLACE/INSERT/g" \
    -e "s/INSERT OR IGNORE/INSERT/g" \
    -e "/^CREATE TABLE/d" \
    -e "/^CREATE INDEX/d" \
    -e "/^CREATE UNIQUE INDEX/d" \
    -e "/^DROP TABLE/d" \
    -e "/^PRAGMA/d" \
    -e "/^BEGIN/d" \
    -e "/^COMMIT/d" \
    "$TMPDIR/${DB_NAME_D1}.sql"

  # Count INSERT statements
  INSERT_COUNT=$(grep -c "^INSERT" "$TMPDIR/${DB_NAME_D1}.sql" || echo 0)
  echo "    Found $INSERT_COUNT INSERT statements"

  if [ "$INSERT_COUNT" -gt 0 ]; then
    echo "    Importing to Aurora..."
    psql -h "$AURORA_HOST" -U "$DB_USER" -d "$DB_NAME" \
      -f "$TMPDIR/${DB_NAME_D1}.sql" \
      2>&1 | tail -3
    echo "    Imported $DB_NAME_D1"
  fi
done

# Step 3: Verify row counts
echo ""
echo "--- Verification ---"
TABLES="tenants users integrations events audit_log compliance_evidence compliance_scores"
for TABLE in $TABLES; do
  COUNT=$(psql -h "$AURORA_HOST" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM $TABLE" 2>/dev/null || echo "N/A")
  printf "    %-30s %s rows\n" "$TABLE" "$(echo "$COUNT" | xargs)"
done

echo ""
echo "==> D1 → Aurora migration complete"
