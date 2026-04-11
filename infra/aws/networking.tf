# VPC for Aurora + Lambda connectivity

data "aws_availability_zones" "available" {
  state = "available"
}

resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = { Name = "atlasit-${var.env}" }
}

# Private subnets (Lambda + Aurora)
resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(aws_vpc.main.cidr_block, 8, count.index)
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = { Name = "atlasit-private-${count.index}-${var.env}" }
}

# Public subnets (NAT instance)
resource "aws_subnet" "public" {
  count                   = 2
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(aws_vpc.main.cidr_block, 8, count.index + 100)
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = { Name = "atlasit-public-${count.index}-${var.env}" }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  tags   = { Name = "atlasit-igw-${var.env}" }
}

# --- NAT instance (t4g.nano, ~$3/mo) replaces managed NAT Gateway ($32/mo) ---

data "aws_ami" "amazon_linux_arm" {
  most_recent = true
  owners      = ["amazon"]
  filter {
    name   = "name"
    values = ["al2023-ami-*-arm64"]
  }
  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

resource "aws_instance" "nat" {
  ami                         = data.aws_ami.amazon_linux_arm.id
  instance_type               = "t4g.nano"
  subnet_id                   = aws_subnet.public[0].id
  source_dest_check           = false
  associate_public_ip_address = true
  vpc_security_group_ids      = [aws_security_group.nat.id]

  user_data = <<-EOF
    #!/bin/bash
    yum install -y iptables-services
    sysctl -w net.ipv4.ip_forward=1
    echo "net.ipv4.ip_forward = 1" >> /etc/sysctl.conf
    iptables -t nat -A POSTROUTING -o ens5 -j MASQUERADE
    service iptables save
    systemctl enable iptables
  EOF

  tags = { Name = "atlasit-nat-${var.env}" }
}

resource "aws_security_group" "nat" {
  name_prefix = "atlasit-nat-${var.env}-"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["10.0.0.0/24", "10.0.1.0/24"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "atlasit-nat-sg-${var.env}" }
}

# --- VPC Gateway Endpoints (free — bypass NAT for S3 + DynamoDB) ---

resource "aws_vpc_endpoint" "s3" {
  vpc_id          = aws_vpc.main.id
  service_name    = "com.amazonaws.${var.region}.s3"
  route_table_ids = [aws_route_table.private.id]
}

resource "aws_vpc_endpoint" "dynamodb" {
  vpc_id          = aws_vpc.main.id
  service_name    = "com.amazonaws.${var.region}.dynamodb"
  route_table_ids = [aws_route_table.private.id]
}

# --- Route tables ---

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }
  tags = { Name = "atlasit-public-rt-${var.env}" }
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id
  route {
    cidr_block           = "0.0.0.0/0"
    network_interface_id = aws_instance.nat.primary_network_interface_id
  }
  tags = { Name = "atlasit-private-rt-${var.env}" }
}

resource "aws_route_table_association" "public" {
  count          = 2
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count          = 2
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}

# --- Security groups ---

resource "aws_security_group" "lambda" {
  name        = "atlasit-lambda-${var.env}"
  description = "Security group for AtlasIT Lambda functions"
  vpc_id      = aws_vpc.main.id

  lifecycle {
    create_before_destroy = false
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "atlasit-lambda-sg-${var.env}" }
}

resource "aws_security_group" "aurora" {
  name_prefix = "atlasit-aurora-${var.env}-"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.lambda.id]
  }

  tags = { Name = "atlasit-aurora-sg-${var.env}" }
}

# DB subnet group for Aurora/RDS
resource "aws_db_subnet_group" "main" {
  name       = "atlasit-${var.env}"
  subnet_ids = aws_subnet.private[*].id

  lifecycle {
    ignore_changes = [subnet_ids]
  }
}
