# RDS Proxy — mitigates Lambda cold-start PG connection latency over VPC
#
# Problem: VPC-based Lambdas take ~45s to establish a fresh Postgres connection
# through ENI attachment + TCP handshake + TLS, exceeding the API Gateway 29s
# timeout and causing 503s on writes after deploys / scale-down events.
#
# Solution: RDS Proxy maintains a warm connection pool in front of the RDS
# instance. Lambdas connect to the proxy (sub-second) and the proxy multiplexes
# onto pre-established backend connections.
#
# Rollback: existing DATABASE_URL SSM parameter remains unchanged. Lambdas
# are switched over in a follow-up by updating env vars to read the new
# /atlasit/${env}/database-proxy-url parameter.

# --- Security group: proxy sits between Lambda SG and RDS SG ---

resource "aws_security_group" "rds_proxy" {
  name        = "atlasit-rds-proxy-${var.env}"
  description = "Security group for AtlasIT RDS Proxy"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "Postgres from Lambda SG"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.lambda.id]
  }

  egress {
    description     = "Postgres to RDS SG"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.aurora.id]
  }

  tags = { Name = "atlasit-rds-proxy-sg-${var.env}" }
}

# Allow the proxy SG to reach the RDS instance (aurora SG in networking.tf only
# permits Lambda SG). Added as a standalone rule so we don't modify the
# existing aws_security_group.aurora resource.
resource "aws_security_group_rule" "aurora_ingress_from_proxy" {
  type                     = "ingress"
  from_port                = 5432
  to_port                  = 5432
  protocol                 = "tcp"
  security_group_id        = aws_security_group.aurora.id
  source_security_group_id = aws_security_group.rds_proxy.id
  description              = "Postgres from RDS Proxy"
}

# --- IAM role for RDS Proxy to read the master user secret ---

resource "aws_iam_role" "rds_proxy" {
  name = "atlasit-rds-proxy-${var.env}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "rds.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "rds_proxy_secrets" {
  name = "atlasit-rds-proxy-secrets-${var.env}"
  role = aws_iam_role.rds_proxy.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "GetSecretValue"
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret",
        ]
        # RDS auto-generated master user secret (manage_master_user_password = true)
        Resource = aws_db_instance.main.master_user_secret[0].secret_arn
      },
      {
        Sid      = "DecryptSecret"
        Effect   = "Allow"
        Action   = ["kms:Decrypt"]
        Resource = "*"
        Condition = {
          StringEquals = {
            "kms:ViaService" = "secretsmanager.${var.region}.amazonaws.com"
          }
        }
      },
    ]
  })
}

# --- RDS Proxy ---

resource "aws_db_proxy" "main" {
  name                   = "atlasit-rds-proxy-${var.env}"
  engine_family          = "POSTGRESQL"
  role_arn               = aws_iam_role.rds_proxy.arn
  vpc_subnet_ids         = aws_subnet.private[*].id
  vpc_security_group_ids = [aws_security_group.rds_proxy.id]
  require_tls            = true
  idle_client_timeout    = 1800
  debug_logging          = false

  auth {
    auth_scheme = "SECRETS"
    iam_auth    = "DISABLED"
    secret_arn  = aws_db_instance.main.master_user_secret[0].secret_arn
    description = "AtlasIT RDS master user secret"
  }

  tags = { Name = "atlasit-rds-proxy-${var.env}" }
}

resource "aws_db_proxy_default_target_group" "main" {
  db_proxy_name = aws_db_proxy.main.name

  connection_pool_config {
    max_connections_percent      = 75
    max_idle_connections_percent = 50
    connection_borrow_timeout    = 120
  }
}

resource "aws_db_proxy_target" "main" {
  db_proxy_name          = aws_db_proxy.main.name
  target_group_name      = aws_db_proxy_default_target_group.main.name
  db_instance_identifier = aws_db_instance.main.identifier
}

# --- SSM parameter: new proxy-backed DATABASE_URL ---
#
# Format matches existing /atlasit/${env}/secrets/database-url (credentials +
# sslmode=require) but points at the proxy endpoint. Lambdas will switch over
# by changing which SSM param they read in a follow-up.
#
# NOTE: value is a PLACEHOLDER; the real URL (with password from the RDS master
# secret) is written out-of-band via CLI, mirroring how DATABASE_URL is managed
# today. lifecycle.ignore_changes prevents Terraform from clobbering it.

resource "aws_ssm_parameter" "database_proxy_url" {
  name        = "/atlasit/${var.env}/database-proxy-url"
  type        = "SecureString"
  overwrite   = true
  value       = "postgresql://PLACEHOLDER@${aws_db_proxy.main.endpoint}:5432/${aws_db_instance.main.db_name}?sslmode=require"
  description = "RDS Proxy connection string (credentials populated out-of-band from RDS master secret)"

  lifecycle {
    ignore_changes = [value]
  }
}

# --- Outputs ---

output "rds_proxy_endpoint" {
  value       = aws_db_proxy.main.endpoint
  description = "RDS Proxy endpoint hostname (use in place of rds_endpoint for Lambda connections)"
}

output "rds_proxy_arn" {
  value       = aws_db_proxy.main.arn
  description = "RDS Proxy ARN"
}
