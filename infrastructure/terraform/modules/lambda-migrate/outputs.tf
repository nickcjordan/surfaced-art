output "function_name" {
  description = "Migration Lambda function name"
  value       = aws_lambda_function.migrate.function_name
}

output "function_arn" {
  description = "Migration Lambda function ARN"
  value       = aws_lambda_function.migrate.arn
}

output "security_group_id" {
  description = "Migration Lambda security group ID"
  value       = aws_security_group.migrate.id
}
