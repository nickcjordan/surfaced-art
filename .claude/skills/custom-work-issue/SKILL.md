---
name: custom-work-issue
description: Pick up a GitHub issue, create a feature branch, implement with TDD, run quality gates, push, and open a PR.
disable-model-invocation: true
argument-hint: [issue-number]
allowed-tools: Bash, Read, Edit, Write, Grep, Glob, TodoWrite, Agent, AskUserQuestion
---

# Work Issue

Pick up a GitHub issue, implement it following TDD, and open a PR.

## Constants

- **Repo**: `nickcjordan/surfaced-art`
- **Base branch**: `dev`

## Inputs

- `$ARGUMENTS` — optional GitHub issue number. If omitted, all open issues are fetched and prioritized for the user to choose from.

## Workflow

### Phase 1 — Select Issue

**If an issue number is provided (`$ARGUMENTS` is not empty):**

1. **Fetch the issue:**
   ```bash
   gh issue view $0 --json number,title,body,labels,assignees,state,milestone
   ```

2. **Verify the issue is open and ready.** If it's closed, blocked, or already in-progress, inform the user and stop.

3. Proceed to Phase 2.

**If no issue number is provided:**

1. **Fetch all open issues:**
   ```bash
   gh issue list --state open --limit 200 --json number,title,labels,assignees,milestone,createdAt,body
   ```

2. **Read project context** to understand build order and priorities:
   - `docs/Surfaced_Art_Build_Order_v1.0.md`
   - `C:\Users\njord\.claude\projects\c--dev-src-surfaced-art\memory\MEMORY.md`

3. **Analyze and rank issues** by priority. Consider:
   - **Labels**: `ready` issues first, skip `blocked` and `in-progress` issues
   - **Build order**: respect phase dependencies (finish current phase before next)
   - **Issue dependencies**: check issue bodies for "depends on #N" or "blocked by #N" references
   - **Phase progression**: issues in the current active phase take priority
   - **Complexity**: prefer completing smaller, unblocking issues first when priorities are equal

4. **Present the prioritized list** to the user using AskUserQuestion. Show the top 3-4 issues with:
   - Issue number and title
   - Why it's prioritized (one-line rationale)
   - Recommend the top pick

5. **Wait for the user to confirm or choose a different issue.** Then fetch the full issue details:
   ```bash
   gh issue view <CHOSEN_NUMBER> --json number,title,body,labels,assignees,state,milestone
   ```

### Phase 2 — Set Up

6. **Label the issue as in-progress:**
   ```bash
   gh issue edit <NUMBER> --remove-label "ready" --add-label "in-progress"
   ```

7. **Ensure dev is up to date:**
   ```bash
   git checkout dev
   ```
   ```bash
   git pull origin dev
   ```

8. **Create a feature branch:**
   ```bash
   git checkout -b feat/<short-description> dev
   ```
   Derive `<short-description>` from the issue title (lowercase, hyphenated, concise).

### Phase 3 — Plan Implementation

9. **Read the issue's acceptance criteria** carefully. Parse the Design Context, Acceptance Criteria, and Scope sections from the issue body.

10. **Explore the codebase** to understand the relevant files, existing patterns, and utilities that should be reused. Use Agent with `Explore` subagent type for broader research, or direct Grep/Glob for targeted lookups.

11. **Create a TodoWrite task list** breaking down the implementation into specific steps based on the acceptance criteria. Each acceptance criterion should map to at least one task.

### Phase 4 — TDD Implementation

12. **Write failing tests FIRST.** For each acceptance criterion:
    - Write a test (Vitest) that encodes the expected behavior
    - Run the test to confirm it fails:
      ```bash
      npm run test
      ```
    - Only then implement the code to make it pass

13. **Implement the code** to make each test pass. Follow existing patterns and conventions in the codebase:
    - Reuse existing utilities and components
    - Follow the project's TypeScript conventions
    - Respect the design system architecture (if frontend)
    - Follow API conventions (if backend)
    - Update Bruno API collection if API endpoints change

14. **Run tests after each implementation step** to confirm tests pass:
    ```bash
    npm run test
    ```

### Phase 5 — Quality Gates

15. **Run ALL four quality gates** — all must pass:
    ```bash
    npm run test
    ```
    ```bash
    npm run lint
    ```
    ```bash
    npm run typecheck
    ```
    ```bash
    npm run build
    ```

16. **If any gate fails**, fix the issue and re-run ALL FOUR gates. Do not assume the others still pass.

### Phase 6 — Commit, Push, and PR

17. **Stage only the changed files** (not unrelated untracked files):
    ```bash
    git add <specific-files>
    ```

18. **Commit with a conventional commit message:**
    ```bash
    git commit -m "type(scope): description"
    ```
    - Derive type from the work done: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`
    - Derive scope from the affected area: `web`, `api`, `db`, `types`, `utils`, `infra`, `ci`
    - **Do NOT include Co-Authored-By lines**

19. **Push the branch:**
    ```bash
    git push -u origin feat/<short-description>
    ```

20. **Open a PR targeting dev:**
    ```bash
    gh pr create --base dev --title "type(scope): description" --body "<body>"
    ```
    - PR body must include `Closes #<NUMBER>` to auto-close the issue on merge
    - Include a summary of changes, what was implemented, and how it was tested

### Phase 7 — Clean Up and Report

21. **Remove the in-progress label** from the issue:
    ```bash
    gh issue edit <NUMBER> --remove-label "in-progress"
    ```

22. **Report to the user** with a summary of:
    - What was implemented
    - Tests written
    - Files changed
    - PR link
    - Any notes or follow-up items discovered during implementation

## Key Rules

- **TDD is mandatory** — write failing tests before implementation code. No exceptions.
- **Do NOT include Co-Authored-By lines** in commit messages
- **Run ALL FOUR quality gates** every time, not a subset
- **Do NOT merge the PR** — only create it. Merging is a human action.
- **Follow existing patterns** — read existing code before writing new code
- **Keep changes focused** — only implement what the issue asks for, no scope creep
- **Update Bruno collection** if any API endpoints are added, changed, or removed

## Edge Cases

- **Issue has no acceptance criteria** — read the issue description and Design Context to infer testable behavior. If truly ambiguous, ask the user for clarification before starting.
- **Issue depends on unmerged work** — inform the user and suggest picking a different issue.
- **Test infrastructure doesn't exist for the area** — set up the minimal test infrastructure needed (test file, mocks) before writing tests.
- **Quality gate fails on pre-existing issue** — if the failure is unrelated to your changes, note it in the PR description but do not fix unrelated issues in the same PR.
