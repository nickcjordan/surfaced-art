# Shared infrastructure state — VPC-scoped and account-scoped singletons.
# Unlike per-environment configs, the key is hardcoded (only one shared layer).

terraform {
  backend "s3" {
    bucket         = "surfaced-art-terraform-state"
    key            = "shared/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "surfaced-art-terraform-locks"
  }
}
