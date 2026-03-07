---
name: fix-ai-suggestions
description: Read unaddressed AI code review messages from #ai-code-review Slack channel, triage each suggestion, implement valid fixes, and reply in Slack threads with outcomes. This skill should be used when the user runs /fix-ai-suggestions.
disable-model-invocation: true
allowed-tools: Bash, Read, Edit, Write, Grep, Glob, TodoWrite, mcp__claude_ai_Slack__slack_search_channels, mcp__claude_ai_Slack__slack_read_channel, mcp__claude_ai_Slack__slack_read_thread, mcp__claude_ai_Slack__slack_send_message
---

# Fix AI Code Review Suggestions

Scan the `#ai-code-review` Slack channel for unaddressed bot review messages, triage each suggestion, implement valid fixes, and reply in each Slack thread with the outcome.

## Constants

- **Repo**: `nickcjordan/surfaced-art`
- **Base branch**: `dev`

## Inputs

None. This skill takes no arguments.

## Workflow

### Phase 1 — Discover Unaddressed Messages

1. **Find the channel.** Use `slack_search_channels` with query `ai-code-review`. Extract the `channel_id` from the result.

2. **Read channel messages.** Use `slack_read_channel` with the channel ID. Set `limit` to `100`. If the response includes a `next_cursor`, paginate until all messages are fetched.

3. **For each message, check its thread.** Call `slack_read_thread` with the message's `channel_id` and `message_ts`.
   - If the thread contains **only the parent message** (no replies), the message is **unaddressed**.
   - If the thread has **any reply**, the message is **already addressed** — skip it.

4. **If there are zero unaddressed messages**, print "No unaddressed AI review messages found." and stop.

5. **Create a TodoWrite list** tracking each unaddressed message by its PR number and source bot.

### Phase 2 — Parse and Triage

6. **Parse each unaddressed Slack message** to extract:
   - **PR number** — look for `PR #(\d+)` in the message text
   - **Bot name** — `sourcery-ai` or `greptile-apps` from the header
   - **Message timestamp** (`ts`) — needed for thread replies later
   - **File paths and suggestions** — extract from the inline comment previews

7. **Fetch full review details from GitHub** for each unique PR number:
   ```bash
   gh pr view <PR_NUMBER> --json state,mergedAt,headRefName,baseRefName,url
   ```
   ```bash
   gh api repos/nickcjordan/surfaced-art/pulls/<PR_NUMBER>/comments --jq '.[] | select(.user.login | test("sourcery-ai|greptile-apps")) | {user: .user.login, path: .path, line: .line, body: .body, html_url: .html_url}'
   ```
   ```bash
   gh api repos/nickcjordan/surfaced-art/pulls/<PR_NUMBER>/reviews --jq '.[] | select(.user.type == "Bot") | {user: .user.login, state: .state, body: .body}'
   ```

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
Batch fix addressing AI code review findings from #ai-code-review Slack channel.
Triaged N unaddressed bot review messages across M PRs.

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

### Phase 5 — Reply in Slack Threads

20. **For every unaddressed Slack message processed**, post a thread reply using `slack_send_message` with the channel ID and `thread_ts` set to the message's timestamp.

21. **Reply format by outcome:**

    **Fixes applied to batch PR (merged PRs):**
    ```
    ✅ Addressed in <PR_URL>

    Fixed:
    • `file.ts` — description (commit `sha`)

    Skipped:
    • `file.ts` — reason
    ```

    **Fixes pushed to open PR branch:**
    ```
    ✅ Fixed — pushed directly to the PR branch.

    Fixed:
    • `file.ts` — description (commit `sha`)

    Skipped:
    • `file.ts` — reason
    ```

    **All findings already fixed:**
    ```
    ✅ Already fixed — all findings from this review have been resolved.
    • `file.ts` — code changed since this review
    ```

    **No actionable bugs (style/info only):**
    ```
    ⏭️ Ignored — no actionable bugs found in this review.
    • `file.ts` — style/opinion, skipped per project conventions
    ```

    **PR was closed without merging:**
    ```
    ⏭️ Ignored — PR was closed without merging. Findings not applicable.
    ```

### Phase 6 — Console Summary

22. **Print a final summary** to the console:
    - Total Slack messages scanned
    - Messages already addressed (skipped)
    - Messages processed this run
    - Fixes applied to merged PRs (count + batch PR link)
    - Fixes pushed to open PRs (count + list of PR branches)
    - Findings skipped (count by reason)

## Key Rules

- **One batch PR per session** for all merged-PR fixes. Individual commits per finding, but a single PR containing all of them.
- **Open PRs get fixes pushed to their branch** — no separate PR needed.
- **Commit per finding** — each fix gets its own commit with a descriptive message.
- Scope is derived from file path: `api`, `web`, `scripts`, `db`, `types`, `ci`, `infra`
- **Do NOT include Co-Authored-By lines in commit messages**

## Edge Cases

- **Zero unaddressed messages** — print summary and stop after Phase 1
- **All findings already fixed or ignored** — reply in Slack threads but do NOT create an empty PR
- **Multiple Slack messages for the same PR** — fetch GitHub comments once per PR, but reply to each Slack message individually with only the findings relevant to that message's bot
- **Open PR branches** — fetch with `git fetch origin <branch>`, read code with `git show origin/<branch>:<path>`, checkout to fix
- **Branch name collision** — append a counter (`-2`, `-3`) if `fix/ai-review-batch-YYYY-MM-DD` already exists
- **Quality gate failure** — fix the root cause, re-run all four quality gates. If the fix is non-trivial, revert the offending commit with `git revert`, re-run quality gates, and note the revert in the PR body and Slack reply
