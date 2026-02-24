# ADR-003: Hono over Express for Lambda backend

**Status:** Accepted
**Date:** 2026-02-24

**Context:** The API backend runs on AWS Lambda and needs a routing/middleware framework. The two primary candidates were Express (the Node.js ecosystem default) and Hono (a lightweight TypeScript-native framework designed for serverless and edge runtimes).

**Decision:** Use Hono as the API framework. Hono provides routing, middleware (CORS, logging), request validation, and error handling with minimal overhead. It includes a built-in Lambda adapter (`hono/aws-lambda`) for seamless Lambda integration.

**Alternatives considered:**
- **Express** — The most widely used Node.js framework with the largest middleware ecosystem. However, Express was designed for long-running servers, not serverless functions. Its cold start overhead is measurable on Lambda. TypeScript support is bolted on rather than built in. The middleware ecosystem is largely unnecessary since the API uses a small number of focused middleware (CORS, logging, auth).
- **Raw Lambda handlers** — No framework at all. Rejected because consistent routing, middleware chains, and error handling would need to be reinvented in every handler. The result would be a homegrown framework without the testing and community support.
- **Fastify** — Faster than Express with better TypeScript support, but still designed for long-running servers. Its plugin system adds complexity that isn't justified for a serverless API with a small number of routes.

**Consequences:**
- Very low cold start overhead (~5ms framework initialization)
- TypeScript-first API design with typed context and middleware
- Smaller ecosystem than Express — if a specific middleware is needed, it may need to be written from scratch
- The `hono/aws-lambda` adapter handles API Gateway event translation transparently
- Testing uses Hono's built-in `app.request()` method — no HTTP server needed for unit tests
