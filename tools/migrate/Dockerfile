# Build context: monorepo root
# Packages the migration Lambda as a container image so the Prisma CLI
# (including its native migration engine binary) is available for
# running `prisma migrate deploy` from within the VPC.

FROM public.ecr.aws/lambda/nodejs:20

WORKDIR ${LAMBDA_TASK_ROOT}

# Install production dependencies using migrate's own package.json.
# This is a standalone install — no workspace resolution, no root
# lockfile, no need to keep a manifest list in sync with the monorepo.
# Prisma's native migration engine binary is resolved automatically
# because we're inside an Amazon Linux container.
COPY tools/migrate/package.json ./
RUN npm install --omit=dev && \
    npm cache clean --force && \
    rm -f package-lock.json

# Copy the pre-built migration handler (produced by tsup in CI).
# Root package.json "type": "module" is not needed — the handler
# is CommonJS-compatible via tsup's output format.
COPY tools/migrate/dist/index.js ./index.js

# Copy Prisma files needed by `prisma migrate deploy` and `seed`:
#   prisma/schema.prisma     - schema definition
#   prisma/migrations/       - SQL migration files to apply
#   prisma/seed-safe.ts      - safe seed script (with production guard)
#   prisma/seed-logic.ts     - shared seed functions
#   prisma/seed-data.ts      - seed data configuration
#   prisma.config.ts         - Prisma 7 datasource config (reads DATABASE_URL)
COPY packages/db/prisma/ ./prisma/
COPY packages/db/prisma.config.ts ./

# Generate the Prisma client inside the container so seed scripts can
# resolve their `../src/generated/prisma/client` import.
RUN npx prisma generate --schema=prisma/schema.prisma

CMD ["index.handler"]
