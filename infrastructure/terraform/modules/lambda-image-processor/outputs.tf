output "function_name" {
  description = "Image processor Lambda function name"
  value       = aws_lambda_function.image_processor.function_name
}

output "function_arn" {
  description = "Image processor Lambda function ARN"
  value       = aws_lambda_function.image_processor.arn
}
