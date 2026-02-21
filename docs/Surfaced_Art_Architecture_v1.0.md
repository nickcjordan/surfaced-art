# Surfaced Art — Technical Architecture
*Version 1.0 · CTO Reference Document · February 2026 · Confidential*

*Surfaced Art*

## 1. Overview & Guiding Principles

This document defines the technical architecture for Surfaced Art. It covers stack decisions, infrastructure design, repository structure, CI/CD, third-party integrations, and the migration path for future scaling. It is a living document owned by the CTO and should be updated as architectural decisions evolve.

### Guiding Principles

- Serverless first — pay for what you use, scale without managing servers
- AWS-native — all infrastructure on AWS, managed by Terraform, no split vendor footprint
- Monorepo — frontend, backend, and infrastructure in one repository for shared types and unified deployment
- Avoid lock-in — use Vercel for initial hosting convenience but avoid proprietary Vercel features; exit path to AWS must remain clean
- Simple before complex — defer infrastructure complexity until traffic justifies it (e.g. RDS Proxy, search services, caching layers)
- Type safety end to end — TypeScript throughout, Prisma for database, shared types between frontend and backend

## 2. Full Stack Summary

| Layer | Technology | Notes |
| --- | --- | --- |
| Frontend | Next.js | App router. Avoid @vercel/* packages. |
| Frontend Hosting | Vercel (initial) | Migrate to OpenNext on AWS when cost justifies. |
| Styling | Tailwind CSS + ShadCN | Component library. No Vercel-specific styling tools. |
| Monorepo | Turborepo | Frontend + backend + infrastructure in one repo. |
| IaC | Terraform | All AWS infrastructure. Lives in /infrastructure/terraform. |
| CI/CD | GitHub Actions | Deploy frontend to Vercel, backend to Lambda, infra via Terraform. |
| Backend | Node.js + TypeScript + Hono | Serverless. Hono for routing and middleware. |
| Backend Hosting | AWS Lambda + API Gateway | Fully serverless. Pay-per-request at low traffic. |
| Database | PostgreSQL on AWS RDS | db.t3.micro to start. Scale instance size as needed. |
| ORM | Prisma | Type-safe queries. Schema-driven migrations. |
| File Storage | AWS S3 + CloudFront | Images uploaded via pre-signed URLs. Served via CDN. |
| Image Processing | Sharp | Processed at upload time. Replaces Vercel image optimization. |
| Video | Mux | Artist process section. Managed hosting, transcoding, delivery. |
| Payments | Stripe Connect + Stripe Tax | Marketplace split payments. Automatic tax calculation. |
| Shipping | Shippo | Rate calculation at checkout. Label generation. |
| Auth | AWS Cognito | Email, Google, Apple sign-in. JWT management. |
| Email | AWS SES + React Email | Transactional email. Templates built in React. |
| Search (v1) | PostgreSQL full-text | No additional infrastructure needed at launch. |

## 3. Frontend

### Framework: Next.js

Next.js is chosen over a pure React SPA primarily for SEO. Artist profiles, listing pages, and category pages must be crawlable by search engines. A SPA renders content client-side, which produces weaker SEO signals and requires significant additional engineering to replicate server-rendering. Next.js handles this at the framework level via Incremental Static Regeneration (ISR) and on-demand revalidation.
When an artist adds a new listing, the backend triggers on-demand revalidation of the relevant pages. Google can crawl the updated HTML within seconds. No full site rebuild is required. This approach scales to any catalog size without architectural changes.

### Hosting: Vercel (Initial)

Next.js is initially hosted on Vercel for development velocity. Vercel provides zero-config deployment, preview URLs per pull request, and excellent Next.js compatibility. It is the fastest way to get the frontend running without infrastructure overhead.

**Vercel Discipline — Avoiding Lock-In**
To preserve a clean migration path to AWS, the following rules apply from day one:
- Never import from @vercel/* packages in application code
- Do not use Vercel Image Optimization API — use Sharp for image processing at upload time instead
- Do not use Vercel Edge Middleware with Vercel-specific APIs
- Do not use Vercel KV, Vercel Postgres, or Vercel Blob — all data and storage lives on AWS
- Do not use Vercel Analytics — use a third-party analytics provider

> *Treat Vercel as a deployment platform only, not a feature provider. If a feature requires a @vercel/* import, find an alternative.*

### Migration Path: OpenNext on AWS

When Vercel costs become meaningful or when full infrastructure unification is desired, the frontend migrates to OpenNext — an open source adapter that runs Next.js on AWS Lambda, S3, and CloudFront. Because the application code contains no Vercel-proprietary dependencies, this migration requires only infrastructure changes, not code changes.
OpenNext is managed by the SST team and supports all standard Next.js features including ISR and on-demand revalidation. The migration is a one-time infrastructure task estimated at one to two focused engineering days.

### Styling: Tailwind CSS + ShadCN

Tailwind CSS for utility-first styling. ShadCN for pre-built accessible component primitives. Both are framework-agnostic and have no dependency on Vercel. ShadCN components are copied into the repository rather than installed as a dependency, giving full control over component code.

## 4. Backend

### Runtime: Node.js + TypeScript on AWS Lambda

The backend is fully serverless — AWS Lambda functions behind AWS API Gateway. This eliminates server management, scales automatically with traffic, and costs essentially nothing at low request volumes (AWS provides one million free Lambda invocations per month).
TypeScript is used throughout for type safety. Shared types between frontend and backend live in the packages/types workspace package in the monorepo, ensuring the same data shapes are used on both sides without duplication.

### Framework: Hono

Hono is a lightweight TypeScript-native web framework designed to run on Lambda and edge runtimes. It provides routing, middleware, request validation, and error handling without the overhead of Express. It adds no meaningful cold start penalty and is purpose-built for the serverless environment.
The alternative of writing raw Lambda handler functions was considered but rejected — Hono provides consistent patterns for routing and middleware that would otherwise be reinvented in every handler. The framework is thin enough that it does not impose architectural constraints.

### Database Connections: No RDS Proxy at Launch

AWS Lambda does not maintain persistent database connections between invocations, which can exhaust PostgreSQL's connection limit at high concurrency. The solution — AWS RDS Proxy — is intentionally deferred. At early traffic levels the connection limit on a db.t3.micro instance will not be reached. RDS Proxy is added when connection exhaustion errors appear in CloudWatch. It requires no application code changes — it sits transparently between Lambda and RDS.

> *CTO action: Set a CloudWatch alarm on RDS DatabaseConnections metric. When it approaches the instance connection limit, add RDS Proxy via Terraform.*

## 5. Database

### PostgreSQL on AWS RDS

PostgreSQL is chosen over DynamoDB. The platform's data model is fundamentally relational — artists have profiles, profiles have listings, listings have images and orders, orders have shipping events, users follow artists. These relationships are natural in PostgreSQL and awkward in DynamoDB.
DynamoDB was evaluated for cost reasons but rejected because the complex query patterns required (listings by category with artist data and images, filtered and sorted) would require significant data duplication and careful upfront access pattern design that constrains future flexibility.
**Initial instance: **db.t3.micro (~$15/month)
**Scaling path: **Vertical — upgrade instance size as traffic grows. Read replicas for read-heavy workloads at scale.

### ORM: Prisma

Prisma is a TypeScript-native ORM that provides type-safe database queries and schema-driven migrations. The Prisma schema file serves as the single source of truth for the database structure. Migrations are generated by Prisma and applied via CI/CD on deployment.
The Prisma client lives in packages/db in the monorepo and is imported by the backend. This means the database schema, generated types, and client are version-controlled alongside the application code that uses them.

## 6. Repository Structure

### Monorepo with Turborepo

A single Git repository contains the frontend, backend, shared packages, and infrastructure. Turborepo manages the build pipeline — it understands dependencies between packages and only rebuilds what changed. Build outputs are cached, keeping CI fast as the codebase grows.
The primary benefit of the monorepo for this platform is shared TypeScript types. Data shapes like Listing, Artist, Order, and Commission are defined once in packages/types and imported by both the frontend and backend. When a type changes, TypeScript immediately surfaces every affected callsite across the entire codebase.

| Path | Contents |
| --- | --- |
| apps/web/ | Next.js frontend application |
| apps/api/ | Node.js / Hono Lambda backend |
| packages/types/ | Shared TypeScript types (Listing, Artist, Order, etc.) |
| packages/db/ | Prisma schema and generated client |
| packages/utils/ | Shared utility functions used by both frontend and backend |
| infrastructure/terraform/ | All Terraform configuration for AWS resources |
| .github/workflows/ | GitHub Actions CI/CD pipelines |
| turbo.json | Turborepo pipeline configuration |
| package.json | Root workspace configuration |

### Key Turborepo Behaviors

- Build order is inferred from package dependencies — packages/types builds before apps/web and apps/api
- Unchanged packages are skipped — if only the frontend changed, the backend is not rebuilt
- Remote caching can be enabled via Vercel's free Turborepo cache to share build caches across CI runs

## 7. Infrastructure as Code

### Terraform

All AWS infrastructure is defined in Terraform, living in infrastructure/terraform/ within the monorepo. This includes RDS, Lambda functions, API Gateway, S3 buckets, CloudFront distributions, Cognito user pool, SES configuration, and IAM roles. No infrastructure is created manually in the AWS console.
Terraform state is stored in an S3 backend with DynamoDB state locking. This is itself bootstrapped via a small one-time Terraform configuration that pre-dates the main infrastructure.

### GitHub Actions CI/CD

GitHub Actions handles all deployment automation. Two primary workflows:

**Pull Request Workflow**
- Run Turborepo build to catch compilation errors
- Run TypeScript type checking across all packages
- Run tests
- Run Terraform plan and post the planned infrastructure changes as a PR comment
- Vercel automatically creates a preview deployment for the frontend

**Merge to Main Workflow**
- Run Turborepo build
- Run Terraform apply to provision or update AWS infrastructure
- Deploy Lambda functions via AWS CLI
- Run Prisma migrations against RDS
- Vercel automatically deploys the frontend to production

> *The Vercel deployment is handled by Vercel's GitHub integration, not GitHub Actions. When the monorepo is connected to Vercel, the Vercel project is configured with apps/web as the root directory. All other deployment steps are handled by GitHub Actions.*

## 8. File Storage & Media

### Images: AWS S3 + CloudFront + Sharp

All listing photos and artist profile images are stored in AWS S3 and served through CloudFront. Artists upload images directly from the browser using pre-signed S3 URLs — the frontend requests an upload URL from the backend, then uploads the file directly to S3 without routing through the application server.
Image processing is handled by Sharp at upload time. When an image is uploaded, a Lambda function generates optimized variants — multiple sizes for responsive display, WebP format for modern browsers, compressed originals. These variants are stored in S3 alongside the original and referenced by the frontend directly.
This approach replaces Vercel's Image Optimization and provides more control over output quality, which is important for an art platform where image fidelity matters.

**Image Requirements (from Urn Studios reference)**
- Accepted formats: JPEG, JPG, PNG
- Maximum upload size: 2MB per image (enforced client-side and server-side)
- Square format preferred for consistency
- Plain background preferred for listing photos

### Video: Mux

Artist process section videos are hosted on Mux. Artists upload video directly to Mux via a Mux-provided upload URL. Mux handles transcoding, adaptive bitrate streaming, and global delivery. The platform stores only the Mux asset ID and playback ID — no video files are stored on S3.
Mux's free tier covers early video volume. Pricing scales with storage and delivery at predictable rates.

## 9. Authentication

### AWS Cognito

AWS Cognito manages all user authentication — sign-up, sign-in, password reset, and OAuth via Google and Apple. Cognito issues JWTs that are validated by the backend on every protected API request. The frontend uses the AWS Amplify Auth library (the auth module only — not the full Amplify framework) to interact with Cognito.
Artists and buyers share the same Cognito user pool with a custom attribute indicating their role. A user can be both a buyer and an artist. Role-based access is enforced at the API layer using the role claim in the JWT.

## 10. Payments

### Stripe Connect

Stripe Connect with Express accounts handles all payment flows. The platform takes 30% of each sale; 70% goes to the artist. Stripe Connect manages this split automatically.

**Artist Onboarding**
Artists complete Stripe Connect Onboarding — a Stripe-hosted identity and banking verification flow — before they can receive payouts. The platform initiates this flow and stores only the resulting Stripe Account ID. No banking details pass through platform infrastructure.

**Payment Hold**
Stripe Connect's delayed payout configuration holds funds for a defined window after delivery confirmation before releasing to the artist. Suggested window: 7 days after expected delivery. This is configured at the Stripe account level and requires no application logic to enforce.

**Stripe Tax**
Stripe Tax calculates and collects US sales tax at checkout based on buyer location and product type. Enabled from day one. Eliminates the need for custom tax logic.

**Checkout Flow**
Stripe Payment Intents manages the full checkout lifecycle — payment capture, hold, dispute handling, and payout release. Stripe's hosted payment UI (Stripe Elements or Stripe Checkout) handles PCI compliance.

## 11. Shipping

### Shippo API

Shippo aggregates shipping rates from USPS, UPS, FedEx, and other carriers via a single API. At checkout, the backend calls Shippo with the artist's origin zip code, the buyer's destination zip code, the packed box dimensions, and the packed box weight. Shippo returns rate options which are presented to the buyer.
Shipping cost is a separate line item from the artwork price. The platform takes no commission on shipping — the full shipping cost paid by the buyer is passed through to the artist.

**Required Listing Data for Shipping**
- Artist origin zip code — stored on the artist profile
- Packed dimensions — length x width x height of the shipping box, collected as a required listing field
- Packed weight — total weight of the packed box in lbs, collected as a required listing field

> *Artwork dimensions and packed/shipping dimensions are separate fields. Shipping APIs require the packed box dimensions, not the artwork dimensions. Artists are guided to measure and weigh their packed box, not the artwork itself.*

**Label Generation**
v1: Artists enter a tracking number manually after shipping. The platform displays tracking status to the buyer. Full Shippo label purchase flow is a future enhancement.

## 12. Email

### AWS SES + React Email

AWS Simple Email Service handles all transactional email. React Email is used to build email templates in React — templates are developed and previewed locally, then rendered server-side and sent via SES.

**Email Types**
- Artist acceptance letter — formal gallery-style acceptance notification
- Order confirmation — buyer confirmation with order details and expected delivery window
- Shipping notification — tracking number and carrier link when artist marks as shipped
- Commission proposal — buyer notification with commission details for approval
- Delivery confirmation prompt — buyer prompt to confirm delivery and leave review
- Review nudge — post-delivery prompt to leave artist review
- Payout notification — artist notification when funds are released

## 13. Search

### Phase 1: PostgreSQL Full-Text Search

At launch, search is implemented using PostgreSQL's built-in full-text search capabilities. No additional infrastructure is required. Search covers listing titles, descriptions, artist names, and materials. PostgreSQL tsvector columns are maintained on the listings and artist profiles tables with appropriate GIN indexes.

### Phase 2: Faceted Filtering (Future)

Addition of filters by price range, medium, location, and availability. Still implementable in PostgreSQL with well-structured indexes at moderate catalog sizes.

### Phase 3: Dedicated Search Service (Future)

When catalog size or search sophistication outgrows PostgreSQL, migrate to Algolia or AWS OpenSearch. Algolia is the better developer experience; OpenSearch is more cost-effective at high volume and stays within AWS.

## 14. Cost Estimate at Low Traffic

| Service | Est. Monthly Cost | Notes |
| --- | --- | --- |
| AWS RDS (db.t3.micro) | ~$15 | Primary ongoing cost at low traffic |
| AWS Lambda + API Gateway | ~$0 | Free tier covers first 1M requests/month |
| AWS S3 + CloudFront | ~$0 | Negligible at low asset volume |
| AWS Cognito | ~$0 | Free up to 50,000 MAU |
| AWS SES | ~$0 | Practically free at low email volume |
| Vercel | $0-20 | Hobby (free) or Pro ($20/month) |
| Mux | ~$0 | Free tier covers early video volume |
| Stripe / Shippo | $0 | Pay-per-transaction only. No base cost. |
| TOTAL | ~$15-35/mo | Before meaningful transaction volume |

> *These estimates reflect near-zero traffic during development and early launch. Stripe fees (2.9% + $0.30 per transaction) and Shippo fees apply only when transactions occur. AWS costs scale predictably with usage.*

## 15. Future Architecture Considerations

The following are intentionally deferred. Current architecture decisions do not foreclose these options.

### RDS Proxy

- Add when Lambda concurrency causes connection exhaustion on RDS. Transparent to application code — infrastructure change only.

### OpenNext Migration (Vercel to AWS)

- Migrate Next.js frontend from Vercel to OpenNext on AWS Lambda + CloudFront when Vercel costs become meaningful or when full infrastructure unification is desired. Estimated migration effort: 1-2 engineering days. Zero application code changes required if Vercel discipline is maintained.

### Dedicated Search

- Algolia or AWS OpenSearch when PostgreSQL full-text search is insufficient for catalog size or search feature requirements.

### Caching Layer

- AWS ElastiCache (Redis) for caching frequently accessed data — category pages, featured listings, artist profiles. Add when database read load justifies it.

### Native Mobile App

- React Native is the natural choice given the existing React expertise. Shares types and utilities from the monorepo. Long-term roadmap item.

### Shippo Label Purchase Flow

- Full label generation and purchase within the platform, replacing the manual tracking number entry flow.

### Internal Admin Tooling

- Custom admin dashboard for application review, artist management, dispute handling, and platform analytics. Deferred until external tooling (Airtable, Notion) is insufficient.

> *This is a living document. Update when architectural decisions change. Major decisions require updating both this document and the Product Vision Document.*
