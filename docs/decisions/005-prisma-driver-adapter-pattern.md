# ADR-005: Prisma driver adapter pattern (@prisma/adapter-pg)

**Status:** Accepted
**Date:** 2026-02-24

**Context:** Prisma can manage database connections in two ways: using its built-in connection management (via the `DATABASE_URL` in the schema) or using an explicit driver adapter that gives the application control over the underlying database driver. On AWS Lambda, where each invocation may create a new connection, connection management is critical to avoid exhausting PostgreSQL's connection limit.

**Decision:** Use the `@prisma/adapter-pg` driver adapter with the `pg` package for explicit connection control. The Prisma client is created with the adapter pattern:

```typescript
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
})
const prisma = new PrismaClient({ adapter })
```

This gives the application direct control over the PostgreSQL connection, which is essential for serverless environments where connection lifecycle matters.

**Alternatives considered:**
- **Prisma built-in connection management** — Simpler setup (just provide `DATABASE_URL` in the schema). However, Prisma's built-in pool is designed for long-running servers, not Lambda functions. On Lambda, each cold start creates a new pool, and warm invocations may hold connections open unnecessarily. The driver adapter pattern allows more precise control.
- **Prisma with PgBouncer** — Use an external connection pooler. This is the recommended approach when RDS Proxy is not available, but adds another infrastructure component. Deferred until connection issues arise.
- **AWS RDS Proxy** — A transparent connection pooler that sits between Lambda and RDS. Intentionally deferred because at early traffic levels, connection exhaustion will not occur. RDS Proxy adds ~$15/month and requires no code changes when added later.

**Consequences:**
- The `pg` package is an explicit dependency (not just Prisma internals)
- Connection string is read from `DATABASE_URL` at runtime, supporting different environments
- A global singleton pattern prevents multiple Prisma clients in development (hot reload)
- When RDS Proxy is eventually added, only the `DATABASE_URL` connection string changes — no code changes needed
- The driver adapter pattern is Prisma's recommended approach for serverless deployments
