output "api_gateway_url" {
  description = "API Gateway endpoint URL"
  value       = module.lambda_api.api_gateway_url
}

output "database_endpoint" {
  description = "RDS PostgreSQL endpoint"
  value       = module.rds.endpoint
  sensitive   = true
}

output "cloudfront_distribution_url" {
  description = "CloudFront distribution URL for media assets"
  value       = module.s3_cloudfront.cloudfront_url
}

output "s3_bucket_name" {
  description = "S3 bucket name for media uploads"
  value       = module.s3_cloudfront.bucket_name
}

output "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  value       = module.cognito.user_pool_id
}

output "cognito_client_id" {
  description = "Cognito App Client ID"
  value       = module.cognito.client_id
}

output "cognito_domain" {
  description = "Cognito hosted UI domain"
  value       = module.cognito.domain
}

output "ses_domain_identity_arn" {
  description = "SES domain identity ARN"
  value       = module.ses.domain_identity_arn
}

output "lambda_function_name" {
  description = "Lambda function name for deployments"
  value       = module.lambda_api.function_name
}

output "ecr_repository_url" {
  description = "ECR repository URL for pushing Lambda container images"
  value       = aws_ecr_repository.api.repository_url
}
