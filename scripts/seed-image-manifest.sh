#!/usr/bin/env bash
# Seed Image Download Manifest
# Downloads all seed artist images from source URLs to local temp directory.
# Then uploads to S3 for Sharp Lambda processing.
#
# Usage: bash scripts/seed-image-manifest.sh [download|upload|verify]
#
# Prerequisites:
#   - curl (for downloading)
#   - aws cli (for S3 upload)
#   - Configured AWS credentials with S3 write access
#
# S3 Key Structure:
#   uploads/seed/artists/{slug}/profile.jpg
#   uploads/seed/artists/{slug}/cover.jpg
#   uploads/seed/artists/{slug}/listings/{listing-slug}/front.jpg
#   uploads/seed/artists/{slug}/listings/{listing-slug}/angle.jpg
#   uploads/seed/artists/{slug}/process/studio.jpg
#
# After upload, the Sharp Lambda auto-generates WebP variants:
#   uploads/seed/artists/{slug}/profile/400w.webp
#   uploads/seed/artists/{slug}/profile/800w.webp
#   uploads/seed/artists/{slug}/profile/1200w.webp
#   (same pattern for all uploaded images)
#
# CloudFront URL pattern (once Lambda generates variants):
#   https://{cloudfront-domain}/uploads/seed/artists/{slug}/profile/1200w.webp
#
# Until the image processor Lambda is fixed (ECR image needs to be built & pushed),
# images are served as original JPGs:
#   https://{cloudfront-domain}/uploads/seed/artists/{slug}/profile.jpg
#
# ============================================================================
# SEEDING A DEV OR STAGING ENVIRONMENT
# ============================================================================
#
# 1. Set environment variables:
#      export S3_BUCKET=surfaced-art-dev-media
#      export CLOUDFRONT_DOMAIN=d2agn4aoo0e7ji.cloudfront.net
#
# 2. Run this script:
#      bash scripts/seed-image-manifest.sh all
#
# 3. Update packages/db/prisma/seed-data.ts:
#      - Change CDN_BASE to https://{CLOUDFRONT_DOMAIN}
#
# 4. Run the database seed:
#      cd packages/db && npm run db:seed
#
# Environment → S3 bucket / CloudFront mapping:
#   prod:    surfaced-art-prod-media  / dmfu4c7s6z2cc.cloudfront.net
#   dev:     surfaced-art-dev-media   / d2agn4aoo0e7ji.cloudfront.net
#
# NOTE: Mako Sandusky has no images (Cargo site blocks extraction).
# Her images must be provided by the artist and added to this manifest.
# ============================================================================

set -euo pipefail

# Configuration — update these for different environments
S3_BUCKET="${S3_BUCKET:-surfaced-art-prod-media}"
CLOUDFRONT_DOMAIN="${CLOUDFRONT_DOMAIN:-dmfu4c7s6z2cc.cloudfront.net}"
LOCAL_DIR="${LOCAL_DIR:-/tmp/seed-images}"
S3_PREFIX="uploads/seed/artists"

SQ_ABBEY="https://images.squarespace-cdn.com/content/v1/5b15f1e52487fd2f51e73cf8"
SQ_DAVID="https://images.squarespace-cdn.com/content/v1/5e2ddca4009b241e0bd5c200"
SQ_KARINA="https://images.squarespace-cdn.com/content/v1/59a082e2893fc085dc89b72a"

# ============================================================================
# Download function
# ============================================================================
download_image() {
  local url="$1"
  local dest="$2"
  if [ -f "$dest" ] && [ -s "$dest" ]; then
    echo "  SKIP (exists): $(basename "$dest")"
    return 0
  fi
  local http_code
  http_code=$(curl -sL -o "$dest" -w "%{http_code}" "$url")
  if [ "$http_code" = "200" ] && [ -s "$dest" ]; then
    local size
    size=$(wc -c < "$dest")
    echo "  OK: $(basename "$dest") (${size} bytes)"
  else
    echo "  FAIL ($http_code): $url"
    rm -f "$dest"
    return 1
  fi
}

# ============================================================================
# Download all images
# ============================================================================
do_download() {
  local failures=0

  echo "=== ABBEY PETERS ==="
  echo "Profile + Cover:"
  download_image "$SQ_ABBEY/3e301df5-0695-4e4e-8a57-c1ea31cd74d7/103024-5.jpg" "$LOCAL_DIR/abbey-peters/profile.jpg" || ((failures++))
  download_image "$SQ_ABBEY/1744047580041-95BYYCQ4FID5SVOR1PO3/022924-6.jpg" "$LOCAL_DIR/abbey-peters/cover.jpg" || ((failures++))

  echo "Listings:"
  # Drippy Teal Box
  download_image "$SQ_ABBEY/96f5847e-b04f-4715-b88a-a947569a611f/112125-40.jpg" "$LOCAL_DIR/abbey-peters/listings/drippy-teal-box/front.jpg" || ((failures++))
  download_image "$SQ_ABBEY/7b2d2b01-dc13-45e2-aa3d-49bc5d4e603f/112125-41.jpg" "$LOCAL_DIR/abbey-peters/listings/drippy-teal-box/angle.jpg" || ((failures++))
  # Purple and Lighter Purple Box
  download_image "$SQ_ABBEY/65f22077-a247-4889-80ca-a2f175aaedfd/112125-51.jpg" "$LOCAL_DIR/abbey-peters/listings/purple-and-lighter-purple-box/front.jpg" || ((failures++))
  download_image "$SQ_ABBEY/2f47dded-9e25-448b-a71a-f701dbc8a69b/112125-50.jpg" "$LOCAL_DIR/abbey-peters/listings/purple-and-lighter-purple-box/angle.jpg" || ((failures++))
  # Pink Candlestick with Hidden Base
  download_image "$SQ_ABBEY/5a194533-f4db-4728-8b1c-4bbbf9a4df40/120125-37.jpg" "$LOCAL_DIR/abbey-peters/listings/pink-candlestick-with-hidden-base/front.jpg" || ((failures++))
  download_image "$SQ_ABBEY/52c965f9-3f96-4f29-86ab-872a95d11498/120125-38.jpg" "$LOCAL_DIR/abbey-peters/listings/pink-candlestick-with-hidden-base/angle.jpg" || ((failures++))
  # White with Tea Bag Box
  download_image "$SQ_ABBEY/c63c5120-d90f-4e1b-b36a-76688d90376a/113025-22.jpg" "$LOCAL_DIR/abbey-peters/listings/white-with-tea-bag-box/front.jpg" || ((failures++))
  download_image "$SQ_ABBEY/c80ed264-d998-4c99-91c2-ed402154992a/113025-23.jpg" "$LOCAL_DIR/abbey-peters/listings/white-with-tea-bag-box/angle.jpg" || ((failures++))
  # Pink Vase
  download_image "$SQ_ABBEY/e9bdcd93-77ab-4fdb-8107-66cc0558fd4c/120125-31.jpg" "$LOCAL_DIR/abbey-peters/listings/pink-vase/front.jpg" || ((failures++))
  download_image "$SQ_ABBEY/66d433f7-02f4-46d0-ac3c-8ad63bb5844e/120125-30.jpg" "$LOCAL_DIR/abbey-peters/listings/pink-vase/angle.jpg" || ((failures++))
  # Teal Vase (sold)
  download_image "$SQ_ABBEY/4168c0e6-f651-4b13-813c-a1028f4148a3/12172025-17.jpg" "$LOCAL_DIR/abbey-peters/listings/teal-vase/front.jpg" || ((failures++))
  download_image "$SQ_ABBEY/91d87fab-5136-4603-a870-35c574427efa/12172025-03.jpg" "$LOCAL_DIR/abbey-peters/listings/teal-vase/angle.jpg" || ((failures++))
  # Pale Pink Box with Key (sold)
  download_image "$SQ_ABBEY/1678506468692-MW7Z0CBGOAFXX3J3KMB4/IMG_7567.jpg" "$LOCAL_DIR/abbey-peters/listings/pale-pink-box-with-key/front.jpg" || ((failures++))
  download_image "$SQ_ABBEY/1678506475039-EXHVIIJHRB3ZLA8WD6N7/IMG_7576.jpg" "$LOCAL_DIR/abbey-peters/listings/pale-pink-box-with-key/angle.jpg" || ((failures++))

  echo "Process photos (using 3rd listing images as stand-ins):"
  # Use 3rd image from Drippy Teal Box as process/studio
  download_image "$SQ_ABBEY/e77df52f-39d7-43a8-b2ab-c71e81078f4a/112125-42.jpg" "$LOCAL_DIR/abbey-peters/process/studio.jpg" || ((failures++))
  # Use 3rd image from White with Tea Bag Box as process/kiln
  download_image "$SQ_ABBEY/236f5767-634f-4768-91c1-a255ad56a197/113025-24.jpg" "$LOCAL_DIR/abbey-peters/process/kiln.jpg" || ((failures++))

  echo ""
  echo "=== DAVID MORRISON ==="
  echo "Profile + Cover:"
  download_image "$SQ_DAVID/1580072297884-TXENAI0OEFFYVNQYQMNX/David_Morrison.jpg" "$LOCAL_DIR/david-morrison/profile.jpg" || ((failures++))
  download_image "$SQ_DAVID/b376c58d-b645-4e97-8105-b64c84c72623/Morrison_David_03-2.jpg" "$LOCAL_DIR/david-morrison/cover.jpg" || ((failures++))

  echo "Listings:"
  # micro-landscape (0011)
  download_image "$SQ_DAVID/e82855fb-66fb-4be7-8dff-82c34c15c341/IMG_7383.jpg" "$LOCAL_DIR/david-morrison/listings/micro-landscape-0011/front.jpg" || ((failures++))
  download_image "$SQ_DAVID/77b359f9-26cc-4555-a247-97941c27330f/IMG_7384.jpg" "$LOCAL_DIR/david-morrison/listings/micro-landscape-0011/angle.jpg" || ((failures++))
  # Core Sample Cup (27)
  download_image "$SQ_DAVID/91933ab1-fe4c-4dc4-8e1a-81497b02fb67/IMG_7373.jpg" "$LOCAL_DIR/david-morrison/listings/core-sample-cup-27/front.jpg" || ((failures++))
  download_image "$SQ_DAVID/9bd84f4f-b900-4916-9b48-84f87224f22c/IMG_7374.jpg" "$LOCAL_DIR/david-morrison/listings/core-sample-cup-27/angle.jpg" || ((failures++))
  # Core Sample Mug (22)
  download_image "$SQ_DAVID/89e8bd4b-d9f9-4657-9aa6-9fc93516c911/IMG_7358.jpg" "$LOCAL_DIR/david-morrison/listings/core-sample-mug-22/front.jpg" || ((failures++))
  download_image "$SQ_DAVID/e2d738dc-1cdc-45d7-8e4c-7197d028a352/IMG_7359.jpg" "$LOCAL_DIR/david-morrison/listings/core-sample-mug-22/angle.jpg" || ((failures++))
  # Core Sample Tumbler (14)
  download_image "$SQ_DAVID/41ebbe18-875b-40d5-99ed-ace7ad4fe8bf/IMG_7332.jpg" "$LOCAL_DIR/david-morrison/listings/core-sample-tumbler-14/front.jpg" || ((failures++))
  download_image "$SQ_DAVID/53d316f9-7355-47d2-83bb-b7e4d294a7e3/IMG_7333.jpg" "$LOCAL_DIR/david-morrison/listings/core-sample-tumbler-14/angle.jpg" || ((failures++))
  # Core Sample Mug (29) (sold)
  download_image "$SQ_DAVID/c35347bd-0d23-43d4-9d5c-0ae91783fc90/IMG_7380.jpg" "$LOCAL_DIR/david-morrison/listings/core-sample-mug-29/front.jpg" || ((failures++))
  download_image "$SQ_DAVID/b7368839-4b04-4bb3-af35-f170dc2ced55/IMG_7381.jpg" "$LOCAL_DIR/david-morrison/listings/core-sample-mug-29/angle.jpg" || ((failures++))
  # Core Sample Bowl (24) (sold)
  download_image "$SQ_DAVID/d1dfa18a-82b5-4c50-bb2a-d2caac65e8d2/IMG_7364.jpg" "$LOCAL_DIR/david-morrison/listings/core-sample-bowl-24/front.jpg" || ((failures++))
  download_image "$SQ_DAVID/9277c73d-7b27-4b44-a4b2-70620dd61db3/IMG_7365.jpg" "$LOCAL_DIR/david-morrison/listings/core-sample-bowl-24/angle.jpg" || ((failures++))

  echo "Process photos:"
  # Use 3rd image from micro-landscape as process/studio
  download_image "$SQ_DAVID/d7601a29-1eae-419f-8533-e23da33fe179/IMG_7385.jpg" "$LOCAL_DIR/david-morrison/process/studio.jpg" || ((failures++))

  echo ""
  echo "=== KARINA YANES ==="
  echo "Profile + Cover:"
  download_image "$SQ_KARINA/16c3c247-12d6-424c-b9c0-2ffa16912221/Karina+Yanes+-+Headshot.jpg" "$LOCAL_DIR/karina-yanes/profile.jpg" || ((failures++))
  # Use Olive Oil Bowl 7 first image as cover (no dedicated cover available)
  download_image "$SQ_KARINA/e1de3a89-833f-429f-9034-51b571a7d2d3/IMG_1076+3.jpg" "$LOCAL_DIR/karina-yanes/cover.jpg" || ((failures++))

  echo "Listings:"
  # Olive Oil Bowl, blue tatreez (fabricated — reuse Bowl 5 images)
  download_image "$SQ_KARINA/c2c3a4af-e4d9-4d07-b391-7087cf22eff5/IMG_1081+3.jpg" "$LOCAL_DIR/karina-yanes/listings/olive-oil-bowl-blue-tatreez/front.jpg" || ((failures++))
  download_image "$SQ_KARINA/c89436bf-02ec-4bb4-bb6e-2fc0d666ee12/IMG_1082+3.jpg" "$LOCAL_DIR/karina-yanes/listings/olive-oil-bowl-blue-tatreez/angle.jpg" || ((failures++))
  # Olive Oil Bowl, green and ochre (fabricated — reuse Bowl 6 images)
  download_image "$SQ_KARINA/c7990af9-44ad-43ba-aa07-63e390356752/IMG_1085+3.jpg" "$LOCAL_DIR/karina-yanes/listings/olive-oil-bowl-green-and-ochre/front.jpg" || ((failures++))
  download_image "$SQ_KARINA/4caf5e3f-a0b2-4eab-a18e-ec9f3555f96a/IMG_1086+3.jpg" "$LOCAL_DIR/karina-yanes/listings/olive-oil-bowl-green-and-ochre/angle.jpg" || ((failures++))
  # Collaged Tile, watermelon (fabricated — reuse Bowl 7 alternate images as placeholder)
  download_image "$SQ_KARINA/8884bbd5-9b4a-4ae2-ba55-497f384e21d7/IMG_1077+3.jpg" "$LOCAL_DIR/karina-yanes/listings/collaged-tile-watermelon/front.jpg" || ((failures++))
  download_image "$SQ_KARINA/8772a1b2-0ca1-4bde-8aeb-db46f64d963a/IMG_1078+3.jpg" "$LOCAL_DIR/karina-yanes/listings/collaged-tile-watermelon/angle.jpg" || ((failures++))
  # Olive Oil Bowl 3 (sold — real images)
  download_image "$SQ_KARINA/cd42eab3-92fa-46db-996e-d7f3a50697a7/IMG_1072+4.jpg" "$LOCAL_DIR/karina-yanes/listings/olive-oil-bowl-3/front.jpg" || ((failures++))
  download_image "$SQ_KARINA/4bc5aa0d-2679-40e3-975c-7ca3c085289d/IMG_1073+4.jpg" "$LOCAL_DIR/karina-yanes/listings/olive-oil-bowl-3/angle.jpg" || ((failures++))
  # Olive Oil Bowl 4 (sold — real images)
  download_image "$SQ_KARINA/6bcce0c7-4ef1-489c-ace4-6ca51d630a34/IMG_1088+3.jpg" "$LOCAL_DIR/karina-yanes/listings/olive-oil-bowl-4/front.jpg" || ((failures++))
  download_image "$SQ_KARINA/e7e56f6d-1c01-46b9-b83c-08f846f92f2b/IMG_1089+3.jpg" "$LOCAL_DIR/karina-yanes/listings/olive-oil-bowl-4/angle.jpg" || ((failures++))

  echo "Process photos:"
  # Use Bowl 3 third image as process/studio
  download_image "$SQ_KARINA/e57b3460-61bb-4d07-86bf-e91bab345808/IMG_1075+3.jpg" "$LOCAL_DIR/karina-yanes/process/studio.jpg" || ((failures++))

  echo ""
  echo "=== SUMMARY ==="
  local total
  total=$(find "$LOCAL_DIR" -name "*.jpg" | wc -l)
  echo "Total images downloaded: $total"
  echo "Failures: $failures"
  echo ""
  echo "NOTE: Mako Sandusky has no extractable images (Cargo site)."
  echo "Mako's images must be provided directly by the artist."
}

# ============================================================================
# Upload all images to S3
# ============================================================================
do_upload() {
  echo "Uploading to S3 bucket: $S3_BUCKET"
  echo "S3 prefix: $S3_PREFIX"
  echo ""

  local uploaded=0
  local failed=0

  for artist_dir in "$LOCAL_DIR"/*/; do
    local slug
    slug=$(basename "$artist_dir")
    if [ "$slug" = "." ] || [ "$slug" = ".." ]; then continue; fi

    echo "=== $slug ==="

    # Profile + Cover
    for img in profile.jpg cover.jpg; do
      if [ -f "$artist_dir/$img" ]; then
        local s3key="$S3_PREFIX/$slug/$img"
        echo "  Uploading: $s3key"
        if aws s3 cp "$artist_dir/$img" "s3://$S3_BUCKET/$s3key" --content-type "image/jpeg" 2>/dev/null; then
          ((uploaded++))
        else
          echo "  FAILED: $s3key"
          ((failed++))
        fi
      fi
    done

    # Listing images
    if [ -d "$artist_dir/listings" ]; then
      for listing_dir in "$artist_dir/listings"/*/; do
        local listing_slug
        listing_slug=$(basename "$listing_dir")
        for img in front.jpg angle.jpg; do
          if [ -f "$listing_dir/$img" ]; then
            local s3key="$S3_PREFIX/$slug/listings/$listing_slug/$img"
            echo "  Uploading: $s3key"
            if aws s3 cp "$listing_dir/$img" "s3://$S3_BUCKET/$s3key" --content-type "image/jpeg" 2>/dev/null; then
              ((uploaded++))
            else
              echo "  FAILED: $s3key"
              ((failed++))
            fi
          fi
        done
      done
    fi

    # Process photos
    if [ -d "$artist_dir/process" ]; then
      for img in "$artist_dir/process"/*.jpg; do
        if [ -f "$img" ]; then
          local filename
          filename=$(basename "$img")
          local s3key="$S3_PREFIX/$slug/process/$filename"
          echo "  Uploading: $s3key"
          if aws s3 cp "$img" "s3://$S3_BUCKET/$s3key" --content-type "image/jpeg" 2>/dev/null; then
            ((uploaded++))
          else
            echo "  FAILED: $s3key"
            ((failed++))
          fi
        fi
      done
    fi
  done

  echo ""
  echo "=== UPLOAD SUMMARY ==="
  echo "Uploaded: $uploaded"
  echo "Failed: $failed"
}

# ============================================================================
# Verify Lambda processing (check for WebP variants)
# ============================================================================
do_verify() {
  echo "Checking for WebP variants in S3..."
  echo "S3 bucket: $S3_BUCKET"
  echo ""

  local originals=0
  local variants=0

  for ext in jpg jpeg png; do
    local count
    count=$(aws s3 ls "s3://$S3_BUCKET/$S3_PREFIX/" --recursive | grep -c "\\.${ext}$" || true)
    originals=$((originals + count))
  done

  variants=$(aws s3 ls "s3://$S3_BUCKET/$S3_PREFIX/" --recursive | grep -c "w\\.webp$" || true)

  echo "Original images: $originals"
  echo "WebP variants: $variants"
  echo "Expected variants: ~$((originals * 3)) (3 sizes per original, fewer if source < 400px)"
  echo ""

  # Spot-check a specific image
  echo "Spot-check: Abbey Peters profile variants"
  aws s3 ls "s3://$S3_BUCKET/$S3_PREFIX/abbey-peters/profile/" 2>/dev/null || echo "  (no variants found yet — Lambda may still be processing)"
  echo ""
  echo "Spot-check: Abbey Peters first listing variants"
  aws s3 ls "s3://$S3_BUCKET/$S3_PREFIX/abbey-peters/listings/drippy-teal-box/front/" 2>/dev/null || echo "  (no variants found yet)"

  echo ""
  echo "CloudFront test URLs:"
  echo "  Profile (1200w): https://$CLOUDFRONT_DOMAIN/$S3_PREFIX/abbey-peters/profile/1200w.webp"
  echo "  Listing (800w):  https://$CLOUDFRONT_DOMAIN/$S3_PREFIX/abbey-peters/listings/drippy-teal-box/front/800w.webp"
}

# ============================================================================
# Main
# ============================================================================
case "${1:-download}" in
  download) do_download ;;
  upload)   do_upload ;;
  verify)   do_verify ;;
  all)      do_download && do_upload && echo "Waiting 30s for Lambda processing..." && sleep 30 && do_verify ;;
  *)        echo "Usage: $0 [download|upload|verify|all]"; exit 1 ;;
esac
