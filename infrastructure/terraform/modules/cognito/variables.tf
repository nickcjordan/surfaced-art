variable "project_name" {
  description = "Project name for resource naming"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "frontend_url" {
  description = "Frontend application URL for OAuth callbacks"
  type        = string
}

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
