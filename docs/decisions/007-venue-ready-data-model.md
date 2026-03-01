# ADR-007: Venue-Ready Data Model Architecture

**Status:** Accepted
**Date:** 2026-03-01

**Context:** The platform plans to introduce a third user type — "Venues" (art fairs, galleries, festivals, markets, collectives) — in a future phase (12–18 months post-launch). We need to ensure the current data model does not create migration pain when venue support is added, without building any venue features now.

**Decision:** The current data model architecture is confirmed as venue-ready without any immediate changes needed. Specifically:

1. **`UserRoleType` enum** — Currently has `buyer`, `artist`, `admin`, `curator`, `moderator`. Adding `venue` is a single Prisma enum value addition. No existing code paths will break because role checks are explicit (e.g., `role === 'artist'`), not exhaustive pattern matches.

2. **`user_roles` join table** — Already supports multiple roles per user. A venue operator could hold `buyer` + `venue` roles simultaneously. The `UNIQUE(user_id, role)` constraint prevents duplicate role assignments and will work correctly with a new `venue` value.

3. **Venue-specific data** — When built, venue profiles, events, and show history will live in **new tables** (e.g., `venue_profiles`, `venue_events`, `artist_show_history`). These follow the same pattern as `artist_profiles` — a rich entity table linked to `users` via foreign key. No existing tables need modification.

4. **Artist `location` and `origin_zip` fields** — Already exist on `artist_profiles`. These enable future radius-based venue search without schema changes. No additional location data is needed on the artist side.

5. **No premature abstractions** — We deliberately avoid creating generic "organization" or "entity" tables now. The `artist_profiles` pattern (role-specific profile table linked to `users`) is proven and will be replicated for venues when the time comes. Premature abstraction would add complexity with no current benefit.

**Alternatives considered:**

- **Add `venue` to `UserRoleType` now** — Rejected. Adding an unused enum value creates confusion and implies functionality that doesn't exist. Better to add it when venue features are actually built.
- **Create a generic `organizations` table** — Rejected. Over-engineering for a feature 12+ months away. The concrete `artist_profiles` pattern is simpler and already proven.
- **Use a polymorphic `profiles` table** — Rejected. Artist and venue profiles have fundamentally different fields. Separate tables are cleaner and more maintainable.

**Consequences:**

- No code changes or migrations needed now
- When venue support is built, it requires: one enum value addition, 3–5 new tables, new API endpoints — all additive, no breaking changes
- The `user_roles` join table pattern scales to any number of role types
- Full strategy documented in Notion under *Surfaced Art — Venue Strategy (Third User Type)*
