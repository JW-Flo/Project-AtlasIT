# Self-hosted GitHub Actions runner — t4g.small (~$7/mo) in public subnet
# Replaces GitHub-hosted runners to avoid Actions minutes billing on free plan.

resource "aws_instance" "gh_runner" {
  ami                         = data.aws_ami.amazon_linux_arm.id
  instance_type               = "t4g.small"
  subnet_id                   = aws_subnet.public[0].id
  associate_public_ip_address = true
  vpc_security_group_ids      = [aws_security_group.gh_runner.id]
  iam_instance_profile        = aws_iam_instance_profile.gh_runner.name

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
  }

  root_block_device {
    volume_size = 30
    volume_type = "gp3"
    encrypted   = true
  }

  user_data = base64encode(templatefile("${path.module}/gh-runner-init.sh", {
    github_repo = var.github_repo
    runner_name = "atlasit-aws-${var.env}"
    labels      = "self-hosted,linux,arm64,atlasit-${var.env}"
    ssm_pat_key = "/atlasit/${var.env}/github-runner-pat"
  }))

  tags = { Name = "atlasit-gh-runner-${var.env}" }
}

resource "aws_security_group" "gh_runner" {
  name_prefix = "atlasit-gh-runner-${var.env}-"
  vpc_id      = aws_vpc.main.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "atlasit-gh-runner-sg-${var.env}" }
}

resource "aws_iam_role" "gh_runner" {
  name = "atlasit-gh-runner-${var.env}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_instance_profile" "gh_runner" {
  name = "atlasit-gh-runner-${var.env}"
  role = aws_iam_role.gh_runner.name
}

resource "aws_iam_role_policy_attachment" "gh_runner_ssm" {
  role       = aws_iam_role.gh_runner.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_role_policy" "gh_runner" {
  name = "atlasit-gh-runner-${var.env}"
  role = aws_iam_role.gh_runner.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters"
        ]
        Resource = "arn:aws:ssm:${var.region}:${var.account_id}:parameter/atlasit/${var.env}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "lambda:UpdateFunctionCode",
          "lambda:GetFunction",
          "lambda:ListVersionsByFunction",
          "lambda:DeleteFunction",
          "lambda:GetFunctionUrlConfig",
          "lambda:InvokeFunction",
          "lambda:PublishVersion",
          "lambda:ListAliases"
        ]
        Resource = "arn:aws:lambda:${var.region}:${var.account_id}:function:atlasit-*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          "arn:aws:s3:::atlasit-console-${var.env}-${var.account_id}",
          "arn:aws:s3:::atlasit-console-${var.env}-${var.account_id}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "cloudfront:CreateInvalidation",
          "cloudfront:GetInvalidation",
          "cloudfront:ListDistributions"
        ]
        Resource = "*"
      },
      {
        Effect   = "Allow"
        Action   = ["ssm:GetParameter"]
        Resource = "arn:aws:ssm:${var.region}:${var.account_id}:parameter/atlasit/*"
      }
    ]
  })
}
