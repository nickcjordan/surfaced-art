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

data "aws_caller_identity" "current" {}

# ECR repository for Lambda container images
# Defined here (not in lambda-api module) so IAM can scope permissions to this ARN
# without creating a circular dependency (lambda-api depends on iam for the role ARN).
resource "aws_ecr_repository" "api" {
  name                 = "${var.project_name}-${var.environment}-api"
  image_tag_mutability = "IMMUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-api-ecr"
  }
}

# ECR resource policy: allows Lambda service to pull the container image.
# Lambda container images require BOTH an identity-based policy on the execution
# role AND a resource-based policy on the repository. Using the Lambda service
# principal with an aws:SourceAccount condition avoids a circular dependency
# (IAM module → ECR ARN → IAM role ARN) while scoping access to this account only.
data "aws_iam_policy_document" "ecr_lambda" {
  statement {
    sid    = "LambdaECRImageRetrievalPolicy"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }

    actions = [
      "ecr:GetDownloadUrlForLayer",
      "ecr:BatchGetImage",
      "ecr:BatchCheckLayerAvailability",
    ]

    condition {
      test     = "StringEquals"
      variable = "aws:SourceAccount"
      values   = [data.aws_caller_identity.current.account_id]
    }
  }
}

resource "aws_ecr_repository_policy" "api" {
  repository = aws_ecr_repository.api.name
  policy     = data.aws_iam_policy_document.ecr_lambda.json
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

# ECR repository for migration Lambda container images
resource "aws_ecr_repository" "migrate" {
  name                 = "${var.project_name}-${var.environment}-migrate"
  image_tag_mutability = "IMMUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-migrate-ecr"
  }
}

resource "aws_ecr_repository_policy" "migrate" {
  repository = aws_ecr_repository.migrate.name
  policy     = data.aws_iam_policy_document.ecr_lambda.json
}

resource "aws_ecr_lifecycle_policy" "migrate" {
  repository = aws_ecr_repository.migrate.name

  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep last ${var.migrate_ecr_max_images} images"
      selection = {
        tagStatus   = "any"
        countType   = "imageCountMoreThan"
        countNumber = var.migrate_ecr_max_images
      }
      action = { type = "expire" }
    }]
  })
}

# ECR repository for image processor Lambda container images
resource "aws_ecr_repository" "image_processor" {
  name                 = "${var.project_name}-${var.environment}-image-processor"
  image_tag_mutability = "IMMUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-image-processor-ecr"
  }
}

resource "aws_ecr_repository_policy" "image_processor" {
  repository = aws_ecr_repository.image_processor.name
  policy     = data.aws_iam_policy_document.ecr_lambda.json
}

resource "aws_ecr_lifecycle_policy" "image_processor" {
  repository = aws_ecr_repository.image_processor.name

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

  s3_bucket_arn              = module.s3_cloudfront.bucket_arn
  ses_domain                 = var.ses_domain
  lambda_ecr_repository_arns = [aws_ecr_repository.api.arn, aws_ecr_repository.migrate.arn, aws_ecr_repository.image_processor.arn]
}

# RDS PostgreSQL module
module "rds" {
  source = "./modules/rds"

  project_name   = var.project_name
  environment    = var.environment
  vpc_id         = data.aws_vpc.default.id
  subnet_ids     = data.aws_subnets.default.ids
  instance_class = var.db_instance_class
  db_name        = var.db_name
  db_username    = var.db_username
  db_password    = var.db_password
  # Not a circular dependency: Terraform resolves at the resource level, not module level.
  # The SG resources in lambda_api/lambda_migrate have no dependency on RDS, so Terraform
  # creates them first, then the RDS SG (which references them), then the DB instance,
  # then the Lambda functions (which consume the connection string).
  lambda_sg_ids = [module.lambda_api.security_group_id, module.lambda_migrate.security_group_id]
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
# depends_on ensures the ECR repository policy exists before Lambda is created,
# so the function can pull its container image. This replaces the need for
# -target ordering in CI for anything beyond the bootstrap image push.
module "lambda_api" {
  source = "./modules/lambda-api"

  project_name          = var.project_name
  environment           = var.environment
  aws_region            = var.aws_region
  vpc_id                = data.aws_vpc.default.id
  vpc_cidr              = data.aws_vpc.default.cidr_block
  subnet_ids            = data.aws_subnets.default.ids
  memory_size           = var.lambda_memory_size
  timeout               = var.lambda_timeout
  lambda_role_arn       = module.iam.lambda_role_arn
  frontend_url          = var.frontend_url
  placeholder_image_uri = var.placeholder_image_uri

  # Environment variables for Lambda
  database_url               = module.rds.connection_string
  cognito_user_pool_id       = module.cognito.user_pool_id
  cognito_client_id          = module.cognito.client_id
  s3_bucket_name             = module.s3_cloudfront.bucket_name
  cloudfront_url             = module.s3_cloudfront.cloudfront_url
  ses_from_address           = "support@${var.ses_domain}"
  ses_configuration_set_name = module.ses.configuration_set_name

  # Observability — log group managed centrally in observability.tf
  api_gateway_log_group_arn = aws_cloudwatch_log_group.api_gateway.arn

  depends_on = [aws_ecr_repository_policy.api]
}

# Migration Lambda module — runs prisma migrate deploy within the VPC
module "lambda_migrate" {
  source = "./modules/lambda-migrate"

  project_name          = var.project_name
  environment           = var.environment
  vpc_id                = data.aws_vpc.default.id
  vpc_cidr              = data.aws_vpc.default.cidr_block
  subnet_ids            = data.aws_subnets.default.ids
  lambda_role_arn       = module.iam.lambda_role_arn
  placeholder_image_uri = var.placeholder_image_uri
  database_url          = module.rds.connection_string

  depends_on = [aws_ecr_repository_policy.migrate]
}

# Image processor Lambda module — generates WebP variants for uploaded images.
# NOT in a VPC — only needs S3 access, no database connectivity required.
module "lambda_image_processor" {
  source = "./modules/lambda-image-processor"

  project_name          = var.project_name
  environment           = var.environment
  lambda_role_arn       = module.iam.lambda_role_arn
  placeholder_image_uri = var.placeholder_image_uri
  s3_bucket_name        = module.s3_cloudfront.bucket_name
  s3_bucket_arn         = module.s3_cloudfront.bucket_arn

  depends_on = [aws_ecr_repository_policy.image_processor]
}
