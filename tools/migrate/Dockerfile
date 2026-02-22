# Build context: monorepo root
# Packages the migration Lambda as a container image so the Prisma CLI
# (including its native migration engine binary) is available for
# running `prisma migrate deploy` from within the VPC.

FROM public.ecr.aws/lambda/nodejs:20

WORKDIR ${LAMBDA_TASK_ROOT}

# Copy workspace package manifests so npm ci can resolve the full
# dependency graph with the correct lock file.
COPY package.json package-lock.json ./
COPY tools/migrate/package.json ./tools/migrate/package.json
COPY packages/db/package.json ./packages/db/package.json
COPY packages/types/package.json ./packages/types/package.json
COPY packages/utils/package.json ./packages/utils/package.json
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json

# Install dependencies. prisma is a direct dependency of @surfaced-art/migrate
# so it resolves at the standard node_modules/prisma/ path — no symlink hacks.
RUN npm ci

# Copy the pre-built migration handler (produced by tsup in CI).
# Root package.json "type": "module" (copied above) ensures ESM loading.
COPY tools/migrate/dist/index.js ./index.js

# Copy Prisma files needed by `prisma migrate deploy`:
#   prisma/schema.prisma   - schema definition
#   prisma/migrations/     - SQL migration files to apply
#   prisma.config.ts       - Prisma 7 datasource config (reads DATABASE_URL)
COPY packages/db/prisma/ ./prisma/
COPY packages/db/prisma.config.ts ./

CMD ["index.handler"]
