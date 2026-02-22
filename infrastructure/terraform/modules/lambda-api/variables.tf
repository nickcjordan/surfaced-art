variable "project_name" {
  description = "Project name for resource naming"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID for Lambda"
  type        = string
}

variable "vpc_cidr" {
  description = "VPC CIDR block for restricting database egress"
  type        = string
}

variable "subnet_ids" {
  description = "Subnet IDs for Lambda VPC configuration"
  type        = list(string)
}

variable "memory_size" {
  description = "Lambda memory size in MB"
  type        = number
  default     = 256
}

variable "timeout" {
  description = "Lambda timeout in seconds"
  type        = number
  default     = 30
}

variable "lambda_role_arn" {
  description = "ARN of the Lambda execution role"
  type        = string
}

variable "frontend_url" {
  description = "Frontend URL for CORS"
  type        = string
}

variable "database_url" {
  description = "PostgreSQL connection string"
  type        = string
  sensitive   = true
}

variable "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  type        = string
}

variable "cognito_client_id" {
  description = "Cognito App Client ID"
  type        = string
}

variable "s3_bucket_name" {
  description = "S3 bucket name for media"
  type        = string
}

variable "cloudfront_url" {
  description = "CloudFront distribution URL"
  type        = string
}

variable "placeholder_image_uri" {
  description = "Lambda base image URI used as a placeholder until CI/CD deploys the service image. Must match LAMBDA_BOOTSTRAP_IMAGE in .github/workflows/deploy.yml."
  type        = string
  default     = "public.ecr.aws/lambda/nodejs:20"
}
