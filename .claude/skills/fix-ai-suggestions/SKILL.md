---
name: fix-ai-suggestions
description: Discover AI bot review comments on recent PRs via GitHub API, triage each suggestion, and implement valid fixes. This skill should be used when the user runs /fix-ai-suggestions.
disable-model-invocation: true
---

# Fix AI Code Review Suggestions

Discover bot review comments on recent PRs via GitHub API, triage each suggestion, and implement valid fixes.

## Constants

- **Repo**: `nickcjordan/surfaced-art`
- **Base branch**: `dev`
- **Bot logins**: `sourcery-ai[bot]`, `greptile-apps[bot]`

## Inputs

None. This skill takes no arguments.

## Workflow

### Phase 1 — Discover Bot Review Comments via GitHub

1. **List recent merged PRs** targeting `dev` (last 30 PRs):
   ```bash
   gh pr list --repo nickcjordan/surfaced-art --state merged --base dev --limit 30 --json number,title,mergedAt,headRefName,url
   ```

2. **List any open PRs** targeting `dev`:
   ```bash
   gh pr list --repo nickcjordan/surfaced-art --state open --base dev --json number,title,headRefName,url
   ```

3. **For each PR, fetch bot inline review comments** in parallel (batch by PR):
   ```bash
   gh api repos/nickcjordan/surfaced-art/pulls/<PR_NUMBER>/comments --jq '[.[] | select(.user.login | test("sourcery-ai|greptile")) | {user: .user.login, path: .path, line: .line, body: .body, html_url: .html_url}]'
   ```

4. **Filter to PRs that have actionable bot inline comments.** Skip PRs with zero bot inline comments. Review-level body-only comments (no file/line reference) are not actionable.

5. **Determine which PRs have already been addressed** by checking if a previous batch fix PR exists:
   - Look at the last batch fix PR title pattern: `fix: address AI code review findings (batch YYYY-MM-DD)`
   - PRs merged **before** the last batch fix PR's merge date have already been addressed — skip them
   - If no previous batch fix PR exists, all PRs are candidates

6. **If zero unaddressed PRs with bot comments remain**, print "No unaddressed AI review findings found." and stop.

7. **Create a TodoWrite list** tracking each unaddressed PR by number and source bot.

### Phase 2 — Triage

8. **Categorize each PR** and determine how to handle findings:

   | PR State | Action |
   |----------|--------|
   | Closed without merging | All findings **not applicable** — ignore |
   | Merged to `dev` | Read code from `dev` via `git show dev:<path>`. Fix on a batch branch. |
   | Open (not yet merged) | Read code from the PR branch via `git show origin/<branch>:<path>`. Fix by pushing commits to the PR branch. |

9. **Triage each finding:**
   - Read the current file (from `dev` for merged PRs, from the PR branch for open PRs)
   - If the file no longer exists or the flagged code pattern is gone — **already fixed**
   - If the issue still exists — determine the outcome:
     - **Fix**: The suggestion is valid (bug, missing validation, error handling, security issue, meaningful improvement) — implement the change
     - **Ignore**: The suggestion is stylistic, opinionated, informational, or incorrect — skip it with reasoning

### Phase 3 — Implement Fixes

There are two fix paths depending on PR state. Both produce commits in this session.

#### Path A: Merged PRs → Batch Branch

10. **Ensure `dev` is up to date:**
    ```bash
    git checkout dev
    ```
    ```bash
    git pull origin dev
    ```

11. **Create a single fix branch for all merged-PR fixes:**
    ```bash
    git checkout -b fix/ai-review-batch-YYYY-MM-DD dev
    ```
    Use today's date. If the branch already exists, append `-2`, `-3`, etc.

12. **For each fix from a merged PR**, grouped by PR:
    - Read the affected file(s) to understand surrounding context
    - Implement the change
    - Look for the same pattern elsewhere in the file or codebase
    - Stage only the changed files by name
    - Commit with format: `fix(<scope>): <description>`
    - **Do NOT include Co-Authored-By lines in commit messages**

13. **Run all quality gates** after all commits are made:
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
    All four must pass. If any fail, fix the issue and re-run all four.

14. **Push the branch and create one PR** targeting `dev`:
    ```bash
    git push -u origin <branch-name>
    ```
    ```bash
    gh pr create --base dev --title "fix: address AI code review findings (batch YYYY-MM-DD)" --body "<body>"
    ```

15. **PR body structure** — see Phase 4 below for format.

    If there are zero fixes from merged PRs, do NOT create a batch PR.

#### Path B: Open PRs → Push to PR Branch

16. **For each open PR with actionable fixes:**
    ```bash
    git checkout <pr-branch-name>
    ```

17. **For each fix on this branch:**
    - Read the affected file(s) to understand surrounding context
    - Implement the change
    - Stage only the changed files by name
    - Commit with format: `fix(<scope>): <description>`
    - **Do NOT include Co-Authored-By lines in commit messages**

18. **Push to the PR branch:**
    ```bash
    git push origin <pr-branch-name>
    ```

19. Repeat for each open PR with fixes.

### Phase 4 — PR Body (for batch PR only)

```markdown
## Summary
Batch fix addressing AI code review findings.
Triaged N bot review comments across M PRs.

## Fixes Applied
| File | Issue | Source | Commit |
|------|-------|--------|--------|
| `path/to/file.ts` | Description of fix | Sourcery / Greptile | `abc1234` |

## Skipped (with reasoning)
| File | Issue | Reason |
|------|-------|--------|
| `path/to/file.ts` | Description | Already fixed / Style-only / Not applicable |

## Source Reviews
- PR #NNN: https://github.com/nickcjordan/surfaced-art/pull/NNN
```

### Phase 5 — Console Summary

20. **Print a final summary** to the console:
    - Total PRs scanned
    - PRs with bot review comments
    - PRs already addressed (skipped — before last batch fix)
    - PRs processed this run
    - Fixes applied to merged PRs (count + batch PR link)
    - Fixes pushed to open PRs (count + list of PR branches)
    - Findings skipped (count by reason)

## Key Rules

- **GitHub API is the sole source of truth** for discovering and reading bot review comments. No Slack interaction.
- **One batch PR per session** for all merged-PR fixes. Individual commits per finding, but a single PR containing all of them.
- **Open PRs get fixes pushed to their branch** — no separate PR needed.
- **Commit per finding** — each fix gets its own commit with a descriptive message.
- Scope is derived from file path: `api`, `web`, `scripts`, `db`, `types`, `ci`, `infra`
- **Do NOT include Co-Authored-By lines in commit messages**

## Edge Cases

- **Zero bot comments found** — print summary and stop after Phase 1
- **All findings already addressed** — print summary and stop
- **All findings already fixed or ignored** — do NOT create an empty PR
- **Open PR branches** — fetch with `git fetch origin <branch>`, read code with `git show origin/<branch>:<path>`, checkout to fix
- **Branch name collision** — append a counter (`-2`, `-3`) if `fix/ai-review-batch-YYYY-MM-DD` already exists
- **Quality gate failure** — fix the root cause, re-run all four quality gates. If the fix is non-trivial, revert the offending commit with `git revert`, re-run quality gates, and note the revert in the PR body
