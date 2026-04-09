terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }

  backend "s3" {
    bucket         = "atlasit-terraform-state-457335975503"
    key            = "aws/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "atlasit-terraform-locks"
  }
}

provider "aws" {
  region = var.region
  default_tags {
    tags = {
      Project     = "AtlasIT"
      Environment = var.env
      ManagedBy   = "terraform"
    }
  }
}

# CloudFront requires ACM certificates in us-east-1
provider "aws" {
  alias  = "use1"
  region = "us-east-1"
  default_tags {
    tags = {
      Project     = "AtlasIT"
      Environment = var.env
      ManagedBy   = "terraform"
    }
  }
}
