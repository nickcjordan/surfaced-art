# =============================================================================
# Shared Infrastructure — VPC-scoped and account-scoped singletons
# =============================================================================
#
# Resources in this layer are shared across all environments (dev, prod).
# They cannot be duplicated per environment because AWS enforces uniqueness
# at the VPC or account level.
#
# This layer has its own Terraform state (shared/terraform.tfstate) and must
# be applied before any per-environment config. Per-environment configs
# reference these resources via data sources, not resource declarations.

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project   = var.project_name
      Layer     = "shared"
      ManagedBy = "terraform"
    }
  }
}

# -----------------------------------------------------------------------------
# VPC — default VPC used by all environments
# -----------------------------------------------------------------------------

data "aws_vpc" "default" {
  default = true
}

data "aws_route_tables" "default" {
  vpc_id = data.aws_vpc.default.id
}

# S3 gateway endpoint — allows VPC-attached Lambdas to reach S3 without
# traversing a NAT gateway or the public internet. Only one S3 gateway
# endpoint can exist per VPC, so this must be in the shared layer.
resource "aws_vpc_endpoint" "s3" {
  vpc_id            = data.aws_vpc.default.id
  service_name      = "com.amazonaws.${var.aws_region}.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = data.aws_route_tables.default.ids

  tags = {
    Name = "${var.project_name}-s3-endpoint"
  }
}

# -----------------------------------------------------------------------------
# API Gateway CloudWatch Logging — account-scoped singleton
# -----------------------------------------------------------------------------
# API Gateway requires a regional account-level setting to push logs to
# CloudWatch. Only one aws_api_gateway_account resource can exist per
# region per AWS account, so this must be in the shared layer.

resource "aws_iam_role" "api_gateway_cloudwatch" {
  name = "${var.project_name}-${var.aws_region}-api-gateway-cloudwatch"

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
    Name = "${var.project_name}-${var.aws_region}-api-gateway-cloudwatch"
  }
}

resource "aws_iam_role_policy_attachment" "api_gateway_cloudwatch" {
  role       = aws_iam_role.api_gateway_cloudwatch.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs"
}

resource "aws_api_gateway_account" "main" {
  cloudwatch_role_arn = aws_iam_role.api_gateway_cloudwatch.arn
}
