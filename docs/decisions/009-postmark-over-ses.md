# ADR-009: Postmark over AWS SES for transactional email

**Status:** Accepted
**Date:** 2026-03-15

**Context:** Surfaced Art needs production-ready transactional email for artist application confirmations, approval/rejection notices, and future order-related emails. AWS SES was initially implemented (packages/email/ workspace, Terraform module, IAM policies) but was never fully activated — DNS records were never added to the domain registrar, and the account remained in sandbox mode. With real artist onboarding approaching, we evaluated the email landscape for a solution that provides reliable delivery, a dashboard accessible to non-technical stakeholders (the COO), and automatic bounce/complaint handling.

**Decision:** Replace AWS SES with Postmark for all transactional email. The existing `sendEmail()` abstraction in `packages/email/` means only the transport layer changes — React Email templates, API route integrations, and the public package API remain unchanged. Marketing email (newsletters, campaigns) is deferred to a separate service (Kit/ConvertKit is the leading candidate) when needed.

**Alternatives considered:**

- **Keep AWS SES** — $0 cost, already coded, Terraform-managed. However: requires manual sandbox exit approval, DIY bounce/complaint handling (SNS topics + Lambda + suppression list), no dashboard for non-technical team members, DNS records were never configured. Estimated 2-3 days of additional work to make production-ready with basic operational visibility.
- **Resend** — Best developer experience (native React Email integration by the same team), $0 free tier. However: 1-day log retention on free / 3-day on $20/mo tier, concerning reliability history (production database accidentally dropped in Feb 2024), no Terraform provider. Short retention means building webhook-based logging to compensate.
- **Brevo (Sendinblue)** — Best free tier (9,000/mo), unlimited log retention, handles both transactional and marketing. However: tested deliverability of 79.8% (lowest of serious options) is a concern for transactional email where delivery reliability matters.
- **SendGrid** — Free tier being retired, $19.95/mo minimum. Deliverability has declined since Twilio acquisition. Over-engineered for current needs.

**Consequences:**

- Adds a SaaS dependency outside AWS ($15/month for 10,000 emails, offset by $75 startup credit)
- Removes SES Terraform module, IAM policy, and associated env vars
- Simplifies Lambda permissions (no SES IAM policy needed)
- Provides 45-day log retention (expandable to 365) with a COO-accessible dashboard
- Automatic bounce/complaint handling and suppression list management
- Introduces an external HTTP call from Lambda (vs SES which stays within AWS network)
- Community Terraform provider exists but is not used — Postmark config is managed via dashboard, matching the pattern used for Stripe
- Migration is low-risk: SES was never actively sending email in production
