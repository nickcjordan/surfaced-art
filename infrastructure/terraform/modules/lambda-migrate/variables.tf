variable "project_name" {
  description = "Project name for resource naming"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID for Lambda and security group"
  type        = string
}

variable "subnet_ids" {
  description = "Subnet IDs for Lambda VPC configuration"
  type        = list(string)
}

variable "vpc_cidr" {
  description = "VPC CIDR block (for scoping PostgreSQL egress to VPC only)"
  type        = string
}

variable "lambda_role_arn" {
  description = "IAM role ARN for Lambda execution"
  type        = string
}

variable "placeholder_image_uri" {
  description = "Container image URI for initial Terraform apply"
  type        = string
}

variable "database_url" {
  description = "PostgreSQL connection string"
  type        = string
  sensitive   = true
}

variable "memory_size" {
  description = "Memory size for Lambda function in MB"
  type        = number
  default     = 512
}

variable "timeout" {
  description = "Timeout for Lambda function in seconds"
  type        = number
  default     = 120
}
