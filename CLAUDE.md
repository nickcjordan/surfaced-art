# Claude Code Instructions for Surfaced Art

This file provides context and instructions for AI agents working on this codebase.

## Project Overview

Surfaced Art is a curated digital gallery for handmade art. Artists are vetted and accepted. Buyers can browse and purchase directly from artists. The platform takes 30% commission on each sale.

**Current Phase**: Phase 1 (Foundation) and Phase 2 (Artist Profile)

## Documentation

Before making changes, read the relevant documentation in `docs/`:

- `Surfaced_Art_Vision_v0.4.md` - Product decisions, what to build and what NOT to build
- `Surfaced_Art_Architecture_v1.0.md` - Tech stack decisions, infrastructure
- `Surfaced_Art_Data_Model_v1.0.md` - Complete database schema with all tables, fields, constraints
- `Surfaced_Art_Build_Order_v1.0.md` - Phased build plan
- `Surfaced_Art_Claude_Code_Brief_Phase1_2.md` - Detailed specs for Phase 1 & 2

## Tech Stack (Do Not Change)

| Layer | Technology |
|-------|------------|
| Frontend | Next.js (App Router), TypeScript, Tailwind CSS, ShadCN |
| Backend | Node.js + TypeScript + Hono on AWS Lambda |
| Database | PostgreSQL on AWS RDS, Prisma ORM |
| Infrastructure | Terraform, GitHub Actions |
| Hosting | Vercel (frontend), AWS (backend/infra) |

### Critical Vercel Discipline

**NEVER** import from `@vercel/*` packages. The platform must remain portable to OpenNext on AWS.

- Do NOT use Vercel Image Optimization
- Do NOT use Vercel KV, Postgres, Blob, or Analytics
- Use Next.js Image with `unoptimized` prop
- Use Sharp for image processing

## Issue-Driven Development Process

### Planning → Issues → Implementation

This project uses a two-layer workflow:

- **Notion** is the planning layer — product decisions, phase planning, specs, design work
- **GitHub Issues** are the execution layer — trackable dev tasks with clear acceptance criteria

### How tasks flow

1. **Design session** (Claude.ai or Claude Code) — discuss what to build, make decisions
2. **Create GitHub Issue** — use the "Dev Task" template, capturing design context, acceptance criteria, and scope
3. **Implementation** (Claude Code) — pick up the issue, create a feature branch, do the work
4. **PR** — open a PR linked to the issue with "Closes #N" in the description
5. **Review & merge** — human reviews and merges; issue auto-closes

### Issue workflow labels

| Label | Meaning |
|-------|---------|
| `ready` | Task is fully specified and ready to be picked up |
| `in-progress` | Currently being worked on |
| `blocked` | Waiting on a dependency or decision |

### Creating issues (for Claude)

When creating issues from a design session:

1. Use the **Dev Task** issue template
2. Fill in **Design Context** with key decisions and rationale from the session
3. Link to relevant **Notion pages** for background
4. Write **Acceptance Criteria** as specific, testable conditions
5. List the **Scope** (affected packages/files) so the implementer knows the blast radius
6. Add area labels (`frontend`, `backend`, `database`, `infrastructure`, etc.)
7. Set the `ready` label when the issue is fully specified

```bash
# Create an issue from CLI
gh issue create --title "feat(web): add artist profile header" \
  --label "ready,frontend" \
  --body "$(cat <<'EOF'
## Summary
...

## Design Context
...

## Acceptance Criteria
- [ ] ...
EOF
)"

# Pick up an issue — label it in-progress
gh issue edit <number> --remove-label "ready" --add-label "in-progress"

# After opening the PR that closes it
gh issue edit <number> --remove-label "in-progress"
```

### Picking up issues (for Claude Code)

When starting work on an issue:

1. Read the issue: `gh issue view <number>`
2. Label it `in-progress`: `gh issue edit <number> --remove-label "ready" --add-label "in-progress"`
3. Create a feature branch: `git checkout -b feat/<short-description> dev`
4. Implement following the acceptance criteria
5. Run all quality gates
6. Open a PR with "Closes #N" in the body
7. Remove `in-progress` label: `gh issue edit <number> --remove-label "in-progress"`

### For Every Task (implementation)

1. **Write tests first** (TDD approach using Vitest)
2. **Implement code** to make tests pass
3. **Run quality gates**:
   ```bash
   npm run test        # Vitest test suite
   npm run lint        # ESLint
   npm run typecheck   # tsc --noEmit
   npm run build       # Turborepo build
   ```
4. **Commit to dev branch** with conventional commit message
5. **Run regression tests** before pushing

### Branch Strategy

- Work on `dev` branch
- Create feature branches from `dev` for larger features
- Merge to `main` triggers production deployment

### Pull Request Rules (CRITICAL)

- **NEVER merge to `main`** — merging to main is always a human action
- When work is ready to merge, open a PR from CLI with a full description and stop
- Update PR descriptions with accurate summaries of what changed and why
- Prepare commit messages for human review, but do not execute the merge

### Commit Message Format

```
type(scope): description

Types: feat, fix, refactor, test, docs, chore
Scopes: web, api, db, types, utils, infra, ci
```

Examples:
- `feat(api): add artist profile endpoint`
- `fix(web): correct image aspect ratio on listing cards`
- `test(db): add seed validation tests`
- `docs: update CLAUDE.md with new workflow`

## Project Structure

```
/
├── apps/
│   ├── web/                  # Next.js frontend
│   └── api/                  # Hono Lambda backend
├── packages/
│   ├── types/                # Shared TypeScript interfaces
│   ├── db/                   # Prisma schema + client
│   └── utils/                # Shared utilities
├── infrastructure/
│   └── terraform/            # All Terraform config
├── .github/
│   └── workflows/            # CI/CD pipelines
└── docs/                     # Project documentation
```

## Key Data Model Rules

- All monetary values are stored as **integers in cents** (e.g., $125.00 = 12500)
- All primary keys are **UUIDs**
- `listings` has separate `artwork_*` and `packed_*` dimension fields
- `reviews` has 3 rating fields (product, communication, packaging) + computed overall_rating
- `user_roles` is a separate join table
- `reserved_until` on listings is checked on read (no background job needed)

## Testing

- **Unit tests**: Vitest for utils, type exports, API handlers (mocked Prisma)
- **Integration tests**: Vitest with test database
- **Component tests**: Vitest + React Testing Library
- **E2E tests**: Playwright (future phases)

## What NOT to Build (Phase 1 & 2)

Do NOT build these features yet:
- User authentication or sign-in UI
- Artist application form
- Artist dashboard or profile editor
- Checkout or payment processing
- Shipping rate calculation
- Commission flow
- Review system
- Admin tooling
- Search beyond category navigation
- Email sending (except infrastructure setup)
- Buyer account features

## Tracing Changes

To understand where a bug may have been introduced:

```bash
# View recent commits
git log --oneline -20

# View commits affecting a specific file
git log --oneline -- path/to/file

# View changes in a specific commit
git show <commit-hash>

# Find which commit introduced a change
git blame path/to/file
```

## Environment Variables

Required in `.env` files (never commit these):

```
DATABASE_URL=postgresql://[user]:[password]@[host]:5432/[dbname]
AWS_REGION=us-east-1
```

## No Shortcuts Policy

**NEVER take a shortcut or "convenient" approach.** This project is pre-launch with zero users — the cost of doing things right is at its lowest. Every shortcut taken now compounds later.

Before implementing any approach, ask: **"Is this the proper way to do this, or am I cutting a corner?"** If you sense you're working around a problem rather than solving it properly, **STOP and explain the situation to the user** before continuing. Let the user decide whether to accept the tradeoff.

Red flags that indicate a hacky approach:
- Symlinks or path hacks to fix module resolution
- Dual-purposing a component for unrelated responsibilities
- Hardcoding internal paths of third-party packages
- Swallowing errors to work around unexpected failures
- Adding workarounds that "only need to run once" but stay in the codebase forever
- Fighting the tool instead of using it as designed

If any of these arise, pause and present the user with:
1. What the hack is and why it's needed
2. What the proper solution looks like
3. The cost/effort difference between the two

## Quality Checklist Before Each Commit

- [ ] Tests pass (`npm run test`)
- [ ] No lint errors (`npm run lint`)
- [ ] No type errors (`npm run typecheck`)
- [ ] Build succeeds (`npm run build`)
- [ ] No `@vercel/*` imports added
- [ ] Monetary values stored as cents
- [ ] UUIDs used for primary keys

## Security Scanning (For Claude Code)

When the user asks to fix security issues or review scan results, use these commands:

### Run Local Security Scans

```bash
# Run all scans (npm audit, Trivy, Semgrep, Dependabot, PR bot reviews)
npm run security:scan

# Run individual scans
npm run security:npm        # npm audit only
npm run security:trivy      # Trivy filesystem + IaC
npm run security:semgrep    # Semgrep code analysis
npm run security:dependabot # Fetch GitHub Dependabot alerts
npm run security:pr-reviews # Fetch bot review comments from open PRs (Sourcery, etc.)
```

### Read Scan Results

After running scans, reports are saved to `.security-reports/`:

```bash
# Read summary of all findings
cat .security-reports/summary.json

# Read detailed reports
cat .security-reports/npm-audit.json
cat .security-reports/trivy-fs.json
cat .security-reports/trivy-iac.json
cat .security-reports/semgrep.json
cat .security-reports/dependabot.json
cat .security-reports/pr-reviews.json  # Bot comments from Sourcery, etc. on open PRs
```

### Security Fix Workflow

1. Run `npm run security:scan` to get current findings
2. Read `.security-reports/summary.json` to understand scope
3. For each finding:
   - Read the detailed report for context
   - Determine the fix (update dependency, change code, update Terraform)
   - Make the fix
   - Run tests to ensure no regressions
4. Re-run scan to verify fix
5. Commit with message: `fix(security): description of what was fixed`

### Tool Requirements

For full scanning, these tools should be installed locally:
- **Trivy**: `choco install trivy` (Windows) or `brew install trivy` (Mac)
- **Semgrep**: `pip install semgrep`
- **GitHub CLI**: For Dependabot, needs `GITHUB_TOKEN` env var with `security_events` scope

npm audit works out of the box with no additional setup.

## GitHub CLI (`gh`) — Required PAT Permissions

The `gh` CLI is used for PR creation, merging, and security scanning. If you hit
`GraphQL: Resource not accessible by personal access token`, the fine-grained PAT
is missing a permission. Here are all permissions required for full `gh` functionality:

| Permission | Level | Used for |
|---|---|---|
| **Contents** | Read-only | Reading branch refs, commits — needed by `gh pr create` / `gh pr merge` |
| **Pull requests** | Read and write | Creating and updating PRs |
| **Security events** | Read and write | Dependabot alerts via `gh api` |
| **Metadata** | Read-only | Automatically included, required for all operations |

**To update the token**: GitHub → Settings → Developer settings → Personal access tokens →
Fine-grained tokens → edit the token → update Repository permissions.

**Common error → missing permission mapping**:
- `repository.defaultBranchRef` → add **Contents: Read**
- `repository.pullRequest.commits` → add **Contents: Read**
- `repository.vulnerabilityAlerts` → add **Security events: Read**

## Future Infrastructure Tasks

- [ ] Add dev/staging environment (separate RDS, Lambda, etc.) - currently prod-only to minimize costs
- [ ] Set up Google OAuth credentials and replace placeholders in GitHub secrets
- [ ] Set up Apple Sign In credentials
- [ ] Configure custom domain for CloudFront CDN
- [ ] Add RDS Proxy when Lambda concurrency causes connection issues
- [ ] Migrate from Vercel to OpenNext when costs justify
