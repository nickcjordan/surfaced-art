# Build context: monorepo root
# Packages the API Lambda as a container image so the Prisma CLI
# (including its native migration engine binary) is available for
# running `prisma migrate deploy` from within the VPC.

FROM public.ecr.aws/lambda/nodejs:20

WORKDIR ${LAMBDA_TASK_ROOT}

# Copy workspace package manifests so npm ci can resolve the full
# dependency graph with the correct lock file.
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY packages/db/package.json ./packages/db/package.json
COPY packages/types/package.json ./packages/types/package.json
COPY packages/utils/package.json ./packages/utils/package.json

# Install dependencies. This downloads Prisma CLI with Linux-native
# migration engine binaries matching the Lambda runtime environment.
RUN npm ci

# Copy the pre-built self-contained API bundle (produced by tsup in CI).
# Renamed from .cjs to .js for Lambda handler compatibility.
COPY apps/api/dist/index.cjs ./index.js

# Copy Prisma files needed by `prisma migrate deploy`:
#   prisma/schema.prisma   - schema definition
#   prisma/migrations/     - SQL migration files to apply
#   prisma.config.ts       - Prisma 7 datasource config (reads DATABASE_URL)
COPY packages/db/prisma/ ./prisma/
COPY packages/db/prisma.config.ts ./

CMD ["index.handler"]
