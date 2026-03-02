# Surfaced Art — Observability & Monitoring Brief
## Terraform-Managed CloudWatch Setup

---

## About This Document

This brief is written for a Claude Code session. It defines the observability and monitoring infrastructure for the Surfaced Art platform. Everything described here is implemented in Terraform — nothing is created manually in the AWS console.

You have access to supporting documents in the project archive:

- **Technical Architecture v1.0** — full stack decisions, AWS service map, infrastructure choices
- **Build Order v1.0** — phased plan; observability should be wired in during Phase 1 (Foundation)
- **Claude Code Build Brief (Phase 1 & 2)** — existing Terraform and infrastructure context

Read those documents if you need context on existing infrastructure decisions. Do not re-litigate decisions already made in those documents. Your job is to build, not to redesign.

---

## What This Covers

All Lambda functions, API Gateway, and RDS need to be observable from day one. The goal is a single CloudWatch dashboard showing platform health, structured application logs queryable via CloudWatch Logs Insights, and alarms that notify on failure conditions — all defined as Terraform resources in `infrastructure/terraform/`.

---

## 1. CloudWatch Log Groups with Retention

Lambda automatically sends all `console.log` and `console.error` output to CloudWatch Logs. However, the default retention is **forever**, which accumulates cost. Define explicit log groups with retention policies in Terraform so they exist before the Lambda functions first write to them.

```hcl
resource "aws_cloudwatch_log_group" "api_lambda" {
  name              = "/aws/lambda/${aws_lambda_function.api.function_name}"
  retention_in_days = 30
}

resource "aws_cloudwatch_log_group" "image_processor" {
  name              = "/aws/lambda/${aws_lambda_function.image_processor.function_name}"
  retention_in_days = 14
}

resource "aws_cloudwatch_log_group" "api_gateway" {
  name              = "/aws/apigateway/${aws_apigatewayv2_api.main.name}"
  retention_in_days = 30
}
```

**Rules:**
- One log group per Lambda function, plus one for API Gateway access logs
- API Lambda (the Hono handler): 30 days retention — this is where all route-level logs live
- Image processor Lambda (Sharp): 14 days — shorter because these are high-volume, low-value logs once processing is confirmed working
- API Gateway access logs: 30 days — request-level logs (method, path, status, latency) separate from application logs
- Add a log group for any future Lambda function (e.g., webhook handlers, scheduled jobs) at the time it is created in Terraform

---

## 2. API Gateway Access Logging

API Gateway can log every inbound request independently from the Lambda application logs. This captures requests that may fail before reaching Lambda (auth errors, integration timeouts, malformed requests). Enable it on the API Gateway stage.

```hcl
resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.main.id
  name        = "$default"
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway.arn
    format = jsonencode({
      requestId               = "$context.requestId"
      ip                      = "$context.identity.sourceIp"
      httpMethod              = "$context.httpMethod"
      path                    = "$context.path"
      status                  = "$context.status"
      responseLatency         = "$context.responseLatency"
      integrationErrorMessage = "$context.integrationErrorMessage"
    })
  }
}
```

**Notes:**
- The format is structured JSON — this makes it queryable in CloudWatch Logs Insights
- `integrationErrorMessage` captures Lambda invocation failures that the Lambda function itself never sees
- `responseLatency` is end-to-end from API Gateway's perspective, including Lambda cold start time
- The API Gateway execution role needs permission to write to CloudWatch Logs — add a `logs:CreateLogGroup`, `logs:CreateLogStream`, `logs:PutLogEvents` policy

**Required IAM for API Gateway logging:**
```hcl
resource "aws_api_gateway_account" "main" {
  cloudwatch_role_arn = aws_iam_role.api_gateway_cloudwatch.arn
}

resource "aws_iam_role" "api_gateway_cloudwatch" {
  name = "api-gateway-cloudwatch"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = { Service = "apigateway.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "api_gateway_cloudwatch" {
  role       = aws_iam_role.api_gateway_cloudwatch.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs"
}
```

---

## 3. Structured Application Logging

Raw `console.log` strings are difficult to query. All application logging in the Hono backend should output structured JSON so CloudWatch Logs Insights can filter and aggregate by field.

**Create a logger utility in `packages/utils/src/logger.ts`:**

```typescript
type LogLevel = "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  [key: string]: unknown;
}

function log(level: LogLevel, message: string, data?: Record<string, unknown>): void {
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...data,
  };

  if (level === "error") {
    console.error(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}

export const logger = {
  info: (message: string, data?: Record<string, unknown>) => log("info", message, data),
  warn: (message: string, data?: Record<string, unknown>) => log("warn", message, data),
  error: (message: string, data?: Record<string, unknown>) => log("error", message, data),
};
```

**Usage in Hono route handlers:**

```typescript
import { logger } from "@surfaced/utils";

app.get("/artists/:slug", async (c) => {
  const { slug } = c.req.param();
  const start = Date.now();

  const artist = await getArtistBySlug(slug);

  if (!artist) {
    logger.warn("Artist not found", { slug });
    return c.json({ error: "Not found" }, 404);
  }

  logger.info("Artist profile fetched", {
    slug,
    artistId: artist.id,
    listingCount: artist.listings.length,
    durationMs: Date.now() - start,
  });

  return c.json(artist);
});
```

**CloudWatch Logs Insights queries this enables:**

```
# All errors in the last hour
fields @timestamp, message, @logStream
| filter level = "error"
| sort @timestamp desc
| limit 50

# Slowest API responses
fields @timestamp, message, durationMs, slug
| filter durationMs > 1000
| sort durationMs desc
| limit 20

# Request volume by route pattern
fields message
| filter level = "info"
| stats count() by message
| sort count() desc
```

**Rules:**
- Never use raw `console.log("something happened")` in route handlers — always use the structured logger
- Always include timing (`durationMs`) on database-backed endpoints
- Always include the entity ID being operated on (slug, listingId, orderId) for traceability
- Error logs should include the error message and stack trace where available
- Do not log sensitive data (emails, passwords, payment details, full addresses)
- Export `logger` from `packages/utils/index.ts` so it is available to both `apps/api` and any future Lambda functions

---

## 4. SNS Topic for Alarm Notifications

All CloudWatch alarms deliver to a single SNS topic. Email subscription is configured for launch — Slack integration can be added later via AWS Chatbot or a Lambda subscriber.

```hcl
resource "aws_sns_topic" "platform_alerts" {
  name = "surfaced-platform-alerts"
}

resource "aws_sns_topic_subscription" "alert_email" {
  topic_arn = aws_sns_topic.platform_alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email_address
}
```

**Notes:**
- `var.alert_email_address` is a Terraform variable — add it to `variables.tf` and set via `terraform.tfvars` or GitHub Actions secrets
- The email subscription requires manual confirmation (AWS sends a confirmation email that must be clicked once). This is the only manual step in the entire observability setup
- Add `TF_VAR_alert_email_address` to the GitHub Actions secrets list in the CI/CD configuration

---

## 5. CloudWatch Alarms

Alarms monitor specific metrics and trigger notifications when thresholds are breached. Define one alarm per critical condition.

### 5.1 Lambda Error Rate — API Handler

```hcl
resource "aws_cloudwatch_metric_alarm" "api_lambda_errors" {
  alarm_name          = "surfaced-api-lambda-errors"
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
    FunctionName = aws_lambda_function.api.function_name
  }
}
```

**What it catches:** Unhandled exceptions, timeout errors, out-of-memory crashes in the API Lambda. Threshold of 5 errors in two consecutive 5-minute periods avoids false alarms from single transient failures.

### 5.2 Lambda Duration — API Handler (P95)

```hcl
resource "aws_cloudwatch_metric_alarm" "api_lambda_duration" {
  alarm_name          = "surfaced-api-lambda-duration-p95"
  alarm_description   = "API Lambda P95 duration approaching timeout"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "Duration"
  namespace           = "AWS/Lambda"
  period              = 300
  extended_statistic  = "p95"
  threshold           = 8000
  treat_missing_data  = "notBreaching"
  alarm_actions       = [aws_sns_topic.platform_alerts.arn]

  dimensions = {
    FunctionName = aws_lambda_function.api.function_name
  }
}
```

**What it catches:** Gradual performance degradation before it causes timeouts. If the Lambda timeout is set to 10 seconds, an 8-second P95 threshold gives early warning. Adjust the threshold to 80% of whatever timeout value is configured.

### 5.3 RDS Database Connections

```hcl
resource "aws_cloudwatch_metric_alarm" "rds_connections" {
  alarm_name          = "surfaced-rds-connection-count"
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

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.identifier
  }
}
```

**What it catches:** This is the alarm already flagged in the Technical Architecture document as the trigger for adding RDS Proxy. A db.t3.micro has a max_connections around 87 (dependent on memory). Threshold of 80 gives warning before hard failures. When this alarm fires, add RDS Proxy via Terraform — no application code changes required.

### 5.4 RDS Free Storage Space

```hcl
resource "aws_cloudwatch_metric_alarm" "rds_free_storage" {
  alarm_name          = "surfaced-rds-low-storage"
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

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.identifier
  }
}
```

**What it catches:** Running out of disk space on the database. Threshold is 2GB. `treat_missing_data = "breaching"` because if we stop getting storage metrics, something is wrong.

### 5.5 API Gateway 5xx Errors

```hcl
resource "aws_cloudwatch_metric_alarm" "api_gateway_5xx" {
  alarm_name          = "surfaced-api-gateway-5xx"
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

  dimensions = {
    ApiId = aws_apigatewayv2_api.main.id
  }
}
```

**What it catches:** Errors at the API Gateway level that may not surface as Lambda errors — integration timeouts, Lambda invocation failures, throttling. This is a separate signal from the Lambda error alarm.

---

## 6. CloudWatch Dashboard

A single dashboard provides a visual overview of platform health. Defined entirely in Terraform as a JSON document.

```hcl
resource "aws_cloudwatch_dashboard" "platform" {
  dashboard_name = "surfaced-art-platform"

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
          title   = "API Lambda — Invocations & Errors"
          metrics = [
            ["AWS/Lambda", "Invocations", "FunctionName", aws_lambda_function.api.function_name, { stat = "Sum", color = "#2ca02c" }],
            ["AWS/Lambda", "Errors", "FunctionName", aws_lambda_function.api.function_name, { stat = "Sum", color = "#d62728" }],
            ["AWS/Lambda", "Throttles", "FunctionName", aws_lambda_function.api.function_name, { stat = "Sum", color = "#ff7f0e" }]
          ]
          period = 300
          region = var.aws_region
          view   = "timeSeries"
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
          title   = "API Lambda — Duration"
          metrics = [
            ["AWS/Lambda", "Duration", "FunctionName", aws_lambda_function.api.function_name, { stat = "Average", color = "#1f77b4" }],
            ["AWS/Lambda", "Duration", "FunctionName", aws_lambda_function.api.function_name, { stat = "p95", color = "#ff7f0e" }],
            ["AWS/Lambda", "Duration", "FunctionName", aws_lambda_function.api.function_name, { stat = "Maximum", color = "#d62728" }]
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
          title   = "Image Processor Lambda — Invocations & Errors"
          metrics = [
            ["AWS/Lambda", "Invocations", "FunctionName", aws_lambda_function.image_processor.function_name, { stat = "Sum", color = "#2ca02c" }],
            ["AWS/Lambda", "Errors", "FunctionName", aws_lambda_function.image_processor.function_name, { stat = "Sum", color = "#d62728" }]
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
          title   = "Image Processor Lambda — Duration"
          metrics = [
            ["AWS/Lambda", "Duration", "FunctionName", aws_lambda_function.image_processor.function_name, { stat = "Average", color = "#1f77b4" }],
            ["AWS/Lambda", "Duration", "FunctionName", aws_lambda_function.image_processor.function_name, { stat = "p95", color = "#ff7f0e" }]
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
          title   = "API Gateway — Request Count & Errors"
          metrics = [
            ["AWS/ApiGateway", "Count", "ApiId", aws_apigatewayv2_api.main.id, { stat = "Sum", color = "#1f77b4" }],
            ["AWS/ApiGateway", "4xx", "ApiId", aws_apigatewayv2_api.main.id, { stat = "Sum", color = "#ff7f0e" }],
            ["AWS/ApiGateway", "5xx", "ApiId", aws_apigatewayv2_api.main.id, { stat = "Sum", color = "#d62728" }]
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
          title   = "API Gateway — Latency"
          metrics = [
            ["AWS/ApiGateway", "Latency", "ApiId", aws_apigatewayv2_api.main.id, { stat = "Average", color = "#1f77b4" }],
            ["AWS/ApiGateway", "Latency", "ApiId", aws_apigatewayv2_api.main.id, { stat = "p95", color = "#ff7f0e" }]
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
          title   = "RDS — Connections"
          metrics = [
            ["AWS/RDS", "DatabaseConnections", "DBInstanceIdentifier", aws_db_instance.main.identifier, { stat = "Maximum", color = "#9467bd" }]
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
          title   = "RDS — CPU Utilization"
          metrics = [
            ["AWS/RDS", "CPUUtilization", "DBInstanceIdentifier", aws_db_instance.main.identifier, { stat = "Average", color = "#e377c2" }]
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
          title   = "RDS — Free Storage (GB)"
          metrics = [
            ["AWS/RDS", "FreeStorageSpace", "DBInstanceIdentifier", aws_db_instance.main.identifier, { stat = "Minimum", color = "#17becf" }]
          ]
          period = 300
          region = var.aws_region
          view   = "timeSeries"
        }
      }
    ]
  })
}
```

**Dashboard layout:**
- Row 1: API Lambda — invocations/errors (left), duration percentiles (right)
- Row 2: Image Processor Lambda — invocations/errors (left), duration (right)
- Row 3: API Gateway — request count and error codes (left), latency percentiles (right)
- Row 4: RDS — connections (left), CPU (center), free storage (right)

**Extending the dashboard:** When new Lambda functions are added (webhook handlers, scheduled jobs), add a new row of widgets following the same pattern. The dashboard JSON is version-controlled — changes go through PR review like any other infrastructure change.

---

## 7. Terraform File Organization

Add the observability resources to your existing `infrastructure/terraform/` directory. Either add to existing files by concern or create a dedicated file.

**Recommended approach — dedicated file:**

```
infrastructure/terraform/
├── main.tf                  # Provider, backend config
├── variables.tf             # Add: var.alert_email_address
├── rds.tf                   # Existing RDS resources
├── lambda.tf                # Existing Lambda resources
├── api_gateway.tf           # Existing API Gateway — add access_log_settings here
├── observability.tf         # NEW — all CloudWatch log groups, alarms, dashboard, SNS
└── outputs.tf               # Add: dashboard URL output
```

All observability resources (log groups, alarms, SNS topic, dashboard) go in `observability.tf`. The exception is the API Gateway access log settings, which belong in the API Gateway stage resource wherever that already lives.

**Add a Terraform output for the dashboard URL:**

```hcl
output "cloudwatch_dashboard_url" {
  value = "https://${var.aws_region}.console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.platform.dashboard_name}"
}
```

---

## 8. GitHub Actions Secrets

Add to the existing secrets list in CI/CD configuration:

- `TF_VAR_alert_email_address` — email address for CloudWatch alarm notifications

No other new secrets are required. The existing AWS credentials already have sufficient permissions for CloudWatch and SNS operations.

---

## 9. What to Defer

Do not build any of the following at this stage:

- **AWS X-Ray tracing** — useful for complex distributed systems, overkill for Lambda-to-RDS calls. Add if debugging latency across multiple services becomes necessary
- **CloudWatch Synthetics canaries** — automated uptime probes. Use a free external monitor (UptimeRobot, BetterUptime) for basic uptime checks instead
- **CloudWatch RUM** — real user monitoring on the frontend. Vercel or a lightweight analytics tool (Plausible, PostHog) handles this better for the frontend
- **Custom CloudWatch metrics** — publishing application-level metrics (e.g., orders per hour, commission totals) to CloudWatch as custom metrics. Use CloudWatch Logs Insights queries against structured logs instead — it is cheaper and requires no additional infrastructure
- **CloudWatch Composite Alarms** — alarms that trigger based on combinations of other alarms. Individual alarms are sufficient at launch scale
- **Slack integration for alarms** — email notifications are sufficient at launch. Add AWS Chatbot or a Lambda SNS subscriber for Slack delivery when the team grows

---

## 10. Implementation Checklist

Complete in this order during Phase 1 infrastructure setup:

- [ ] Add `var.alert_email_address` to `variables.tf`
- [ ] Create `observability.tf` with all CloudWatch log groups (API Lambda, Image Processor Lambda, API Gateway)
- [ ] Add SNS topic and email subscription to `observability.tf`
- [ ] Add all 5 CloudWatch alarms to `observability.tf`
- [ ] Add CloudWatch dashboard to `observability.tf`
- [ ] Add API Gateway access log settings to the existing API Gateway stage resource
- [ ] Add API Gateway CloudWatch IAM role
- [ ] Add dashboard URL to `outputs.tf`
- [ ] Add `TF_VAR_alert_email_address` to GitHub Actions secrets
- [ ] Run `terraform plan` and verify all resources are clean
- [ ] Run `terraform apply` and confirm dashboard renders in the AWS console
- [ ] Confirm SNS email subscription (click the confirmation link in the email)
- [ ] Create `packages/utils/src/logger.ts` with the structured logger
- [ ] Export logger from `packages/utils/index.ts`
- [ ] Replace any raw `console.log` calls in `apps/api` with the structured logger
- [ ] Verify logs appear as structured JSON in CloudWatch Logs for the API Lambda

---

*This is a living document. Add new log groups and dashboard widgets when new Lambda functions are created. Add new alarms when new failure conditions are identified. Observability resources are version-controlled Terraform — changes go through PR review.*

Version 1.0 | February 2026 | Confidential | CTO: Surfaced Art
