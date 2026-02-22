variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
  default     = "surfaced-art"
}

# Database variables
variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_name" {
  description = "PostgreSQL database name"
  type        = string
  default     = "surfaced_art"
}

variable "db_username" {
  description = "PostgreSQL master username"
  type        = string
  default     = "postgres"
}

variable "db_password" {
  description = "PostgreSQL master password (never commit this)"
  type        = string
  sensitive   = true
}

# Cognito OAuth variables
variable "google_client_id" {
  description = "Google OAuth client ID"
  type        = string
  sensitive   = true
}

variable "google_client_secret" {
  description = "Google OAuth client secret"
  type        = string
  sensitive   = true
}

variable "apple_client_id" {
  description = "Apple OAuth client ID (Services ID)"
  type        = string
  sensitive   = true
  default     = ""
}

variable "apple_team_id" {
  description = "Apple Developer Team ID"
  type        = string
  sensitive   = true
  default     = ""
}

variable "apple_key_id" {
  description = "Apple Sign In Key ID"
  type        = string
  sensitive   = true
  default     = ""
}

variable "apple_private_key" {
  description = "Apple Sign In private key (PEM format)"
  type        = string
  sensitive   = true
  default     = ""
}

# SES variables
variable "ses_domain" {
  description = "Domain for SES email sending"
  type        = string
  default     = "surfaced.art"
}

# Lambda variables
variable "lambda_memory_size" {
  description = "Memory size for Lambda functions in MB"
  type        = number
  default     = 256
}

variable "lambda_timeout" {
  description = "Timeout for Lambda functions in seconds"
  type        = number
  default     = 30
}

# Application URLs
variable "frontend_url" {
  description = "Frontend application URL (for CORS and Cognito callbacks)"
  type        = string
  default     = "https://surfaced.art"
}

variable "placeholder_image_uri" {
  description = "Lambda base image URI used as a placeholder until CI/CD deploys the service image. CI always passes this via -var from LAMBDA_BOOTSTRAP_IMAGE in deploy.yml (single source of truth). Default is used only for local terraform apply runs; update via: bash scripts/get-lambda-bootstrap-digest.sh"
  type        = string
  default     = "public.ecr.aws/lambda/nodejs@sha256:b1d950b97aaedc054c6c9c5409c98cf5c8f29de370a6f344113e1aeeaa441707"
}
