---
name: custom-update-progress
description: Research project state across docs, Notion, and GitHub issues; fix inconsistencies; post a progress brief to the Progress Tracker Notion database.
disable-model-invocation: true
---

# Update Progress

Research the full project state, reconcile inconsistencies across all data sources, then create a progress brief in the Notion Progress Tracker database.

## Constants

- **Repo**: `nickcjordan/surfaced-art`
- **Base branch**: `dev`
- **Progress Tracker data source ID**: `37e7cc6d-4d2a-41b8-aceb-4a852f216c7b`
- **Progress Tracker database ID**: `2bb73105f420478d812bccb2ff86d06c`

## Inputs

None. This skill takes no arguments.

## Workflow

### Phase 1 — Gather Local Context

1. **Read the auto-memory file** at `C:\Users\njord\.claude\projects\c--dev-src-surfaced-art\memory\MEMORY.md` for saved project status context. This contains the current phase status, recent completions, and key project patterns. CLAUDE.md (loaded automatically) contains the phase definitions and build order.

2. **Read `docs/deferred-work-items.md`** — this is the only doc that may change between runs. The other docs (`Vision`, `Architecture`, `Build_Order`, `Claude_Code_Brief`) are stable reference material and should NOT be re-read unless the memory file indicates they've changed.

3. **Check recent git history** for commits since the last progress update:
   ```bash
   git log --oneline -20
   ```
   This provides a fast, high-signal view of what shipped recently.

### Phase 2 — Gather Notion Context

4. **Read the Progress Tracker database** using `notion-fetch` on database ID `2bb73105f420478d812bccb2ff86d06c` to see the schema and confirm the data source ID.

5. **Search the Progress Tracker data source** for recent entries to understand what was last recorded:
   ```
   notion-search query="progress update" data_source_url="collection://37e7cc6d-4d2a-41b8-aceb-4a852f216c7b"
   ```

6. **Search for all planning docs** to detect changes and new pages:
   ```
   notion-search query="Surfaced Art phase plan build order architecture vision"
   ```
   This search is cheap (one API call) and should always run. Compare results against the **Notion Page Timestamps** section of the most recent Progress Tracker entry:

   - **Changed pages**: Any result whose `timestamp` is newer than what was recorded → fetch its full content to understand what changed.
   - **New pages**: Any result whose page ID is NOT in the previous entry's timestamp table → fetch it, as it's a page you haven't seen before.
   - **Unchanged pages**: Timestamp matches or is older → skip fetching.

   Known key page IDs (not exhaustive — new pages may appear):
   - `30f5b1af-d33b-8129-99c4-d16ea5816718` — Implementation Plan (Phase 1 & 2)
   - `30e5b1af-d33b-812d-8ee9-e5e7fbdc803c` — Build Order
   - `30e5b1af-d33b-81f4-bdbe-db27deea0048` — Product Vision
   - `30e5b1af-d33b-8135-bf9f-c069f1f7bfa0` — Technical Architecture
   - `30e5b1af-d33b-81ea-b65e-d3daa70cd6cb` — Main project page

   **Important**: Always record ALL results (including new pages) in the Notion Page Timestamps section of the progress brief, so the next run has a complete baseline.

### Phase 3 — Gather GitHub Context

**Run all four of these commands in parallel** (they are independent):

7. **Fetch all open GitHub issues:**
   ```bash
   gh issue list --state open --limit 200 --json number,title,labels,assignees,milestone,createdAt,updatedAt
   ```

8. **Fetch recently closed issues** (last 50) to understand what was recently completed:
   ```bash
   gh issue list --state closed --limit 50 --json number,title,labels,closedAt,updatedAt
   ```

9. **Fetch open PRs** to understand work in flight:
   ```bash
   gh pr list --state open --json number,title,headRefName,baseRefName,labels,createdAt
   ```

10. **Check for blocked issues** specifically:
    ```bash
    gh issue list --state open --label blocked --json number,title,labels
    ```

### Phase 4 — Reconcile and Update

11. **Cross-reference all sources.** Compare the state described in:
    - Auto-memory phase status
    - GitHub issue state (open/closed/labels)
    - Notion project page
    - `docs/deferred-work-items.md`
    - Recent git commits

    Identify any inconsistencies: outdated phase status, issues that should be closed, missing issues for planned work, docs that reference completed items as pending, etc.

12. **If conflicting information is found** between two sources where the correct answer is ambiguous, **ask the user** using AskUserQuestion to clarify which direction is accurate. Do NOT guess.

13. **Make updates autonomously** for clear-cut fixes:
    - **GitHub issues**: Update titles, descriptions, or labels on existing issues. Create new issues for planned work that doesn't have an issue yet. Close issues that are clearly done.
    - **Docs**: Update markdown files in `docs/` where phase status, completion state, or references are outdated.
    - **Notion**: Update Notion pages where information is stale.
    - **Auto-memory**: Update `MEMORY.md` if the project phase status section is outdated.

14. **When creating new GitHub issues**, follow the project's Dev Task template convention:
    - Include Design Context, Acceptance Criteria, and Scope sections
    - Add appropriate labels (`ready`, area labels like `frontend`, `backend`, etc.)
    - Update any parent/related issues to reference the new issues

### Phase 5 — Compose and Publish Progress Brief

15. **Compose a high-level progress brief** that includes:
    - **Current Phase Status** — which phases are complete, in progress, or not started
    - **Recently Completed** — issues/PRs closed since the last progress entry
    - **Currently In Flight** — open PRs or in-progress issues
    - **Blocked Items** — anything labeled blocked, with the reason
    - **Updates Made This Run** — summary of docs/issues/Notion changes made in Phase 4
    - **Next Priorities** — the next 3-5 GitHub issues that should be worked on, ordered by priority. Consider:
      - Build order dependencies (what must come before what)
      - Labels (`ready` vs `blocked`)
      - Phase progression (finish current phase before starting next)
      - Issue dependencies noted in descriptions
    - For each priority issue, include: issue number, title, and a one-line rationale for why it's next
    - **Notion Page Timestamps** — record the page ID, title, and `timestamp` (last edited time) of **every** result from the Notion search in step 6. This is the baseline for the next run to detect changes and new pages. Format as a table with columns: Page ID, Title, Last Edited. Include all results, not just the known key pages.

16. **Create a new entry in the Progress Tracker database** using `notion-create-pages`:
    - Parent: data source `37e7cc6d-4d2a-41b8-aceb-4a852f216c7b`
    - Properties:
      - `Entry`: "Progress Update YYYY-MM-DD" (today's date)
      - `date:Date:start`: today's date in ISO-8601 format
      - `date:Date:is_datetime`: 0
    - Content: the full progress brief in markdown

17. **Return the progress brief** as the response to the user.

## Key Rules

- **Fully autonomous** — do not pause for confirmation except when two sources have genuinely conflicting information
- **Do NOT include Co-Authored-By lines** in any commit messages if code changes are made
- **Preserve existing issue structure** — when updating issues, keep the Dev Task template format intact
- **Date awareness** — use the current date for the progress entry, not a hardcoded date
