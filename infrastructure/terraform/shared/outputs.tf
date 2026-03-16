output "vpc_endpoint_s3_id" {
  description = "ID of the S3 VPC gateway endpoint"
  value       = aws_vpc_endpoint.s3.id
}

output "api_gateway_cloudwatch_role_arn" {
  description = "ARN of the IAM role for API Gateway CloudWatch logging"
  value       = aws_iam_role.api_gateway_cloudwatch.arn
}
