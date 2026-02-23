# =============================================================================
# Observability — CloudWatch Log Groups, Alarms, Dashboard, SNS
# =============================================================================
#
# All observability resources are centralized here. Individual Lambda modules
# do NOT define their own log groups — they are managed in this file so
# retention policies and naming are consistent across the platform.
#

# -----------------------------------------------------------------------------
# SNS Topic for Alarm Notifications
# -----------------------------------------------------------------------------
# All CloudWatch alarms deliver to this single SNS topic. Email subscription
# is configured for launch — Slack integration can be added later via AWS
# Chatbot or a Lambda subscriber.
#
# NOTE: After terraform apply, someone must click the confirmation link in
# the AWS email to activate the subscription. This is the only manual step.

resource "aws_sns_topic" "platform_alerts" {
  name = "${var.project_name}-${var.environment}-platform-alerts"

  tags = {
    Name = "${var.project_name}-${var.environment}-platform-alerts"
  }
}

resource "aws_sns_topic_subscription" "alert_email" {
  topic_arn = aws_sns_topic.platform_alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email_address
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

# -----------------------------------------------------------------------------
# CloudWatch Alarms
# -----------------------------------------------------------------------------
# Each alarm monitors a specific metric with thresholds tuned to avoid false
# positives while catching real problems early. All alarms deliver to the
# shared SNS topic and send recovery notifications on OK state.

# 5.1 — API Lambda Error Rate
# Catches unhandled exceptions, timeout errors, out-of-memory crashes.
# Threshold of 5 errors in two consecutive 5-minute periods avoids false
# alarms from single transient failures.
resource "aws_cloudwatch_metric_alarm" "api_lambda_errors" {
  alarm_name          = "surfaced-${var.environment}-api-lambda-errors"
  alarm_description   = "API Lambda error count exceeded threshold"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 5
  treat_missing_data  = "notBreaching"
  alarm_actions       = [aws_sns_topic.platform_alerts.arn]
  ok_actions          = [aws_sns_topic.platform_alerts.arn]

  dimensions = {
    FunctionName = module.lambda_api.function_name
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-api-lambda-errors-alarm"
  }
}

# 5.2 — API Lambda Duration (P95)
# Catches gradual performance degradation before it causes timeouts.
# Threshold is 80% of the configured Lambda timeout (30s × 0.8 = 24s).
resource "aws_cloudwatch_metric_alarm" "api_lambda_duration" {
  alarm_name          = "surfaced-${var.environment}-api-lambda-duration-p95"
  alarm_description   = "API Lambda P95 duration approaching timeout"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "Duration"
  namespace           = "AWS/Lambda"
  period              = 300
  extended_statistic  = "p95"
  threshold           = var.lambda_timeout * 1000 * 0.8
  treat_missing_data  = "notBreaching"
  alarm_actions       = [aws_sns_topic.platform_alerts.arn]
  ok_actions          = [aws_sns_topic.platform_alerts.arn]

  dimensions = {
    FunctionName = module.lambda_api.function_name
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-api-lambda-duration-alarm"
  }
}

# 5.3 — RDS Database Connections
# A db.t3.micro has max_connections around 87 (dependent on memory).
# Threshold of 80 gives warning before hard failures. When this alarm fires,
# add RDS Proxy via Terraform — no application code changes required.
resource "aws_cloudwatch_metric_alarm" "rds_connections" {
  alarm_name          = "surfaced-${var.environment}-rds-connection-count"
  alarm_description   = "RDS connection count approaching limit — evaluate adding RDS Proxy"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Maximum"
  threshold           = 80
  treat_missing_data  = "notBreaching"
  alarm_actions       = [aws_sns_topic.platform_alerts.arn]
  ok_actions          = [aws_sns_topic.platform_alerts.arn]

  dimensions = {
    DBInstanceIdentifier = module.rds.identifier
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-rds-connections-alarm"
  }
}

# 5.4 — RDS Free Storage Space
# Threshold is 2GB. treat_missing_data = "breaching" because if we stop
# getting storage metrics, something is wrong.
resource "aws_cloudwatch_metric_alarm" "rds_free_storage" {
  alarm_name          = "surfaced-${var.environment}-rds-low-storage"
  alarm_description   = "RDS free storage below 2GB"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 1
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Minimum"
  threshold           = 2000000000
  treat_missing_data  = "breaching"
  alarm_actions       = [aws_sns_topic.platform_alerts.arn]
  ok_actions          = [aws_sns_topic.platform_alerts.arn]

  dimensions = {
    DBInstanceIdentifier = module.rds.identifier
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-rds-storage-alarm"
  }
}

# 5.5 — API Gateway 5xx Errors
# Catches errors at the API Gateway level that may not surface as Lambda
# errors — integration timeouts, Lambda invocation failures, throttling.
resource "aws_cloudwatch_metric_alarm" "api_gateway_5xx" {
  alarm_name          = "surfaced-${var.environment}-api-gateway-5xx"
  alarm_description   = "API Gateway returning 5xx errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "5xx"
  namespace           = "AWS/ApiGateway"
  period              = 300
  statistic           = "Sum"
  threshold           = 5
  treat_missing_data  = "notBreaching"
  alarm_actions       = [aws_sns_topic.platform_alerts.arn]
  ok_actions          = [aws_sns_topic.platform_alerts.arn]

  dimensions = {
    ApiId = module.lambda_api.api_gateway_id
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-api-gateway-5xx-alarm"
  }
}

# -----------------------------------------------------------------------------
# CloudWatch Dashboard
# -----------------------------------------------------------------------------
# A single dashboard provides a visual overview of platform health. Defined
# entirely in Terraform as a JSON document — changes go through PR review.
# When new Lambda functions are added, add a new row of widgets following
# the same pattern.

resource "aws_cloudwatch_dashboard" "platform" {
  dashboard_name = "surfaced-art-${var.environment}-platform"

  dashboard_body = jsonencode({
    widgets = [
      # --- Row 1: API Lambda metrics ---
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          title = "API Lambda — Invocations & Errors"
          metrics = [
            ["AWS/Lambda", "Invocations", "FunctionName", module.lambda_api.function_name, { stat = "Sum", color = "#2ca02c" }],
            ["AWS/Lambda", "Errors", "FunctionName", module.lambda_api.function_name, { stat = "Sum", color = "#d62728" }],
            ["AWS/Lambda", "Throttles", "FunctionName", module.lambda_api.function_name, { stat = "Sum", color = "#ff7f0e" }]
          ]
          period  = 300
          region  = var.aws_region
          view    = "timeSeries"
          stacked = false
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        properties = {
          title = "API Lambda — Duration"
          metrics = [
            ["AWS/Lambda", "Duration", "FunctionName", module.lambda_api.function_name, { stat = "Average", color = "#1f77b4" }],
            ["AWS/Lambda", "Duration", "FunctionName", module.lambda_api.function_name, { stat = "p95", color = "#ff7f0e" }],
            ["AWS/Lambda", "Duration", "FunctionName", module.lambda_api.function_name, { stat = "Maximum", color = "#d62728" }]
          ]
          period = 300
          region = var.aws_region
          view   = "timeSeries"
        }
      },

      # --- Row 2: Image Processor Lambda ---
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6
        properties = {
          title = "Image Processor Lambda — Invocations & Errors"
          metrics = [
            ["AWS/Lambda", "Invocations", "FunctionName", module.lambda_image_processor.function_name, { stat = "Sum", color = "#2ca02c" }],
            ["AWS/Lambda", "Errors", "FunctionName", module.lambda_image_processor.function_name, { stat = "Sum", color = "#d62728" }]
          ]
          period = 300
          region = var.aws_region
          view   = "timeSeries"
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 6
        width  = 12
        height = 6
        properties = {
          title = "Image Processor Lambda — Duration"
          metrics = [
            ["AWS/Lambda", "Duration", "FunctionName", module.lambda_image_processor.function_name, { stat = "Average", color = "#1f77b4" }],
            ["AWS/Lambda", "Duration", "FunctionName", module.lambda_image_processor.function_name, { stat = "p95", color = "#ff7f0e" }]
          ]
          period = 300
          region = var.aws_region
          view   = "timeSeries"
        }
      },

      # --- Row 3: API Gateway ---
      {
        type   = "metric"
        x      = 0
        y      = 12
        width  = 12
        height = 6
        properties = {
          title = "API Gateway — Request Count & Errors"
          metrics = [
            ["AWS/ApiGateway", "Count", "ApiId", module.lambda_api.api_gateway_id, { stat = "Sum", color = "#1f77b4" }],
            ["AWS/ApiGateway", "4xx", "ApiId", module.lambda_api.api_gateway_id, { stat = "Sum", color = "#ff7f0e" }],
            ["AWS/ApiGateway", "5xx", "ApiId", module.lambda_api.api_gateway_id, { stat = "Sum", color = "#d62728" }]
          ]
          period = 300
          region = var.aws_region
          view   = "timeSeries"
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 12
        width  = 12
        height = 6
        properties = {
          title = "API Gateway — Latency"
          metrics = [
            ["AWS/ApiGateway", "Latency", "ApiId", module.lambda_api.api_gateway_id, { stat = "Average", color = "#1f77b4" }],
            ["AWS/ApiGateway", "Latency", "ApiId", module.lambda_api.api_gateway_id, { stat = "p95", color = "#ff7f0e" }]
          ]
          period = 300
          region = var.aws_region
          view   = "timeSeries"
        }
      },

      # --- Row 4: RDS ---
      {
        type   = "metric"
        x      = 0
        y      = 18
        width  = 8
        height = 6
        properties = {
          title = "RDS — Connections"
          metrics = [
            ["AWS/RDS", "DatabaseConnections", "DBInstanceIdentifier", module.rds.identifier, { stat = "Maximum", color = "#9467bd" }]
          ]
          period = 300
          region = var.aws_region
          view   = "timeSeries"
        }
      },
      {
        type   = "metric"
        x      = 8
        y      = 18
        width  = 8
        height = 6
        properties = {
          title = "RDS — CPU Utilization"
          metrics = [
            ["AWS/RDS", "CPUUtilization", "DBInstanceIdentifier", module.rds.identifier, { stat = "Average", color = "#e377c2" }]
          ]
          period = 300
          region = var.aws_region
          view   = "timeSeries"
          yAxis  = { left = { max = 100 } }
        }
      },
      {
        type   = "metric"
        x      = 16
        y      = 18
        width  = 8
        height = 6
        properties = {
          title = "RDS — Free Storage (GB)"
          metrics = [
            [{ expression = "m1 / 1073741824", label = "Free Storage (GB)", id = "e1", color = "#17becf" }],
            ["AWS/RDS", "FreeStorageSpace", "DBInstanceIdentifier", module.rds.identifier, { stat = "Minimum", id = "m1", visible = false }]
          ]
          period = 300
          region = var.aws_region
          view   = "timeSeries"
        }
      }
    ]
  })
}
