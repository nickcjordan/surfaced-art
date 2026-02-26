# ADR-006: On-demand ISR over build-time SSG

**Status:** Accepted
**Date:** 2026-02-26

**Context:** Vercel builds pre-render all pages via `generateStaticParams`, causing hundreds of concurrent API Lambda invocations. Each Lambda opens a DB connection, and with only 4 seed artists + 9 categories, the build hit 276 concurrent executions and 107 DB connections — exceeding the db.t3.micro limit of ~87. This scales linearly with content (1,000 artists = thousands of build-time API calls) and would require increasingly expensive infrastructure to sustain.

**Decision:** Migrate from build-time SSG to on-demand ISR:

1. `generateStaticParams` returns `[]` for artist and category pages — nothing is pre-rendered at build time
2. Pages render on first visitor request and are cached via ISR (`revalidate = 60`)
3. A `POST /api/revalidate` endpoint allows manual or webhook-triggered cache invalidation
4. `React.cache()` wraps data-fetching functions called by both `generateMetadata` and page components to deduplicate API calls within a single render
5. Lambda concurrency is capped at 40 (`reserved_concurrent_executions`) and each instance holds max 1 DB connection

**Alternatives considered:**

- **Keep SSG with connection pooling only**: Would still hammer the API during builds. Connection pooling limits damage but doesn't fix the root cause. Doesn't scale.
- **Pre-render a subset (top N artists)**: Partially reduces build load but still grows with content. Adds complexity deciding which pages to pre-render.
- **`revalidateTag` instead of `revalidatePath`**: More granular (invalidate "all pages showing artist X" by tag), but requires modifying every `fetch()` call to include tags. Not worth the complexity at current scale. Can be added later.

**Consequences:**

- Builds make near-zero API calls (only homepage + sitemap at most)
- First visitor to an uncached page sees a slightly slower response (server render). All subsequent visitors get cached static HTML.
- SEO is unaffected — pages render full HTML with meta tags and JSON-LD on first request. Sitemap lists all URLs.
- Cache invalidation requires calling the `/api/revalidate` endpoint (manually or via webhook). The 60-second `revalidate` fallback ensures pages refresh even without explicit invalidation.
- Future work (issue #230): wire backend webhooks to the revalidation endpoint for automatic invalidation on content changes.
