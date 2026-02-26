# Architecture Decision Records

This directory contains Architecture Decision Records (ADRs) for the Surfaced Art platform. ADRs document significant technical decisions, the context that led to them, and the alternatives that were considered.

## Purpose

- Prevent re-litigating past decisions in future development sessions
- Provide context for new contributors (human or AI) joining the project
- Create a traceable history of architectural evolution

## Template

```markdown
# ADR-NNN: Title

**Status:** Accepted | Superseded | Deprecated
**Date:** YYYY-MM-DD

**Context:** What situation led to this decision?

**Decision:** What was decided?

**Alternatives considered:** What else was evaluated?

**Consequences:** What are the trade-offs?
```

## Index

| ADR | Title | Status | Date |
| --- | --- | --- | --- |
| [001](./001-container-lambda-over-zip.md) | Container Lambda over ZIP Lambda | Accepted | 2026-02-24 |
| [002](./002-no-vercel-imports.md) | No @vercel/* imports — platform portability | Accepted | 2026-02-24 |
| [003](./003-hono-over-express.md) | Hono over Express for Lambda backend | Accepted | 2026-02-24 |
| [004](./004-postgresql-fulltext-search.md) | PostgreSQL full-text search over dedicated search service | Accepted | 2026-02-24 |
| [005](./005-prisma-driver-adapter-pattern.md) | Prisma driver adapter pattern (@prisma/adapter-pg) | Accepted | 2026-02-24 |
| [006](./006-on-demand-isr.md) | On-demand ISR over build-time SSG | Accepted | 2026-02-26 |
