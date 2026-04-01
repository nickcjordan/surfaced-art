---
name: custom-fix-scans
description: Find the latest failed Security Scan CI run (or a specific PR), read all scan findings, triage, implement fixes on a feature branch, and open a PR.
disable-model-invocation: true
argument-hint: [pr-number]
allowed-tools: Bash, Read, Edit, Write, Grep, Glob, TodoWrite
---

# Fix Security Scan Failures

Retrieve security scan findings from CI, triage each one, implement fixes on a feature branch, and open a PR.

## Inputs

- PR number (optional): `$ARGUMENTS`
- If omitted, auto-find the latest failed Security Scan run

## Workflow

### 1. Locate the failing run and PR

If a PR number was provided:
```bash
gh pr view $ARGUMENTS --json title,body,headRefName,baseRefName,state,url
gh pr checks $ARGUMENTS 2>&1 | grep "Security Scan"
# Find the run ID for the failing Security Scan check
gh run list --workflow=security.yml --branch <headRefName> --status=failure --limit=3 --json databaseId,headBranch,createdAt
```

If no PR number provided, find the latest failure automatically:
```bash
gh run list --workflow=security.yml --status=failure --limit=1 --json databaseId,headBranch,headSha
# Then find the associated PR
gh pr list --head <headBranch> --json number,title,url
```

### 2. Collect findings — CI output first, local scans only as fallback

**Always do these first (CI output is already computed):**
```bash
# Read the CI job failure logs
gh run view <run_id> --log-failed

# Read the Security Scan bot comment on the PR (separate from inline review comments)
gh api repos/{owner}/{repo}/issues/<pr_number>/comments \
  --jq '.[] | select(.user.login == "github-actions[bot]") | select(.body | startswith("#### Security Scan Results")) | .body'

# Always fetch Dependabot alerts (not included in CI comment)
gh api repos/{owner}/{repo}/dependabot/alerts --jq '[.[] | select(.state == "open")]'
```

**Only run local scans if CI output is missing or lacks detail:**
```bash
npm run security:scan
cat .security-reports/summary.json
cat .security-reports/npm-audit.json
cat .security-reports/trivy-fs.json
cat .security-reports/trivy-iac.json
```

### 3. Triage each finding

Categorize every finding as one of:
- **Fix: code change** — vulnerability in our own source code (regex, sanitization, injection, etc.)
- **Fix: dep update** — a direct dependency we control has a patched version available
- **Fix: IaC config** — Terraform misconfiguration flagged by Trivy IaC
- **Ignore: transitive/dev-only** — from a dep we don't control (e.g. `@prisma/dev` internal hono pins) — add to `.trivyignore` with explanation
- **Ignore: false positive** — not exploitable in our context — document why and skip

Create a todo list tracking each finding and its category.

### 4. Create a feature branch

```bash
git checkout -b fix/security-scan-findings dev
```

### 5. Fix each actionable finding (TDD-first for code changes)

**Code changes:**
- Write failing Vitest tests first that encode the security property being fixed
- Implement the fix to make tests pass
- Check for the same pattern elsewhere in the file or codebase

**Dependency updates:**
```bash
npm update <package-name>
# or pin a specific version in package.json, then:
npm install
```

**Terraform IaC misconfigurations:**
- Read the flagged Terraform file
- Apply the recommended fix (encryption, access controls, etc.)

**`.trivyignore` additions:**
- Add the CVE ID and a comment explaining why it's acceptable:
  ```
  # <package>@<version> is an internal dep of <upstream-pkg> — only <upstream> can fix this.
  # Our direct dep is already patched (<package>@<patched-version>).
  CVE-XXXX-XXXXX
  ```
- Verify `--ignorefile .trivyignore` is present in the Trivy CLI step in `.github/workflows/security.yml`
- Verify `trivyignores: '.trivyignore'` is set on the `aquasecurity/trivy-action` step

### 6. Run all quality gates

All must pass before committing:
```bash
npm run test
npm run lint
npm run typecheck
npm run build
```

### 7. Commit and push

Stage only changed files (not unrelated untracked files):
```bash
git add <specific files>
git commit -m "fix(security): address Security Scan findings

- <finding 1>: <what was done>
- <finding 2>: <what was done>
- <cve>: added to .trivyignore (<reason>)"
git push -u origin fix/security-scan-findings
```

### 8. Open a PR

```bash
gh pr create \
  --base dev \
  --title "fix(security): address Security Scan findings" \
  --body "$(cat <<'EOF'
## Summary

Fixes failing Security Scan CI check.

## Findings addressed

| Finding | Source | Action |
|---|---|---|
| <description> | npm audit / Trivy FS / Trivy IaC | Fixed: <what> |
| <cve> | Trivy FS | Added to .trivyignore: <reason> |
| <finding> | Dependabot | Dep updated to <version> |

## Findings skipped

| Finding | Reason |
|---|---|
| <description> | False positive / style opinion / already fixed |
EOF
)"
```

### 9. Report

Summarize:
- What was fixed and how
- What was added to `.trivyignore` and why (justify each one)
- What was skipped (with reasoning)
