---
name: plan-session
description: Run a full planning session with 7 specialized agents — synthesizes status, creates stage plans, updates 7 living planning documents, creates Linear issues, and updates Notion.
disable-model-invocation: true
---

# Full Planning Session

Run a comprehensive planning session with 7 specialized team member agents. This updates a set of 7 living planning documents with the latest state of the project — each document tracks its own version and changelog.

## Constants

- **Linear Team**: "Surfaced Art" (ID: `30950005-b0c2-4453-b80d-7d99a91a7528`)
- **Notion workspace page**: Surfaced Art (ID: `30e5b1af-d33b-81ea-b65e-d3daa70cd6cb`)
- **Notion Planning Session Documents DB data source**: `36769d88-8ebe-40a3-bb5c-9e1a3fa03358`
- **Output directory**: `untracked/team/`
- **Release stages**: Alpha, Beta, MVP, MMP, GA

## Notion Document Page IDs

These are the 7 living documents in the Planning Session Documents database. They are updated in-place, never re-created.

| Document | Page ID | Type |
|----------|---------|------|
| Release Plan & Feature Matrix | `31f5b1af-d33b-81ac-b853-ef4161b17201` | Release Plan |
| Product Roadmap | `31f5b1af-d33b-8102-ad02-fb0701ea4d24` | Product Roadmap |
| Risk Register | `31f5b1af-d33b-8117-af18-f5f743882832` | Risk Register |
| Technical Debt Register | `31f5b1af-d33b-81ea-bd2a-dc00317025d9` | Tech Debt |
| Go-to-Market Plan | `31f5b1af-d33b-8132-85a3-d85b0b66c20e` | Go-to-Market |
| Gap Analysis | `31f5b1af-d33b-81ae-a031-dd08a53ed6e2` | Gap Analysis |
| New Work Items — Deduplicated | `31f5b1af-d33b-8166-9b27-e46e528d3319` | Work Items |

## The 7 Team Roles

Each agent represents a specialized team member:

1. **Frontend/UX** — Pages, components, design system, accessibility, performance
2. **Backend/API** — Endpoints, data model, Stripe, email, webhooks
3. **Infrastructure/DevOps** — Terraform, CI/CD, AWS, monitoring, cost
4. **Security/Compliance** — Auth, CORS, secrets, legal requirements, PCI
5. **Growth/Marketing** — Artist outreach, SEO, social, content, email campaigns
6. **Data/Analytics** — PostHog, events, dashboards, consent, feature flags
7. **Product/Artist Advocate** — Artist experience, marketplace strategy, prioritization

## Phase 1 — Research (7 parallel agents)

Launch 7 agents in parallel. Each agent:

1. Reads all Linear issues for the team (use `list_issues` with team filter)
2. Reads relevant codebase files for their silo
3. Reads relevant docs from `docs/` directory
4. Reads the MEMORY.md file for project context
5. Writes a status report to `untracked/team/status/{role}.md`

Each status report should cover:
- Current state of their silo (what's built, what's working)
- Known issues and bugs in their area
- Existing Linear issues in their domain
- Dependencies on other silos
- Risks and concerns

## Phase 2 — Stage Plans (7 parallel agents)

Launch 7 agents in parallel. Each agent:

1. Reads their own status report from Phase 1
2. Reads ALL other status reports (cross-silo awareness)
3. Reads the PREVIOUS version of the relevant synthesis documents (from `untracked/team/synthesis/`) to understand what changed since last session
4. Creates a stage plan covering Alpha through GA for their silo
5. Writes to `untracked/team/plans/{role}.md`

Each plan should include:
- What to build at each stage (Alpha, Beta, MVP, MMP, GA)
- Priority ordering within each stage
- Dependencies on other silos
- **New work discovered** — items not in Linear yet
- **Priority conflicts** — where they disagree with current Linear assignments
- **Changes since last session** — what's been completed, what shifted
- **Risks** specific to their silo
- Effort estimates per item

## Phase 3 — Synthesis (single agent, sequential)

Read all 14 files from Phases 1-2, plus the PREVIOUS versions of the 7 synthesis documents. Produce updated versions of all 7 documents:

1. **Release Plan & Feature Matrix** (`untracked/team/synthesis/01_release_plan_feature_matrix.md`)
2. **Product Roadmap** (`untracked/team/synthesis/02_product_roadmap.md`)
3. **Risk Register** (`untracked/team/synthesis/03_risk_register.md`)
4. **Technical Debt Register** (`untracked/team/synthesis/04_tech_debt_register.md`)
5. **Go-to-Market Plan** (`untracked/team/synthesis/05_go_to_market_plan.md`)
6. **Gap Analysis** (`untracked/team/synthesis/06_gap_analysis.md`)
7. **New Work Items — Deduplicated** (`untracked/team/synthesis/07_new_work_items_deduplicated.md`)

### Versioning Rules

Each document is a living document. When updating:

1. **Read the existing document** to find the current version number (e.g., "Planning Session v1")
2. **Increment the version** (v1 → v2, v2 → v3, etc.)
3. **Update the header** to show the new version and today's date
4. **Update the content** with the latest findings — this is a full replacement of the document body, not an append
5. **Add a changelog entry** at the bottom of the document:
   ```
   ## Changelog
   | Version | Date | Changes |
   |---------|------|---------|
   | v2 | 2026-04-15 | Added 3 new risks. Closed TD01, TD03. Updated timelines for Beta. |
   | v1 | 2026-03-09 | Initial creation. |
   ```
   - New entries go at the TOP of the changelog table (newest first)
   - Each entry summarizes what materially changed from the previous version

### What to track in changes

- Items completed since last session (move from gap → done)
- New items discovered
- Risk scores that changed
- Debt items resolved
- Timeline shifts
- New blockers or resolved blockers
- Stage transitions (e.g., "Alpha → complete, now in Beta")

## Phase 4 — Linear Issues

Using the deduplicated work items from document 07:

### New Issues
For each NEW ISSUE item that doesn't already exist in Linear:
1. **Search first** — check existing Linear issues to avoid duplicates
2. Look up the correct Linear project (use `list_projects`)
3. Look up label IDs (use `list_issue_labels`)
4. Create the issue with `save_issue`:
   - Title from the work item
   - Description with context, acceptance criteria where applicable
   - Appropriate labels
   - Priority: Urgent for Alpha blockers, High for Alpha, Medium for Beta, Low for later
   - State: "Ready" for Alpha items, "Backlog" for later stages

### Updates to Existing Issues
For each UPDATE item:
1. Fetch the existing issue
2. Apply the specified change (status, priority, stage, or mark as duplicate)
3. Add a comment noting the planning session as the source of the change

### Summary
After all issues are created/updated, output a summary table showing:
- Issues created per stage
- Issues updated
- Total count

## Phase 5 — Notion Update

Update the 7 living documents in the Planning Session Documents database:

1. For each document, use `notion-fetch` to get the current page content
2. Use `notion-update-page` with `replace_content` to update the full content with the new version
3. Update the "Last Updated" date property to today's date
4. The content should include:
   - **Version header** at the top: `**Current Version: vN**`
   - Full document body
   - **Changelog table** at the bottom with all version entries (newest first)

### Notion Page Update Pattern

```
For each of the 7 documents:
  1. Fetch current page content (notion-fetch)
  2. Replace content with new version (notion-update-page, command: replace_content)
  3. Update properties: Last Updated = today (notion-update-page, command: update_properties)
```

## Execution Order

```
Phase 1 (parallel) ──> Phase 2 (parallel) ──> Phase 3 (sequential) ──> Phase 4 (sequential) ──> Phase 5 (sequential)
```

Phases 1 and 2 each launch 7 agents in parallel for speed. Phases 3-5 are sequential because each depends on the previous.

## Key Rules

- **Living documents** — the 7 synthesis documents and their Notion counterparts are updated in-place, never duplicated
- **Always increment version** — every planning session bumps the version number on each document
- **Always add changelog entry** — every update must record what changed
- **Deduplicate rigorously** — items found by multiple agents in Phase 3 must be merged, not duplicated
- **Never create duplicate Linear issues** — search existing issues before creating new ones
- **Only store synthesis in Notion** — intermediate files (status reports, plans) stay local only
- **Overwrite local synthesis files** — the local `untracked/team/synthesis/` files get replaced with the latest version each session
