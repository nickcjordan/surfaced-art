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

variable "s3_bucket_arn" {
  description = "ARN of the S3 bucket for media storage"
  type        = string
}

variable "ses_domain" {
  description = "Domain for SES email sending"
  type        = string
}

variable "lambda_ecr_repository_arn" {
  description = "ARN of the ECR repository used by the Lambda container image"
  type        = string
}
