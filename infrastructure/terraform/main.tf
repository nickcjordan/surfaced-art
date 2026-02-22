provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

# VPC for RDS (using default VPC for simplicity at launch)
data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

# ECR repository for Lambda container images
# Defined here (not in lambda-api module) so IAM can scope permissions to this ARN
# without creating a circular dependency (lambda-api depends on iam for the role ARN).
resource "aws_ecr_repository" "api" {
  name                 = "${var.project_name}-${var.environment}-api"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-api-ecr"
  }
}

# Keep only the last 10 images to minimize storage costs
resource "aws_ecr_lifecycle_policy" "api" {
  repository = aws_ecr_repository.api.name

  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep last 10 images"
      selection = {
        tagStatus   = "any"
        countType   = "imageCountMoreThan"
        countNumber = 10
      }
      action = { type = "expire" }
    }]
  })
}

# IAM module - creates roles and policies
module "iam" {
  source = "./modules/iam"

  project_name = var.project_name
  environment  = var.environment
  aws_region   = var.aws_region

  s3_bucket_arn             = module.s3_cloudfront.bucket_arn
  ses_domain                = var.ses_domain
  lambda_ecr_repository_arn = aws_ecr_repository.api.arn
}

# RDS PostgreSQL module
module "rds" {
  source = "./modules/rds"

  project_name    = var.project_name
  environment     = var.environment
  vpc_id          = data.aws_vpc.default.id
  subnet_ids      = data.aws_subnets.default.ids
  instance_class  = var.db_instance_class
  db_name         = var.db_name
  db_username     = var.db_username
  db_password     = var.db_password
  lambda_sg_id    = module.lambda_api.security_group_id
}

# S3 + CloudFront module
module "s3_cloudfront" {
  source = "./modules/s3-cloudfront"

  project_name = var.project_name
  environment  = var.environment
}

# Cognito module
module "cognito" {
  source = "./modules/cognito"

  project_name         = var.project_name
  environment          = var.environment
  frontend_url         = var.frontend_url
  google_client_id     = var.google_client_id
  google_client_secret = var.google_client_secret
  apple_client_id      = var.apple_client_id
  apple_team_id        = var.apple_team_id
  apple_key_id         = var.apple_key_id
  apple_private_key    = var.apple_private_key
}

# SES module
module "ses" {
  source = "./modules/ses"

  project_name = var.project_name
  environment  = var.environment
  domain       = var.ses_domain
}

# Lambda + API Gateway module
module "lambda_api" {
  source = "./modules/lambda-api"

  project_name    = var.project_name
  environment     = var.environment
  aws_region      = var.aws_region
  vpc_id          = data.aws_vpc.default.id
  vpc_cidr        = data.aws_vpc.default.cidr_block
  subnet_ids      = data.aws_subnets.default.ids
  memory_size     = var.lambda_memory_size
  timeout         = var.lambda_timeout
  lambda_role_arn = module.iam.lambda_role_arn
  frontend_url    = var.frontend_url

  # Environment variables for Lambda
  database_url     = module.rds.connection_string
  cognito_user_pool_id = module.cognito.user_pool_id
  cognito_client_id    = module.cognito.client_id
  s3_bucket_name       = module.s3_cloudfront.bucket_name
  cloudfront_url       = module.s3_cloudfront.cloudfront_url
}
