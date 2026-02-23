#!/usr/bin/env bash
# =============================================================================
# Terraform State Migration — Centralize CloudWatch Log Groups
# =============================================================================
#
# Run this ONCE before `terraform apply` after merging the observability.tf PR.
# Moves log group resources from individual modules to the root configuration
# so Terraform updates them in-place instead of destroying and recreating.
#
# After successful apply, this script can be deleted.
#
# Usage:
#   cd infrastructure/terraform
#   bash ../../scripts/tf-state-mv-log-groups.sh
#
# =============================================================================

set -euo pipefail

echo "=== Terraform State Migration: Centralize Log Groups ==="
echo ""
echo "Moving CloudWatch log groups from modules to root configuration..."
echo ""

# API Lambda log group
echo "[1/4] API Lambda log group"
terraform state mv \
  'module.lambda_api.aws_cloudwatch_log_group.api' \
  'aws_cloudwatch_log_group.api_lambda'

# Image Processor Lambda log group
echo "[2/4] Image Processor Lambda log group"
terraform state mv \
  'module.lambda_image_processor.aws_cloudwatch_log_group.image_processor' \
  'aws_cloudwatch_log_group.image_processor_lambda'

# Migration Lambda log group
echo "[3/4] Migration Lambda log group"
terraform state mv \
  'module.lambda_migrate.aws_cloudwatch_log_group.migrate' \
  'aws_cloudwatch_log_group.migrate_lambda'

# API Gateway log group
echo "[4/4] API Gateway log group"
terraform state mv \
  'module.lambda_api.aws_cloudwatch_log_group.api_gateway' \
  'aws_cloudwatch_log_group.api_gateway'

echo ""
echo "=== All 4 log groups moved successfully ==="
echo ""
echo "Next steps:"
echo "  1. Run 'terraform plan' — should show only retention updates (14→30 days)"
echo "  2. Run 'terraform apply' to apply the retention changes"
echo "  3. Delete this script (it's a one-time migration)"
