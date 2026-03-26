terraform {
  backend "s3" {
    bucket         = "atlasit-tfstate-457335975503"
    key            = "environments/dev/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "atlasit-tflock"
    encrypt        = true
  }
}
