#!/usr/bin/env bash
# Fetches the current sha256 digest for the Lambda Node.js 20 base image.
# Run this when updating LAMBDA_BOOTSTRAP_IMAGE in .github/workflows/deploy.yml.
#
# Usage:
#   bash scripts/get-lambda-bootstrap-digest.sh
#
# Then update LAMBDA_BOOTSTRAP_IMAGE in deploy.yml:
#   LAMBDA_BOOTSTRAP_IMAGE: 'public.ecr.aws/lambda/nodejs@sha256:<new-digest>'
#
# The root Terraform variable placeholder_image_uri default should also be
# updated to match (it is used only for local terraform apply runs; CI always
# passes the value explicitly via -var).

set -euo pipefail

IMAGE="public.ecr.aws/lambda/nodejs"
TAG="20"

TOKEN=$(curl -sL \
  "https://public.ecr.aws/token/?scope=repository:lambda/nodejs:pull&service=public.ecr.aws" \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

DIGEST=$(curl -sI \
  "https://public.ecr.aws/v2/lambda/nodejs/manifests/${TAG}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Accept: application/vnd.docker.distribution.manifest.v2+json" \
  | grep -i "docker-content-digest" \
  | awk '{print $2}' \
  | tr -d '\r')

echo "Current digest for ${IMAGE}:${TAG}"
echo ""
echo "  ${IMAGE}@${DIGEST}"
echo ""
echo "Update LAMBDA_BOOTSTRAP_IMAGE in .github/workflows/deploy.yml and"
echo "placeholder_image_uri default in infrastructure/terraform/variables.tf"
