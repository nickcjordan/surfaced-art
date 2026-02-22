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
# npm puts prisma in packages/db/node_modules/ (workspace dep). Symlink
# it to the root so prisma.config.ts can resolve `import 'prisma/config'`.
RUN npm ci && \
    ln -s packages/db/node_modules/prisma node_modules/prisma

# Copy the pre-built self-contained API bundle (produced by tsup in CI).
# This is an ESM bundle — it relies on the root package.json "type": "module"
# (copied above) so the Lambda Node 20 runtime loads it via import().
COPY apps/api/dist/index.js ./index.js

# Copy Prisma files needed by `prisma migrate deploy`:
#   prisma/schema.prisma   - schema definition
#   prisma/migrations/     - SQL migration files to apply
#   prisma.config.ts       - Prisma 7 datasource config (reads DATABASE_URL)
COPY packages/db/prisma/ ./prisma/
COPY packages/db/prisma.config.ts ./

CMD ["index.handler"]
