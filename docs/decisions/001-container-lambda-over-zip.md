# ADR-001: Container Lambda over ZIP Lambda

**Status:** Accepted
**Date:** 2026-02-24

**Context:** The Surfaced Art API runs on AWS Lambda behind API Gateway. Lambda supports two deployment methods: ZIP-based deployment (uploading a code archive) and container-based deployment (pushing a Docker image to ECR). The API uses Prisma ORM, which includes platform-specific binary engines that must match the Lambda runtime environment. ZIP deployments require careful handling of these binaries — the local development machine may produce incompatible binaries, requiring cross-compilation or bundling tricks.

**Decision:** Use Docker-based Lambda deployment via ECR for both the API Lambda and the database migration Lambda. The Dockerfile explicitly targets the Lambda Node.js base image, ensuring Prisma binaries are compiled for the correct platform. Build and push to ECR happen in CI via GitHub Actions.

**Alternatives considered:**
- **ZIP Lambda deployment** — Simpler setup, but Prisma binary compatibility issues make it fragile. Developers on macOS or Windows would produce binaries that fail on the Lambda Linux runtime. Workarounds (binaryTargets in schema, manual binary inclusion) are brittle and frequently break on Prisma version upgrades.
- **Lambda Layers for Prisma binaries** — Possible but adds another moving part. The binary must be updated independently of the application code on every Prisma version change.

**Consequences:**
- Docker builds are slower than ZIP packaging (~30-60s longer in CI)
- ECR adds a small storage cost (negligible at current image count)
- Consistent builds across all environments — no platform-specific binary issues
- The migration Lambda uses the same pattern, keeping both deployments uniform
- Local development uses `tsx` directly and does not require Docker
