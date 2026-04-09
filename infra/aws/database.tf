# Aurora PostgreSQL Serverless v2 — replaces all D1 databases
# (atlasit-shared, atlas_core_db, atlasit_compliance, atlas_audit_db, atlas_audit_shadow)

resource "aws_rds_cluster" "main" {
  cluster_identifier     = "atlasit-${var.env}"
  engine                 = "aurora-postgresql"
  engine_mode            = "provisioned"
  engine_version         = "16.4"
  database_name          = "atlasit"
  master_username        = "atlasit_admin"
  manage_master_user_password = true

  serverlessv2_scaling_configuration {
    min_capacity = 0.5
    max_capacity = 4
  }

  storage_encrypted   = true
  deletion_protection = var.env == "prod"
  skip_final_snapshot = var.env != "prod"
  final_snapshot_identifier = var.env == "prod" ? "atlasit-final-${var.env}" : null

  backup_retention_period = 7
  preferred_backup_window = "03:00-04:00"

  enabled_cloudwatch_logs_exports = ["postgresql"]

  vpc_security_group_ids = [aws_security_group.aurora.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
}

resource "aws_rds_cluster_instance" "writer" {
  identifier         = "atlasit-${var.env}-writer"
  cluster_identifier = aws_rds_cluster.main.id
  instance_class     = "db.serverless"
  engine             = aws_rds_cluster.main.engine
  engine_version     = aws_rds_cluster.main.engine_version
}

resource "aws_cloudwatch_log_group" "aurora" {
  name              = "/aws/rds/cluster/atlasit-${var.env}/postgresql"
  retention_in_days = 30
}

# --- Outputs ---
output "aurora_endpoint" {
  value       = aws_rds_cluster.main.endpoint
  description = "Aurora writer endpoint"
}

output "aurora_reader_endpoint" {
  value       = aws_rds_cluster.main.reader_endpoint
  description = "Aurora reader endpoint"
}

output "aurora_database_name" {
  value = aws_rds_cluster.main.database_name
}
