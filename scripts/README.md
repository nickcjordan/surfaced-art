# Scripts

Utility scripts for the Surfaced Art platform. Run from the repository root.

## `notion-to-s3.ts` — Demo Image Upload Pipeline

Downloads completed demo images from the Notion **Demo Image Generation Tracker** database and uploads them to S3. The Sharp Lambda automatically generates WebP variants (400w, 800w, 1200w).

### Setup

1. Create a Notion integration at https://www.notion.so/my-integrations
2. Share the "Demo Image Generation Tracker" database with the integration
3. Set `NOTION_API_TOKEN` in your environment

### Usage

```bash
# Upload all completed images
NOTION_API_TOKEN=secret_xxx npm run seed:images

# Dry run — preview what would be uploaded
NOTION_API_TOKEN=secret_xxx npx tsx scripts/notion-to-s3.ts --dry-run

# Upload images for a single artist
NOTION_API_TOKEN=secret_xxx npx tsx scripts/notion-to-s3.ts --artist "Elena Cordova"
```

### Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `NOTION_API_TOKEN` | Yes | — | Notion integration token |
| `NOTION_DATABASE_ID` | No | `98c10909-...` | Tracker database ID |
| `S3_MEDIA_BUCKET` | No | `surfaced-art-prod-media` | Target S3 bucket |
| `AWS_REGION` | No | `us-east-1` | AWS region |

AWS credentials come from the environment (CLI profile, env vars, or IAM role).

### How It Works

1. Queries Notion for rows where `Done == true`
2. Downloads each image from the temporary Notion file URL
3. Uploads to S3 as `.png`/`.jpg` to trigger the Sharp Lambda
4. The Lambda generates `{key}/400w.webp`, `{key}/800w.webp`, `{key}/1200w.webp`
5. Skips images that already exist in S3 (idempotent)

### Re-running

The script is designed to be re-run as the COO generates more images. It only uploads images that don't already exist in S3.

## Other Scripts

| Script | Description |
|---|---|
| `generate-demo-image-manifest.ts` | Generates `demo-image-manifest.json` from seed data |
| `upload-demo-images.sh` | Uploads images from local `demo-images/` directory to S3 |
| `grant-admin.ts` | Grants/revokes admin role for a user by email |
| `security-scan.cjs` | Runs security scans (npm audit, Trivy, Semgrep) |
