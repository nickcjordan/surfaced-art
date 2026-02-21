# Terraform Infrastructure

This directory contains all Terraform configuration for Surfaced Art AWS infrastructure.

## Directory Structure

```
terraform/
├── bootstrap/          # State backend setup (run once)
├── modules/
│   ├── iam/            # IAM roles and policies
│   ├── rds/            # PostgreSQL database
│   ├── s3-cloudfront/  # Media storage and CDN
│   ├── cognito/        # User authentication
│   ├── ses/            # Email sending
│   └── lambda-api/     # API Lambda + API Gateway
├── main.tf             # Root module
├── variables.tf        # Input variables
├── outputs.tf          # Output values
├── backend.tf          # State backend config
└── versions.tf         # Provider versions
```

## Initial Setup

### 1. Bootstrap State Backend

Before running the main Terraform, create the S3 bucket and DynamoDB table for state storage:

```bash
cd infrastructure/terraform/bootstrap
terraform init
terraform apply
```

### 2. Configure Variables

Create a `terraform.tfvars` file (never commit this):

```hcl
db_password          = "your-secure-password"
google_client_id     = "your-google-client-id"
google_client_secret = "your-google-client-secret"
```

Or use environment variables:

```bash
export TF_VAR_db_password="your-secure-password"
export TF_VAR_google_client_id="your-google-client-id"
export TF_VAR_google_client_secret="your-google-client-secret"
```

### 3. Initialize and Apply

```bash
cd infrastructure/terraform
terraform init
terraform plan
terraform apply
```

## Required GitHub Secrets

For CI/CD, configure these secrets in GitHub:

- `AWS_ACCESS_KEY_ID` - AWS credentials
- `AWS_SECRET_ACCESS_KEY` - AWS credentials
- `AWS_REGION` - AWS region (us-east-1)
- `TF_VAR_db_password` - Database password
- `TF_VAR_google_client_id` - Google OAuth client ID
- `TF_VAR_google_client_secret` - Google OAuth client secret

## Resources Created

| Resource | Description | Est. Monthly Cost |
|----------|-------------|-------------------|
| RDS PostgreSQL | db.t3.micro database | ~$15 |
| Lambda | API function | ~$0 (free tier) |
| API Gateway | HTTP API | ~$0 (free tier) |
| S3 | Media storage | ~$0 (minimal) |
| CloudFront | CDN | ~$0 (minimal) |
| Cognito | User auth | ~$0 (free tier) |
| SES | Email sending | ~$0 (minimal) |

**Total estimated cost at low traffic: ~$15-20/month**

## Outputs

After applying, Terraform outputs:

- `api_gateway_url` - API endpoint URL
- `cloudfront_distribution_url` - CDN URL for media
- `cognito_user_pool_id` - User pool ID
- `cognito_client_id` - App client ID
- `lambda_function_name` - Lambda function name for deployments

## DNS Configuration (Manual)

After Terraform creates SES resources, add these DNS records:

1. **SES Domain Verification** - TXT record with verification token
2. **DKIM** - 3 CNAME records for email authentication
3. **SPF** - TXT record: `v=spf1 include:amazonses.com ~all`
4. **Mail From MX** - MX record for bounce handling

See Terraform outputs for exact values.

## Deploying Lambda Code

Lambda code is deployed via CI/CD:

```bash
# Build the Lambda bundle
cd apps/api
npm run build

# Deploy (via AWS CLI)
aws lambda update-function-code \
  --function-name surfaced-art-dev-api \
  --zip-file fileb://dist/index.cjs.zip
```
