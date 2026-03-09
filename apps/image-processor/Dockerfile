# Build context: monorepo root
# Packages the image-processor Lambda as a container image.
# Sharp requires native binaries compiled for Amazon Linux, so we install
# it inside the container rather than bundling it with tsup.

# Pin platform to linux/amd64 — ensures correct native binaries even if
# the Docker host or CI runner changes architecture in the future.
FROM --platform=linux/amd64 public.ecr.aws/lambda/nodejs:20

WORKDIR ${LAMBDA_TASK_ROOT}

# Install production dependencies using the image-processor's own package.json.
# This is the single source of truth for the Sharp version — no hardcoded
# version in this file. npm resolves @img/sharp-linux-x64 automatically
# because we're inside an Amazon Linux x64 container.
# AWS SDK is also installed (harmless — it's bundled in index.js by tsup).
COPY apps/image-processor/package.json ./
RUN npm install --omit=dev && \
    npm cache clean --force && \
    rm -f package-lock.json

# Copy the pre-built self-contained bundle (produced by tsup in CI).
# The tsup bundle is self-contained for @aws-sdk/client-s3 etc.
# sharp is external in the tsup config and resolved from node_modules above.
COPY apps/image-processor/dist/index.js ./index.js

CMD ["index.handler"]
