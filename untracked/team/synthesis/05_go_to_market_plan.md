# Go-to-Market Plan

*Planning Session v1 — 2026-03-09*

---

## Market Position

**What**: Curated digital gallery for handmade art — vetted artists, direct purchase, 30% commission.

**Differentiation**: Not Etsy (mass market, algorithm-driven). Not Artsy (gallery middlemen, high prices). Surfaced Art is the curated middle — quality vetting with artist-direct pricing.

**Target buyer**: Design-conscious consumers who want original art but find galleries intimidating and Etsy overwhelming.

**Target artist**: Established makers (pottery, painting, sculpture, textiles) who have an Instagram following but no dedicated sales channel beyond craft fairs and DMs.

---

## Supply-Side Strategy (Artists First)

The marketplace chicken-and-egg is solved supply-first. Buyers have nothing to buy without artists. Artists can use their profile as a portfolio even without buyers.

### Artist Outreach Timeline

| Stage | Type | Timing Trigger | Target | Method |
|-------|------|---------------|--------|--------|
| **Beta** | Warm outreach | After: fake testimonial removed, OG images live, brand applied, 3+ real artists onboarded | 10-25 artists | Personal emails to known artists. "Founding artist" positioning. |
| **MMP** | Cold outreach | After: 25+ artists, real testimonials, referral program, blog posts | 50-100 artists | Instagram DMs, art fair networking, artist community posts. |
| **GA** | Open applications | After: self-serve onboarding wizard, enough social proof | 100+ artists | Open application form. PR/press. Community word-of-mouth. |

### "Impressive Enough" Checklist (Beta Gate)

Before inviting the first real artist, ALL of these must be true:

- [ ] Fake testimonial removed from /for-artists
- [ ] Real brand identity applied (not placeholder)
- [ ] Dynamic OG images work (SUR-116) — artist profile shares look professional on social
- [ ] Artist agreement exists (attorney-reviewed)
- [ ] At least 3 real artist profiles are live (to show it's not vaporware)
- [ ] Profile page is genuinely shareable — the "Instagram bio link" test
- [ ] Admin can review and approve applications via UI (not API-only)

### Founding Artist Program

- **Badge**: Visual indicator on profile (SUR-161)
- **Perks to define**: Lower commission rate? Priority support? Featured placement?
- **Narrative**: "You helped build this. Your early trust shaped the platform."
- **Target**: 10-25 artists who personally know the founders or are 1-degree connections

---

## Demand-Side Strategy (Buyers)

Buyers are NOT the focus until MVP (when purchase flow exists). Pre-MVP, the platform is artist-facing only.

### Growth Loops

**Loop #1 — Artist Social Sharing (Beta → onwards)**
```
Artist joins → builds profile → shares profile link on Instagram/X →
followers visit → some sign up for waitlist → waitlist converts to buyers at MVP
```
Unlocked by: Dynamic OG images (SUR-116). This is the single highest-leverage growth investment.

**Loop #2 — Purchase → Review → Discovery (MVP → onwards)**
```
Buyer purchases → leaves review → review appears on listing/artist page →
next buyer sees social proof → purchases → cycle continues
```
Unlocked by: Review system (MMP).

**Loop #3 — Referral (MMP → onwards)**
```
Buyer purchases → receives referral code → shares with friend →
friend gets discount → purchases → referee gets credit → cycle continues
```
Unlocked by: Referral program (MMP).

---

## Marketing Channels by Stage

### Beta (Awareness + Artist Recruitment)

| Channel | Action | Owner |
|---------|--------|-------|
| Email | Waitlist nurture sequence. Beta announcement. | Engineering + COO |
| Instagram | Brand account. Share artist profiles. Behind-the-scenes. | COO |
| /for-artists page | Already polished. Remove fake testimonial. | Engineering |
| Personal outreach | Direct emails/DMs to target artists. | COO |

### MVP (First Buyers)

| Channel | Action | Owner |
|---------|--------|-------|
| SEO | Artist profile pages rank for artist names. Category pages rank for art categories. | Engineering (already built) |
| Email | Purchase confirmation. Abandoned cart. Artist update notifications. | Engineering |
| Social media | Artist spotlight posts. New listing announcements. | COO |

### MMP (Growth)

| Channel | Action | Owner |
|---------|--------|-------|
| Blog | Artist interviews, process stories, collection guides. 2 posts/month. | COO |
| Referral program | Buyer-to-buyer referral with incentive. | Engineering |
| Email campaigns | Curated collection emails. Seasonal campaigns. | COO |
| Community | Art subreddits, craft communities, artist forums. | COO |

### GA (Scale)

| Channel | Action | Owner |
|---------|--------|-------|
| PR/Press | Design blogs, art publications, local press. | COO |
| Paid acquisition | Instagram/Facebook ads. Pinterest promoted pins. | COO |
| SEO expansion | Blog content, artist interviews, buying guides. | COO + Engineering |
| Partnerships | Interior designers, corporate art programs. | COO |

---

## Content Roadmap

| Stage | Content Type | Volume | Purpose |
|-------|-------------|--------|---------|
| Beta | /for-artists page (exists) | 1 page | Artist recruitment |
| Beta | Artist onboarding guide | 1 doc | Smooth first experience |
| MVP | Help center / FAQ | 5-10 pages | Buyer confidence |
| MMP | Blog — artist interviews | 2/month | SEO + social sharing |
| MMP | Blog — collection guides | 1/month | Buyer education |
| GA | Blog — process stories | 2/month | Community building |

---

## Key Metrics & KPIs

### Beta KPIs
- Artists invited: 25
- Artists who complete profiles: 15+ (60%+ conversion)
- Average listings per artist: 5+
- Profile link shares on social: tracked via UTM

### MVP KPIs
- First purchase within 2 weeks of launch
- Conversion rate (visit → purchase): 1-2%
- Average order value: $50-200
- Artist satisfaction (NPS or qualitative): positive

### MMP KPIs
- Monthly active buyers: 50+
- Repeat purchase rate: 10%+
- Review submission rate: 30%+ of purchases
- Referral program adoption: 15%+ of buyers share codes
- Blog traffic: 500+ monthly visits

### GA KPIs
- Monthly revenue: $5,000+ GMV
- Artist applications: 10+/month
- Artist retention (active listing after 90 days): 70%+
- Organic search traffic: 2,000+ monthly visits

---

## Budget Considerations

| Category | Beta | MVP | MMP | GA |
|----------|------|-----|-----|-----|
| AWS infrastructure | $75-100/mo | $150-200/mo | $200-300/mo | $250-400/mo |
| Attorney (one-time) | $2,000-5,000 | — | — | — |
| Sentry | $26/mo | $26/mo | $26/mo | $26/mo |
| Domain/CDN | $50/yr | — | — | — |
| Email service | $0-20/mo | $20-50/mo | $50-100/mo | $100-200/mo |
| Paid ads | $0 | $0 | $0-200/mo | $200-1,000/mo |
| **Total monthly** | **~$125-175** | **~$200-300** | **~$300-650** | **~$600-1,650** |

The attorney engagement ($2-5K one-time for Beta) is the largest single expense on the roadmap.
