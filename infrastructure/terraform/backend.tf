# Terraform state backend configuration
# S3 bucket and DynamoDB table must be created before running terraform init
# See bootstrap/README.md for initial setup instructions
#
# State key is set dynamically during init:
#   terraform init -backend-config="key=dev/terraform.tfstate"
#   terraform init -backend-config="key=prod/terraform.tfstate"

terraform {
  backend "s3" {
    bucket         = "surfaced-art-terraform-state"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "surfaced-art-terraform-locks"
    # key is set via -backend-config during init
  }
}
