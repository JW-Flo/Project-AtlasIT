# RDS PostgreSQL db.t4g.small — replaces Aurora Serverless v2
# Saves ~$28/mo ($43 → $15) with no application code changes.
# App uses standard pg driver with password auth — no Aurora-specific features.

resource "aws_db_instance" "main" {
  identifier           = "atlasit-rds-${var.env}"
  engine               = "postgres"
  engine_version       = "16.4"
  instance_class       = "db.t4g.small"
  allocated_storage    = 20
  max_allocated_storage = 100
  storage_type         = "gp3"
  storage_encrypted    = true

  db_name  = "atlasit"
  username = "atlasit_admin"
  manage_master_user_password = true

  vpc_security_group_ids = [aws_security_group.aurora.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  backup_retention_period = 7
  preferred_backup_window = "03:00-04:00"
  skip_final_snapshot     = var.env != "prod"
  final_snapshot_identifier = var.env == "prod" ? "atlasit-final-${var.env}" : null
  deletion_protection     = var.env == "prod"

  performance_insights_enabled = false
  multi_az                     = false

  enabled_cloudwatch_logs_exports = ["postgresql"]

  tags = { Name = "atlasit-rds-${var.env}" }
}

resource "aws_cloudwatch_log_group" "rds" {
  name              = "/aws/rds/instance/atlasit-rds-${var.env}/postgresql"
  retention_in_days = 30
}

# --- Outputs ---
output "rds_endpoint" {
  value       = aws_db_instance.main.endpoint
  description = "RDS writer endpoint"
}

output "rds_database_name" {
  value = aws_db_instance.main.db_name
}
