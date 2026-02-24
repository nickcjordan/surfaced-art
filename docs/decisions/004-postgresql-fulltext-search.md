# ADR-004: PostgreSQL full-text search over dedicated search service

**Status:** Accepted
**Date:** 2026-02-24

**Context:** The platform needs search functionality for listings (by title, description, medium, artist name) and category-based browsing. Dedicated search services (Algolia, AWS OpenSearch) provide superior relevance, faceting, and typo tolerance, but add infrastructure cost and operational complexity.

**Decision:** Start with PostgreSQL's built-in full-text search using `tsvector` columns and GIN indexes. This requires no additional infrastructure beyond the existing RDS instance. Migrate to a dedicated search service only when PostgreSQL search proves insufficient for the catalog size or feature requirements.

**Alternatives considered:**
- **Algolia** — Best-in-class search UX with instant results, typo tolerance, and faceting out of the box. However, it adds a per-record and per-search pricing model, requires syncing data from PostgreSQL to Algolia, and introduces an external service dependency. At early catalog sizes (<10,000 listings), the cost is not justified.
- **AWS OpenSearch** — Self-hosted search within AWS. More cost-effective than Algolia at scale but requires cluster management, index configuration, and data sync infrastructure. Minimum viable cluster costs ~$30-50/month — more than the entire current infrastructure.
- **Application-level filtering only** — No full-text search, just category/status filters with SQL WHERE clauses. This is the current Phase 2 implementation. Full-text search will be added when the search UI is built.

**Consequences:**
- Zero additional infrastructure cost at launch
- PostgreSQL full-text search is "good enough" for a catalog of <50,000 listings
- Advanced features (typo tolerance, synonym matching, instant search-as-you-type) are limited compared to Algolia
- Migration to Algolia or OpenSearch is a future task that requires building a sync pipeline — the decision defers but does not prevent this
- Category browse pages use standard SQL queries, which is sufficient for the current browse-oriented discovery model
