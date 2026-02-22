variable "project_name" {
  description = "Project name for resource naming"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "lambda_role_arn" {
  description = "IAM role ARN for Lambda execution"
  type        = string
}

variable "placeholder_image_uri" {
  description = "Container image URI for initial Terraform apply before CI/CD deploys the real image"
  type        = string
}

variable "s3_bucket_name" {
  description = "Name of the S3 media bucket to read from and write to"
  type        = string
}

variable "s3_bucket_arn" {
  description = "ARN of the S3 media bucket (for IAM scoping)"
  type        = string
}

variable "memory_size" {
  description = "Memory size for Lambda function in MB (Sharp needs adequate memory for image processing)"
  type        = number
  default     = 512
}

variable "timeout" {
  description = "Timeout for Lambda function in seconds"
  type        = number
  default     = 60
}

variable "log_retention_days" {
  description = "CloudWatch log group retention in days"
  type        = number
  default     = 14
}
