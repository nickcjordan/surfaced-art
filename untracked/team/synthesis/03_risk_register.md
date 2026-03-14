# Risk Register

*Planning Session v1 — 2026-03-09*

---

## Risk Scoring

- **Likelihood**: 1 (Unlikely) → 5 (Almost Certain)
- **Impact**: 1 (Negligible) → 5 (Critical)
- **Risk Score** = Likelihood × Impact
- **Priority**: Critical (≥15), High (10-14), Medium (5-9), Low (1-4)

---

## Active Risks

### Critical Priority (Score ≥ 15)

| ID | Risk | Likelihood | Impact | Score | Stage | Mitigation |
|----|------|-----------|--------|-------|-------|------------|
| R01 | **COO brand decisions delayed** — Beta cannot ship without brand identity. No timeline commitment yet. | 4 | 5 | 20 | Beta | Set hard deadline. Engineering can proceed on non-visual work in parallel. Identify minimum viable brand decisions (colors + fonts) vs nice-to-have (full brand guide). |
| R02 | **Attorney engagement delayed** — Artist agreement, DMCA, refund policy all need legal review. No attorney identified yet. | 4 | 5 | 20 | Beta | Start attorney search immediately. Use template agreements as starting point to reduce billable hours. Identify which docs are Beta-blocking vs MVP-blocking. |
| R03 | **MVP scope creep** — Phase 4 (transactions) is ~25 issues and touches every layer. Risk of timeline ballooning. | 3 | 5 | 15 | MVP | Strict scope discipline. Define "minimum purchase flow" vs "full commerce." Ship iteratively — basic checkout first, then shipping, then refunds. |

### High Priority (Score 10-14)

| ID | Risk | Likelihood | Impact | Score | Stage | Mitigation |
|----|------|-----------|--------|-------|-------|------------|
| R04 | **PostHog not collecting data in prod** — API key may not be configured. Flying blind on user behavior. | 3 | 4 | 12 | Alpha | Verify immediately. Single highest-ROI Alpha task. |
| R05 | **Chicken-and-egg marketplace problem** — Need artists to attract buyers, need buyers to attract artists. | 4 | 3 | 12 | Beta | Solve supply side first. Warm outreach to known artists. Founding artist perks (badge, lower commission). Don't need buyers until MVP. |
| R06 | **Auth flow bugs undiscovered** — User reports auth is "buggy" but issues not triaged. Could be blocking for artist onboarding. | 3 | 4 | 12 | Alpha | Dedicated auth testing session. Document all auth flows end-to-end. Fix before Beta invitations. |
| R07 | **Security gaps before real users** — S3 CORS wildcard, MFA off, secrets in env vars. Acceptable for dev, not for real artist data. | 3 | 4 | 12 | Alpha/Beta | S3 CORS fix in Alpha. MFA + secrets migration in Beta. No real artist data until security baseline met. |
| R08 | **Single point of failure — team size** — One developer, one COO. No redundancy for any function. | 4 | 3 | 12 | All | Document everything. Automate what's possible. Accept the risk — this is inherent to early-stage startups. |
| R09 | **Stripe Connect complexity** — Onboarding works, but payment capture, webhooks, refunds, and commission splits are complex. Edge cases abound. | 3 | 4 | 12 | MVP | Start Stripe integration early in MVP. Build comprehensive test suite. Use Stripe test mode extensively. Study Stripe marketplace best practices. |
| R10 | **No manual verification of deployed features** — "Almost nothing has been manually verified." Bugs may exist in production that tests don't catch. | 4 | 3 | 12 | Alpha | Schedule dedicated QA session before Beta. Use Visual QA automation suite. Test all critical paths manually at least once. |

### Medium Priority (Score 5-9)

| ID | Risk | Likelihood | Impact | Score | Stage | Mitigation |
|----|------|-----------|--------|-------|-------|------------|
| R11 | **Demo content mistaken for real** — 24 AI-generated artist profiles could confuse early visitors. | 3 | 3 | 9 | Beta | Clear labeling or removal of demo profiles before public-facing Beta. Swap to real artist content ASAP. |
| R12 | **Email deliverability** — Email infrastructure not fully configured. Welcome emails, order confirmations, etc. may not work. | 3 | 3 | 9 | Alpha/Beta | Verify email config in Alpha. Test delivery to major providers (Gmail, Outlook). Set up SPF/DKIM/DMARC. |
| R13 | **Cost escalation** — AWS costs grow from $55 → $400/mo. Sustainable for a bootstrapped startup? | 2 | 3 | 6 | MMP/GA | Budget alarms (Alpha). Monthly cost review. Scale infrastructure incrementally based on actual usage, not projections. |
| R14 | **Vercel vendor lock-in** — Platform must remain portable to OpenNext on AWS. Accidental @vercel/* imports could create lock-in. | 2 | 3 | 6 | All | CI lint rule already prevents @vercel/* imports. Maintain discipline. |
| R15 | **Accessibility lawsuit** — Art marketplace without WCAG compliance could face legal challenge. | 2 | 3 | 6 | MMP | WCAG 2.1 AA audit at MMP. Fix critical issues. Add accessibility statement page. |
| R16 | **Artist churn after onboarding** — Artists join but don't list work or maintain profiles. | 3 | 2 | 6 | Beta/MVP | High-touch onboarding for founding artists. Quick time-to-first-listing. Regular check-ins. |

### Low Priority (Score 1-4)

| ID | Risk | Likelihood | Impact | Score | Stage | Mitigation |
|----|------|-----------|--------|-------|-------|------------|
| R17 | **SEO regression** — Route changes or metadata gaps break search indexing. | 2 | 2 | 4 | All | Visual QA SEO tests run on every PR. Checklist in CLAUDE.md. |
| R18 | **Database connection exhaustion** — Lambda concurrency spikes overwhelm RDS connections. | 2 | 2 | 4 | GA | RDS Proxy planned for GA. Monitor connection counts. Current traffic levels are fine. |
| R19 | **Cross-platform lockfile issues** — Windows dev + Linux CI can cause npm lockfile drift. | 2 | 1 | 2 | All | npm ci in CI catches drift. Established lockfile rules in CLAUDE.md. |

---

## Risk Heatmap

```
Impact ↑
  5 │           R06,R07,R09   R01,R02
    │                         R03
  4 │           R04
    │           R10
  3 │     R16   R05,R11,R12   R08
    │           R13,R14,R15
  2 │     R18
    │     R17
  1 │ R19
    └──────────────────────────────→ Likelihood
      1    2    3    4    5
```

---

## Risk Review Cadence

| Frequency | Action |
|-----------|--------|
| Per stage transition | Full risk register review. Re-score all risks. Add new risks discovered during the stage. |
| Monthly | Quick scan for new risks. Update mitigations in progress. |
| After incidents | Post-mortem → new risk entries or re-scoring. |
