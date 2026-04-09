# Secrets Manager resources removed — migrated to SSM SecureString (free)
# See ssm.tf for /atlasit/${env}/secrets/* parameters
#
# To delete existing Secrets Manager secrets after verifying SSM works:
#   aws secretsmanager delete-secret --secret-id "atlasit/staging/<name>" --force-delete-without-recovery
