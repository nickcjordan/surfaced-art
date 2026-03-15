# Shared Terraform Layer

This directory manages AWS resources that are **VPC-scoped or account-scoped singletons** — resources that cannot be duplicated per environment because AWS enforces uniqueness at the VPC or account level.

## Resources managed here

| Resource | Why it's shared |
|---|---|
| `aws_vpc_endpoint.s3` | Only one S3 gateway endpoint per VPC per service |
| `aws_api_gateway_account` | Only one per AWS region per account |
| `aws_iam_role.api_gateway_cloudwatch` | Supports the account-scoped API Gateway setting |

## State

- **Bucket**: `surfaced-art-terraform-state`
- **Key**: `shared/terraform.tfstate` (hardcoded, not parameterized)
- **Lock table**: `surfaced-art-terraform-locks`

## Applying

The shared layer is applied automatically in CI before environment-specific layers. To apply manually:

```bash
cd infrastructure/terraform/shared
terraform init
terraform plan
terraform apply
```

## One-time migration (from per-environment state)

Before the first deploy with this shared layer, existing resources must be imported into the shared state and removed from the dev/prod states. Run these commands with AWS credentials:

```bash
# 1. Initialize shared state
cd infrastructure/terraform/shared
terraform init

# 2. Get the VPC endpoint ID
VPCE_ID=$(aws ec2 describe-vpc-endpoints \
  --filters "Name=service-name,Values=com.amazonaws.us-east-1.s3" \
  --query "VpcEndpoints[0].VpcEndpointId" --output text)

# 3. Import into shared state
terraform import aws_vpc_endpoint.s3 "$VPCE_ID"
terraform import aws_api_gateway_account.main api-gateway-account

# Note: The IAM role will be created fresh with a new name (without environment
# prefix). The old environment-specific roles can be deleted after migration.

# 4. Apply to create the new IAM role and update API Gateway account
terraform apply

# 5. Remove from dev state
cd ../
terraform init -backend-config="key=dev/terraform.tfstate"
terraform state rm aws_vpc_endpoint.s3
terraform state rm aws_iam_role.api_gateway_cloudwatch
terraform state rm aws_iam_role_policy_attachment.api_gateway_cloudwatch
terraform state rm aws_api_gateway_account.main

# 6. Remove from prod state
terraform init -backend-config="key=prod/terraform.tfstate" -reconfigure
terraform state rm aws_vpc_endpoint.s3
terraform state rm aws_iam_role.api_gateway_cloudwatch
terraform state rm aws_iam_role_policy_attachment.api_gateway_cloudwatch
terraform state rm aws_api_gateway_account.main

# 7. Verify all three states are clean
cd shared && terraform plan              # Should show no changes
cd .. && terraform init -backend-config="key=dev/terraform.tfstate" -reconfigure
terraform plan -var-file="environments/dev.tfvars" ...   # No unexpected changes
terraform init -backend-config="key=prod/terraform.tfstate" -reconfigure
terraform plan -var-file="environments/prod.tfvars" ...  # No unexpected changes
```
