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
  description = "Lambda base image URI used as a placeholder until CI/CD deploys the service image. Value is passed from the root module; source of truth is LAMBDA_BOOTSTRAP_IMAGE in .github/workflows/deploy.yml."
  type        = string
}

variable "api_gateway_log_group_arn" {
  description = "ARN of the CloudWatch log group for API Gateway access logs"
  type        = string
}

variable "ses_from_address" {
  description = "SES sender email address (e.g. support@surfacedart.com)"
  type        = string
}

variable "ses_configuration_set_name" {
  description = "SES configuration set name for email tracking"
  type        = string
}

variable "log_retention_days" {
  description = "CloudWatch log group retention in days"
  type        = number
  default     = 30
}

variable "reserved_concurrent_executions" {
  description = "Maximum concurrent Lambda instances. Limits DB connections: db.t3.micro supports ~87, so cap this below that to leave headroom for migrations and admin. Set to -1 to disable (unreserved)."
  type        = number
  default     = 40
}
