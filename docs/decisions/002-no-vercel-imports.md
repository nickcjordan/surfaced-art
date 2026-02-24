# ADR-002: No @vercel/* imports — platform portability

**Status:** Accepted
**Date:** 2026-02-24

**Context:** The Next.js frontend is hosted on Vercel for development velocity — zero-config deployments, preview URLs per PR, and strong Next.js compatibility. However, Vercel offers proprietary packages (@vercel/kv, @vercel/postgres, @vercel/blob, @vercel/analytics, Vercel Image Optimization) that create vendor lock-in. The long-term plan is to migrate to OpenNext on AWS when costs justify it.

**Decision:** Never import from `@vercel/*` packages in application code. Use framework-native or AWS-native alternatives for all functionality:
- **Image processing:** Sharp at upload time instead of Vercel Image Optimization. Next.js Image component used with `unoptimized` prop.
- **Data storage:** AWS RDS (PostgreSQL) + Prisma instead of Vercel Postgres/KV
- **File storage:** AWS S3 + CloudFront instead of Vercel Blob
- **Analytics:** Third-party provider (Plausible/PostHog) instead of Vercel Analytics

**Alternatives considered:**
- **Use Vercel features freely, migrate later** — Would accelerate early development but create a costly migration. Vercel's proprietary APIs have no 1:1 AWS equivalents, so migration would require code changes across the application, not just infrastructure changes.
- **Partial Vercel usage** — Use only Vercel Image Optimization (the most tempting convenience). Rejected because it creates a dependency that touches every image-rendering component. Sharp provides equivalent quality with full control.

**Consequences:**
- Slightly more setup work upfront (Sharp pipeline, S3 upload flow)
- Migration to OpenNext requires only infrastructure changes — zero application code changes
- The `unoptimized` prop on Next.js Image means images must be pre-processed at upload time
- CI checks can enforce this rule by grepping for `@vercel/` imports
