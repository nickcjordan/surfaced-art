#!/usr/bin/env bash
# =============================================================================
# Terraform State Migration — Centralize CloudWatch Log Groups
# =============================================================================
#
# Imports existing CloudWatch log groups into the new centralized Terraform
# addresses (observability.tf). Run before `terraform apply` so Terraform
# manages existing log groups in-place instead of trying to recreate them.
#
# The script is idempotent — safe to re-run. If a resource is already in
# state, the import is skipped.
#
# After a successful apply, remove this script AND the workflow step that
# calls it.
#
# Usage (from anywhere in the repo):
#   bash scripts/tf-state-mv-log-groups.sh
#
# Requires terraform vars to be passed via TF_CLI_ARGS_import or the
# workflow must pass -var-file and -var flags via TF_CLI_ARGS_import.
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

echo "=== Terraform State Migration: Import Centralized Log Groups ==="
echo "Working directory: $(pwd)"
echo ""

# Cache the state list once to avoid repeated remote state reads
STATE_LIST=$(terraform state list 2>/dev/null || true)

# import_if_needed <terraform_address> <aws_log_group_name> <label>
# Skips if the resource is already in state. If the AWS resource doesn't
# exist (already deleted), the import fails gracefully and terraform apply
# will create it fresh.
import_if_needed() {
  local address="$1"
  local log_group_name="$2"
  local label="$3"

  if echo "${STATE_LIST}" | grep -qF "${address}"; then
    echo "${label} — already in state, skipping"
    return 0
  fi

  echo "${label} — importing..."
  # Use `|| rc=$?` instead of `if` to guarantee set -e cannot intercept
  # the non-zero exit code before our handler runs.
  local rc=0
  terraform import "${address}" "${log_group_name}" || rc=$?
  if [ "$rc" -eq 0 ]; then
    echo "${label} — imported successfully"
  else
    echo "${label} — import exited ${rc}; resource likely absent in AWS, terraform apply will create it"
  fi
}

import_if_needed \
  'aws_cloudwatch_log_group.api_lambda' \
  '/aws/lambda/surfaced-art-prod-api' \
  '[1/4] API Lambda log group'

import_if_needed \
  'aws_cloudwatch_log_group.image_processor_lambda' \
  '/aws/lambda/surfaced-art-prod-image-processor' \
  '[2/4] Image Processor Lambda log group'

import_if_needed \
  'aws_cloudwatch_log_group.migrate_lambda' \
  '/aws/lambda/surfaced-art-prod-migrate' \
  '[3/4] Migration Lambda log group'

import_if_needed \
  'aws_cloudwatch_log_group.api_gateway' \
  '/aws/apigateway/surfaced-art-prod-api' \
  '[4/4] API Gateway log group'

echo ""
echo "=== Done ==="
