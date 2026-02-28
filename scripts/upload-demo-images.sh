#!/usr/bin/env bash
#
# Upload demo artist images to S3 from a local directory.
#
# Prerequisites:
#   - AWS CLI configured with credentials
#   - Images generated and placed in demo-images/ following the manifest structure
#
# Usage:
#   S3_BUCKET=surfaced-art-prod-media ./scripts/upload-demo-images.sh [verify]
#
# The script reads demo-image-manifest.json and uploads each image from the
# local path to the corresponding S3 key. Images should be in WebP format.
#
# Commands:
#   (default)  Upload all images from demo-images/ to S3
#   verify     Check which images exist locally and which are missing

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MANIFEST="$SCRIPT_DIR/demo-image-manifest.json"
IMAGE_DIR="$SCRIPT_DIR/../demo-images"
COMMAND="${1:-upload}"

# Require S3_BUCKET env var
: "${S3_BUCKET:?Set S3_BUCKET env var (e.g., surfaced-art-prod-media)}"

if [ ! -f "$MANIFEST" ]; then
  echo "ERROR: Manifest not found at $MANIFEST"
  echo "Run: npx tsx scripts/generate-demo-image-manifest.ts"
  exit 1
fi

# Extract image entries from manifest
TOTAL=$(jq '.images | length' "$MANIFEST")
echo "Manifest contains $TOTAL images"

case "$COMMAND" in
  verify)
    echo ""
    echo "Checking local files..."
    FOUND=0
    MISSING=0
    while IFS= read -r localPath; do
      FULL_PATH="$SCRIPT_DIR/../$localPath"
      if [ -f "$FULL_PATH" ]; then
        ((FOUND++))
      else
        ((MISSING++))
        echo "  MISSING: $localPath"
      fi
    done < <(jq -r '.images[].localPath' "$MANIFEST")
    echo ""
    echo "Found: $FOUND / $TOTAL"
    echo "Missing: $MISSING / $TOTAL"
    ;;

  upload)
    echo ""
    echo "Uploading to s3://$S3_BUCKET ..."
    UPLOADED=0
    SKIPPED=0
    ERRORS=0
    while IFS=$'\t' read -r localPath s3Key; do
      FULL_PATH="$SCRIPT_DIR/../$localPath"
      if [ ! -f "$FULL_PATH" ]; then
        ((SKIPPED++))
        continue
      fi
      if aws s3 cp "$FULL_PATH" "s3://$S3_BUCKET/$s3Key" \
        --content-type "image/webp" \
        --cache-control "public, max-age=31536000, immutable" \
        --quiet 2>/dev/null; then
        ((UPLOADED++))
        echo "  ✓ $s3Key"
      else
        ((ERRORS++))
        echo "  ✗ FAILED: $s3Key"
      fi
    done < <(jq -r '.images[] | [.localPath, .s3Key] | @tsv' "$MANIFEST")
    echo ""
    echo "Uploaded: $UPLOADED"
    echo "Skipped (missing locally): $SKIPPED"
    echo "Errors: $ERRORS"
    ;;

  *)
    echo "Unknown command: $COMMAND"
    echo "Usage: $0 [upload|verify]"
    exit 1
    ;;
esac
