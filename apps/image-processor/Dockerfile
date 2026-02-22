# Build context: monorepo root
# Packages the image-processor Lambda as a container image.
# Sharp requires native binaries compiled for Amazon Linux, so we install
# it inside the container rather than bundling it with tsup.

FROM public.ecr.aws/lambda/nodejs:20

WORKDIR ${LAMBDA_TASK_ROOT}

# Install sharp with native binaries for the Lambda runtime (Amazon Linux).
# Use a temporary package.json to avoid workspace resolution issues from
# the monorepo root, then remove it so we can copy the real one.
RUN echo '{"private":true}' > package.json && \
    npm install sharp@^0.33.0 && \
    rm -f package.json package-lock.json

# Root package.json provides "type": "module" so the Lambda Node 20
# runtime loads the ESM bundle via import().
COPY package.json ./

# Copy the pre-built self-contained bundle (produced by tsup in CI).
# The tsup bundle is self-contained for @aws-sdk/client-s3 etc.
# sharp is external in the tsup config and resolved from node_modules above.
COPY apps/image-processor/dist/index.js ./index.js

CMD ["index.handler"]
