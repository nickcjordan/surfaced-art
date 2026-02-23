# Build context: monorepo root
# Packages the API Lambda as a container image.
# The handler is a self-contained ESM bundle produced by tsup — no
# node_modules or prisma files needed. Only the root package.json is
# copied so Node resolves "type": "module" correctly.

FROM public.ecr.aws/lambda/nodejs:20

WORKDIR ${LAMBDA_TASK_ROOT}

# Root package.json provides "type": "module" so the Lambda Node 20
# runtime loads the ESM bundle via import().
COPY package.json ./

# Copy the pre-built API bundle (produced by tsup in CI).
# tsup may code-split Prisma's WASM query compiler into separate chunks,
# so we copy all JS files from dist/, not just index.js.
COPY apps/api/dist/*.js ./

CMD ["index.handler"]
