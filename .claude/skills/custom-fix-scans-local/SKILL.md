---
name: custom-fix-scans-local
description: Run all local security scans (npm audit, Trivy FS, Trivy IaC, Semgrep, Dependabot), triage every finding, implement fixes on a feature branch, and open a PR.
disable-model-invocation: true
allowed-tools: Bash, Read, Edit, Write, Grep, Glob, TodoWrite
---

# Fix Security Findings — Local Scan Mode

Run all local scanners, triage every finding, implement fixes, and open a PR.

## Workflow

### 1. Run all local scans

```bash
npm run security:scan
```

This runs npm audit, Trivy FS, Trivy IaC, Semgrep, and fetches Dependabot alerts. Reports are saved to `.security-reports/`.

### 2. Read all findings

```bash
cat .security-reports/summary.json
cat .security-reports/npm-audit.json
cat .security-reports/trivy-fs.json
cat .security-reports/trivy-iac.json
cat .security-reports/semgrep.json
cat .security-reports/dependabot.json
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

### 6. Re-run scans to verify fixes

```bash
npm run security:scan
cat .security-reports/summary.json
```

All previously actionable findings should now be gone or in `.trivyignore`.

### 7. Run all quality gates

All must pass before committing:
```bash
npm run test
npm run lint
npm run typecheck
npm run build
```

### 8. Commit and push

Stage only changed files (not unrelated untracked files):
```bash
git add <specific files>
git commit -m "fix(security): address local security scan findings

- <finding 1>: <what was done>
- <finding 2>: <what was done>
- <cve>: added to .trivyignore (<reason>)"
git push -u origin fix/security-scan-findings
```

### 9. Open a PR

```bash
gh pr create \
  --base dev \
  --title "fix(security): address local security scan findings" \
  --body "$(cat <<'EOF'
## Summary

Fixes findings from local security scans (npm audit, Trivy FS, Trivy IaC, Semgrep, Dependabot).

## Findings addressed

| Finding | Source | Action |
|---|---|---|
| <description> | npm audit / Trivy FS / Trivy IaC / Semgrep / Dependabot | Fixed: <what> |
| <cve> | Trivy FS | Added to .trivyignore: <reason> |

## Findings skipped

| Finding | Reason |
|---|---|
| <description> | False positive / style opinion / already fixed |
EOF
)"
```

### 10. Report

Summarize:
- What was fixed and how
- What was added to `.trivyignore` and why (justify each one)
- What was skipped (with reasoning)
