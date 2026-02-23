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
# The script is idempotent — safe to re-run if interrupted or if some
# resources were already moved. It checks state before each move.
#
# Usage (from anywhere in the repo):
#   bash scripts/tf-state-mv-log-groups.sh
#
# =============================================================================

set -euo pipefail

# Ensure we always run from the Terraform root (infrastructure/terraform)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TERRAFORM_DIR="${SCRIPT_DIR}/../infrastructure/terraform"

if [ ! -d "${TERRAFORM_DIR}" ]; then
  echo "Error: Expected Terraform directory not found at: ${TERRAFORM_DIR}" >&2
  exit 1
fi

cd "${TERRAFORM_DIR}"

echo "=== Terraform State Migration: Centralize Log Groups ==="
echo "Working directory: $(pwd)"
echo ""

# Cache the state list once to avoid repeated remote state reads
STATE_LIST=$(terraform state list 2>/dev/null || true)

# move_if_needed <source> <destination> <label>
# Skips the move if the source no longer exists (already moved) or
# the destination already exists in state.
move_if_needed() {
  local src="$1"
  local dst="$2"
  local label="$3"

  if echo "${STATE_LIST}" | grep -qF "${dst}"; then
    echo "${label} — already at destination, skipping"
    return 0
  fi

  if ! echo "${STATE_LIST}" | grep -qF "${src}"; then
    echo "${label} — source not found in state, skipping"
    return 0
  fi

  echo "${label} — moving..."
  terraform state mv "${src}" "${dst}"
}

move_if_needed \
  'module.lambda_api.aws_cloudwatch_log_group.api' \
  'aws_cloudwatch_log_group.api_lambda' \
  '[1/4] API Lambda log group'

move_if_needed \
  'module.lambda_image_processor.aws_cloudwatch_log_group.image_processor' \
  'aws_cloudwatch_log_group.image_processor_lambda' \
  '[2/4] Image Processor Lambda log group'

move_if_needed \
  'module.lambda_migrate.aws_cloudwatch_log_group.migrate' \
  'aws_cloudwatch_log_group.migrate_lambda' \
  '[3/4] Migration Lambda log group'

move_if_needed \
  'module.lambda_api.aws_cloudwatch_log_group.api_gateway' \
  'aws_cloudwatch_log_group.api_gateway' \
  '[4/4] API Gateway log group'

echo ""
echo "=== Done ==="
echo ""
echo "Next steps:"
echo "  1. Run 'terraform plan' — should show only retention updates (14→30 days)"
echo "  2. Run 'terraform apply' to apply the retention changes"
echo "  3. Delete this script (it's a one-time migration)"
