# Terraform state backend configuration
# S3 bucket and DynamoDB table must be created before running terraform init
# See bootstrap/README.md for initial setup instructions

terraform {
  backend "s3" {
    bucket         = "surfaced-art-terraform-state"
    key            = "terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "surfaced-art-terraform-locks"
  }
}
