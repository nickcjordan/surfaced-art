---
name: fix-pr-review
description: Fetch bot review comments from a GitHub PR, analyze the suggestions, implement fixes, run quality gates, commit, and push.
disable-model-invocation: true
argument-hint: <pr-number>
allowed-tools: Bash, Read, Edit, Write, Grep, Glob, TodoWrite
---

# Fix PR Review Comments

Retrieve and fix bot review comments (Sourcery, etc.) on a GitHub pull request.

## Inputs

- PR number: `$ARGUMENTS`

## Workflow

1. **Fetch PR metadata and review comments**
   ```bash
   gh pr view $0 --json title,body,headRefName,baseRefName,state,url
   gh api repos/{owner}/{repo}/pulls/$0/reviews --jq '.[] | select(.user.type == "Bot") | {user: .user.login, state: .state, body: .body}'
   gh api repos/{owner}/{repo}/pulls/$0/comments --jq '.[] | {user: .user.login, path: .path, line: .line, body: .body}'
   ```

2. **Analyze each suggestion** — Categorize as:
   - **Bug fix** — incorrect behavior, should always fix
   - **Improvement** — better patterns, logging, naming; fix if the suggestion is sound
   - **Style/opinion** — skip unless it aligns with project conventions

3. **Create a todo list** tracking each fix

4. **For each fix:**
   - Read the affected file(s) first
   - Make the change
   - Add or update tests if the change affects behavior

5. **Look for related issues** the review didn't catch — e.g., if a hardcoded name is flagged in one place, check if the same pattern exists elsewhere in the file

6. **Run all quality gates** (all must pass before committing):
   ```bash
   npm run test
   npm run lint
   npm run typecheck
   npm run build
   ```

7. **Commit and push** to the PR branch:
   - Stage only the changed files (not unrelated untracked files)
   - Use commit message format: `fix: address <reviewer> review feedback on <PR topic>`
   - Include `Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>`
   - Push to the branch the PR is on

8. **Report** what was fixed and what was skipped (with reasoning)
