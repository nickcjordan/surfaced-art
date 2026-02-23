# =============================================================================
# Observability — CloudWatch Log Groups, Alarms, Dashboard, SNS
# =============================================================================
#
# All observability resources are centralized here. Individual Lambda modules
# do NOT define their own log groups — they are managed in this file so
# retention policies and naming are consistent across the platform.
#
# Future issues will add to this file:
#   - SNS topic for alarm notifications (#76)
#   - CloudWatch alarms (#77)
#   - CloudWatch dashboard (#78)

# -----------------------------------------------------------------------------
# API Gateway CloudWatch Logging — IAM Role & Account
# -----------------------------------------------------------------------------
# API Gateway requires a regional account-level setting to push logs to
# CloudWatch. This is a one-time configuration per AWS account per region.
# The IAM role grants API Gateway permission to create log streams and
# put log events into any CloudWatch log group.

resource "aws_iam_role" "api_gateway_cloudwatch" {
  name = "${var.project_name}-${var.environment}-${var.aws_region}-api-gateway-cloudwatch"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "apigateway.amazonaws.com"
      }
    }]
  })

  tags = {
    Name = "${var.project_name}-${var.environment}-${var.aws_region}-api-gateway-cloudwatch"
  }
}

resource "aws_iam_role_policy_attachment" "api_gateway_cloudwatch" {
  role       = aws_iam_role.api_gateway_cloudwatch.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs"
}

resource "aws_api_gateway_account" "main" {
  cloudwatch_role_arn = aws_iam_role.api_gateway_cloudwatch.arn
}

# -----------------------------------------------------------------------------
# CloudWatch Log Groups
# -----------------------------------------------------------------------------
# These log groups depend on each Lambda module exporting a non-sensitive
# `function_name` output (type: string). All three modules (lambda-api,
# lambda-image-processor, lambda-migrate) follow this contract today.
# If a module renames or marks that output as sensitive, these resources
# will fail at plan time — update the reference here accordingly.

# API Lambda — the Hono handler; all route-level application logs.
# 30-day retention: these logs are the primary debugging source.
resource "aws_cloudwatch_log_group" "api_lambda" {
  name              = "/aws/lambda/${module.lambda_api.function_name}"
  retention_in_days = 30

  tags = {
    Name = "${var.project_name}-${var.environment}-api-logs"
  }
}

# Image Processor Lambda — Sharp image processing triggered by S3 uploads.
# 14-day retention: high-volume, low-value once processing is confirmed working.
resource "aws_cloudwatch_log_group" "image_processor_lambda" {
  name              = "/aws/lambda/${module.lambda_image_processor.function_name}"
  retention_in_days = 14

  tags = {
    Name = "${var.project_name}-${var.environment}-image-processor-logs"
  }
}

# Migration Lambda — Prisma migrate deploy invocations.
# 14-day retention: runs infrequently (only on deployments with schema changes).
resource "aws_cloudwatch_log_group" "migrate_lambda" {
  name              = "/aws/lambda/${module.lambda_migrate.function_name}"
  retention_in_days = 14

  tags = {
    Name = "${var.project_name}-${var.environment}-migrate-logs"
  }
}

# API Gateway — request-level access logs (method, path, status, latency).
# 30-day retention: separate from Lambda application logs, captures requests
# that may fail before reaching Lambda (auth errors, integration timeouts).
#
# Uses the same naming convention as the API Gateway resource
# (${project_name}-${environment}-api) rather than a module output reference
# to avoid a circular dependency: the API Gateway stage needs this log group's
# ARN, so this log group cannot depend on the module that contains the stage.
resource "aws_cloudwatch_log_group" "api_gateway" {
  name              = "/aws/apigateway/${var.project_name}-${var.environment}-api"
  retention_in_days = 30

  tags = {
    Name = "${var.project_name}-${var.environment}-api-gateway-logs"
  }
}
