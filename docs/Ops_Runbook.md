# Ops Runbook

Operational commands for infrastructure tasks that require manual invocation.

---

## Re-seed the production database

Run when seed data in the prod DB is stale (e.g. image URLs need updating after CDN changes).

The migrate Lambda runs `seed-safe.ts`, which aborts if any non-seed users exist in the database.

```bash
AWS_REGION=us-east-1 aws lambda invoke \
  --function-name surfaced-art-prod-migrate \
  --payload '{"command":"seed"}' \
  --cli-binary-format raw-in-base64-out \
  response.json && cat response.json
```

Expected success response: `{"success":true}`

**When to run:** After updating image URLs in `packages/db/prisma/seed-data.ts` and deploying the migrate Lambda — the DB won't pick up the new URLs until re-seeded.

---

## Run a database migration

Applies any pending Prisma migrations against the prod RDS instance.

```bash
AWS_REGION=us-east-1 aws lambda invoke \
  --function-name surfaced-art-prod-migrate \
  --payload '{"command":"migrate"}' \
  --cli-binary-format raw-in-base64-out \
  response.json && cat response.json
```

---

## Revalidate cached pages (on-demand ISR)

Pages are cached via ISR and refresh automatically every 60 seconds. To bust the cache immediately (e.g., after a DB reseed or content change), call the revalidation endpoint.

**Requires:** `REVALIDATION_SECRET` env var set in Vercel.

### Revalidate everything (after DB reseed)

```bash
curl -X POST https://surfaced.art/api/revalidate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $REVALIDATION_SECRET" \
  -d '{"type":"all"}'
```

### Revalidate a single artist page

```bash
curl -X POST https://surfaced.art/api/revalidate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $REVALIDATION_SECRET" \
  -d '{"type":"artist","slug":"abbey-peters"}'
```

This also revalidates the homepage and all category pages (since they may show the artist).

### Revalidate a single listing page

```bash
curl -X POST https://surfaced.art/api/revalidate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $REVALIDATION_SECRET" \
  -d '{"type":"listing","id":"LISTING_UUID","category":"ceramics"}'
```

Include `category` to only revalidate the relevant category page. Omit it to revalidate all categories.

### Revalidate specific paths

```bash
curl -X POST https://surfaced.art/api/revalidate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $REVALIDATION_SECRET" \
  -d '{"paths":["/artist/abbey-peters","/listing/abc123"]}'
```

---

## Infrastructure reference

| Resource | Value |
|---|---|
| RDS instance | `surfaced-art-prod-db.cupk8g0i85gp.us-east-1.rds.amazonaws.com` |
| RDS database name | `surfaced_art` |
| Prod S3 bucket | `surfaced-art-prod-media` |
| Prod CloudFront | `dmfu4c7s6z2cc.cloudfront.net` |
| Dev S3 bucket | `surfaced-art-dev-media` |
| Dev CloudFront | `d2agn4aoo0e7ji.cloudfront.net` |
| API Lambda | `surfaced-art-prod-api` |
| Migrate Lambda | `surfaced-art-prod-migrate` |
| Image Processor Lambda | `surfaced-art-prod-image-processor` |
