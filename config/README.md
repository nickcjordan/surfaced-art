# Environment Configuration Reference

This directory contains non-secret reference files that document which environment
variables are required for each environment and where their values come from.

**These files are safe to commit.** They contain no secrets — only variable names
and documentation of where values come from (Terraform outputs, generated secrets, etc.).

## Files

| File | Purpose |
|---|---|
| `dev.env-reference` | Dev environment (dev.surfaced.art) variable reference |
| `prod.env-reference` | Prod environment (surfaced.art) variable reference |

## How to use after a Terraform apply

When Terraform creates or modifies infrastructure, some outputs change (e.g., API Gateway URL,
Cognito pool/client IDs). After running `terraform apply`:

1. Get the outputs:
   ```bash
   cd infrastructure/terraform
   terraform output -json
   ```

2. Update the corresponding `*.env-reference` file with the real values.

3. Update the Vercel project environment variables (UI or CLI) to match.

4. Commit the updated reference file so the team knows the current state.

## Variable categories

### Vercel (web frontend)

Set these in the Vercel project dashboard under Settings → Environment Variables.
All `NEXT_PUBLIC_*` vars are baked into the Next.js build at build time.

| Variable | Source | Required |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Config (known per environment) | Yes — build fails if absent |
| `NEXT_PUBLIC_API_URL` | Terraform output: `api_gateway_url` | Yes — build fails if absent |
| `NEXT_PUBLIC_COGNITO_USER_POOL_ID` | Terraform output: `cognito_user_pool_id` | Yes |
| `NEXT_PUBLIC_COGNITO_CLIENT_ID` | Terraform output: `cognito_client_id` | Yes |
| `NEXT_PUBLIC_CDN_DOMAINS` | Known (CloudFront domain per environment) | Optional (has fallback) |
| `REVALIDATION_SECRET` | Generate: `openssl rand -hex 32` | Yes |

### Lambda (API backend)

Lambda environment variables are managed entirely by Terraform (`modules/lambda-api/main.tf`).
After `terraform apply` they are set automatically. You should not need to set these manually.

| Variable | Source |
|---|---|
| `FRONTEND_URL` | `var.frontend_url` from tfvars |
| `DATABASE_URL` | RDS module connection string |
| `COGNITO_USER_POOL_ID` | Cognito module output |
| `COGNITO_CLIENT_ID` | Cognito module output |
| `S3_BUCKET_NAME` | S3/CloudFront module output |
| `CLOUDFRONT_URL` | S3/CloudFront module output |
| `SES_FROM_ADDRESS` | Derived from `var.ses_domain` |
| `STRIPE_SECRET_KEY` | GitHub secret → Terraform var |
| `STRIPE_WEBHOOK_SECRET` | GitHub secret → Terraform var |

## Secret rotation checklist

When rotating secrets:

- **Database password** (`TF_VAR_db_password`): Update GitHub Environment secret,
  then run `terraform apply` to update RDS and Lambda simultaneously.
- **Cognito app client**: Recreating the client changes the client ID.
  Update Vercel env vars and Lambda (via Terraform) after.
- **Stripe keys**: Update GitHub Environment secret, then run `terraform apply`.
- **Revalidation secret**: Update Vercel env var. No Terraform change needed.
