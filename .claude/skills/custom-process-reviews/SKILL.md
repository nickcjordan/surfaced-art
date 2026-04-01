---
name: custom-process-reviews
description: Scan #ai-code-review Slack for unaddressed bot reviews, triage, fix bugs, and report back.
disable-model-invocation: true
argument-hint: [--dry-run]
allowed-tools: Bash, Read, Edit, Write, Grep, Glob, TodoWrite, Agent
---

# Process AI Code Reviews from Slack

Scan the `#ai-code-review` Slack channel for unaddressed bot review posts, triage each finding against the current `dev` branch, fix real bugs, and post thread replies with status.

## Constants

- **Channel ID**: `C0AJEPV0SNM` (`#ai-code-review`)
- **Bot ID**: `B0AHVEU97RR` (Surfaced Art Releases)
- **Repo**: `nickcjordan/surfaced-art`
- **Base branch**: `dev`

## Inputs

- `$ARGUMENTS` — optional flags:
  - Empty or omitted: full workflow (scan, triage, fix, PR, Slack replies)
  - `--dry-run`: scan and triage only, print results to console, no code changes or Slack replies

## Workflow

### Phase 1: Scan Slack Channel

1. **Read channel messages** using `slack_read_channel` on channel `C0AJEPV0SNM`. Request enough messages to cover the full backlog.

2. **Filter to bot review messages** — keep messages where:
   - The sender is bot `B0AHVEU97RR`
   - The text contains `:robot_face: AI Review:`
   - Exclude join/leave notifications and integration additions

3. **Check each message for thread replies** using `slack_read_thread` with the message's timestamp.
   - **Unaddressed** = zero thread replies, or only bot replies
   - **Already addressed** = has a human thread reply — skip

4. **Extract from each unaddressed message:**
   - PR number: parse `PR #(\d+)` from the header line
   - Tool name: `sourcery-ai` or `greptile-apps` from the header
   - Message timestamp (`ts`) for later thread replies
   - Whether it has inline comments (look for backtick-wrapped file paths)

5. **Create a TodoWrite tracking list** with one entry per unaddressed message.

### Phase 2: Fetch Full Review Details from GitHub

For each **unique PR number** found in Phase 1:

6. **Check PR state and merge status:**
   ```bash
   gh pr view <PR_NUMBER> --json state,merged,headRefName,baseRefName,url
   ```

7. **Fetch all bot review comments** (full text, not truncated Slack versions):
   ```bash
   gh api repos/nickcjordan/surfaced-art/pulls/<PR_NUMBER>/comments \
     --jq '.[] | select(.user.login | test("sourcery-ai|greptile-apps")) | {user: .user.login, path: .path, line: .line, body: .body, html_url: .html_url}'
   ```

8. **Fetch bot review bodies** (high-level feedback without inline comments):
   ```bash
   gh api repos/nickcjordan/surfaced-art/pulls/<PR_NUMBER>/reviews \
     --jq '.[] | select(.user.type == "Bot") | {user: .user.login, state: .state, body: .body}'
   ```

### Phase 3: Triage Against Current Code

9. **Check PR state first:**
   - If the PR was closed without merging — mark all findings as "PR closed without merge"
   - If merged or open — proceed to code check

10. **For each review comment**, check if the issue still exists on `dev`:
    ```bash
    git show dev:<file_path>
    ```
    - File no longer exists on `dev` — **stale**
    - Flagged code pattern no longer appears near the referenced line — **already resolved**
    - Code still has the issue — **actionable**

11. **Categorize each actionable finding:**
    - **Bug / bug_risk / security** — fix
    - **Sound improvement** (missing validation, error handling gaps) — fix
    - **Style / opinion / info** — skip

12. **Deduplicate** — when both Sourcery and Greptile flag the same file within ~10 lines, merge into a single fix item. Track which tools flagged it.

13. **If `--dry-run`**: print the triage results as a formatted table and stop. Do not proceed to Phase 4.

### Phase 4: Fix

14. **Ensure `dev` is up to date:**
    ```bash
    git checkout dev
    git pull origin dev
    ```

15. **Create the fix branch:**
    ```bash
    git checkout -b fix/ai-review-batch-$(date +%Y-%m-%d) dev
    ```
    If the branch already exists, append `-2`, `-3`, etc.

16. **Group actionable findings by source PR number.** For each PR's findings:
    - Read the affected file(s)
    - Understand surrounding code context
    - Implement the fix
    - Add or update tests if the change affects behavior
    - Look for the same pattern elsewhere in the file
    - Stage only the changed files
    - Commit with message: `fix(<scope>): address <tool> review feedback from PR #<N>`
    - Scope is derived from file path: `api`, `web`, `scripts`, `db`, `types`, `ci`
    - **Do NOT include Co-Authored-By lines**

17. **Run all quality gates** after all commits:
    ```bash
    npm run test
    npm run lint
    npm run typecheck
    npm run build
    ```

18. **If quality gates fail:**
    - Identify which commit caused the failure
    - Attempt to fix the issue
    - If the fix is non-trivial, `git revert <commit>` the offending commit
    - Re-run quality gates until they pass
    - Track reverted commits for Slack reporting

### Phase 5: Open PR

19. **Push and create PR:**
    ```bash
    git push -u origin <branch-name>
    gh pr create --base dev \
      --title "fix: address AI code review findings (batch YYYY-MM-DD)" \
      --body "<structured body>"
    ```

20. **PR body structure:**
    ```markdown
    ## Summary
    Batch fix addressing AI code review findings from #ai-code-review Slack channel.

    ## Fixes Applied
    | File | Issue | Source | Commit |
    |------|-------|--------|--------|
    | `path/to/file.ts` | Description of fix | Sourcery / Greptile | `abc1234` |

    ## Skipped (with reasoning)
    | File | Issue | Reason |
    |------|-------|--------|
    | `path/to/file.ts` | Description | Already fixed / Stale / Style-only |

    ## Source Reviews
    - PR #NNN: link to review
    ```

### Phase 6: Slack Thread Replies

21. **For every processed Slack message**, post a thread reply using `slack_send_message` with `thread_ts` set to the message's timestamp and channel `C0AJEPV0SNM`.

22. **Reply format varies by outcome:**

    **Fixes applied:**
    > Addressed in <PR_LINK>
    >
    > Fixed:
    > - `file.ts` — description (commit `sha`)
    >
    > Skipped:
    > - `file.ts` — reason

    **All findings stale or already resolved:**
    > All findings already addressed on `dev`.
    > - `file.ts` — code has changed since this review

    **No actionable bugs (style/info only):**
    > Reviewed — no actionable bugs found.
    > - `file.ts` — style/opinion, skipped per project conventions

    **PR was closed without merging:**
    > PR was closed without merging — findings not applicable to `dev`.

    **Fix was attempted but reverted:**
    > Partially addressed in <PR_LINK>
    >
    > Fixed:
    > - `file.ts` — description (commit `sha`)
    >
    > Reverted (needs manual review):
    > - `file.ts` — fix caused build failure

    **Summary-only review (no inline comments):**
    > No inline comments in this review — nothing to address.

## Edge Cases

- **Multiple Slack messages for same PR** — both tools post, Greptile sometimes posts twice. Group by PR, fetch GitHub comments once, but reply to each Slack message individually referencing only the findings relevant to that tool's comments.
- **PR branches deleted** — always read code from `dev` via `git show dev:<path>`, never from PR branches.
- **Branch name collision** — append counter (`-2`, `-3`) if `fix/ai-review-batch-YYYY-MM-DD` already exists.
- **Messages with no inline comments** — some reviews are summary-only ("looks great!"). Reply with "No inline comments — nothing to address."
- **Findings on code not yet on `dev`** — if a PR hasn't been merged to `dev` yet (e.g., still on a feature branch), the findings can't be checked against `dev`. Note this in the reply and skip.

## Final Report

After all phases complete, print a summary to console:
- Total Slack messages scanned
- Messages already addressed (had thread replies) — skipped
- Messages processed this run
- Findings breakdown: X actionable, Y skipped (by reason)
- Commits made
- PR link (if created)
- Any reverted fixes requiring manual attention
