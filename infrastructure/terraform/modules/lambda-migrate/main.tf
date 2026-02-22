# Dedicated security group for the migration Lambda.
# Only needs PostgreSQL egress to RDS — no HTTPS, no S3, no SES.
resource "aws_security_group" "migrate" {
  name        = "${var.project_name}-${var.environment}-migrate-sg"
  description = "Security group for database migration Lambda"
  vpc_id      = var.vpc_id

  # Allow PostgreSQL outbound to VPC only (for RDS)
  egress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
    description = "PostgreSQL to RDS within VPC"
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-migrate-sg"
  }
}

# Lambda function (container image) — runs prisma migrate deploy
resource "aws_lambda_function" "migrate" {
  function_name = "${var.project_name}-${var.environment}-migrate"
  role          = var.lambda_role_arn
  package_type  = "Image"
  memory_size   = var.memory_size
  timeout       = var.timeout

  # Placeholder for initial Terraform apply before the ECR image exists.
  # CI/CD manages actual image deployments via aws lambda update-function-code.
  image_uri = var.placeholder_image_uri

  # VPC configuration for RDS access
  vpc_config {
    subnet_ids         = var.subnet_ids
    security_group_ids = [aws_security_group.migrate.id]
  }

  environment {
    variables = {
      NODE_ENV     = var.environment
      DATABASE_URL = var.database_url
    }
  }

  # CI/CD manages image deployments; Terraform manages all other configuration.
  lifecycle {
    ignore_changes = [image_uri]
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-migrate"
  }
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "migrate" {
  name              = "/aws/lambda/${aws_lambda_function.migrate.function_name}"
  retention_in_days = 14

  tags = {
    Name = "${var.project_name}-${var.environment}-migrate-logs"
  }
}
