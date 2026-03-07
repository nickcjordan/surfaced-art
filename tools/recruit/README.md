# Artist Recruitment Automation Tools

Zero-cost tools for discovering and managing artist prospects for Surfaced Art's pipeline.

## Setup

```bash
npm install          # from repo root — workspace dependencies resolve automatically
```

### Environment Variables

| Variable           | Required by                    | How to get                                           |
|--------------------|-------------------------------|------------------------------------------------------|
| `NOTION_API_TOKEN` | Art Fair (push), Enricher, Etsy (push) | [Notion integrations](https://www.notion.so/my-integrations) |
| `ETSY_API_KEY`     | Etsy Browser                  | [Etsy developer portal](https://developers.etsy.com/) |

Reddit monitor requires no API keys (unauthenticated JSON API).

## Tools

### Reddit Keyword Monitor

Scans subreddits for posts from artists discussing platform alternatives.

```bash
npx tsx tools/recruit/src/reddit/cli.ts
npx tsx tools/recruit/src/reddit/cli.ts --days 7 --min-score 5
npx tsx tools/recruit/src/reddit/cli.ts --subreddits artbusiness,etsysellers --output json
```

### Art Fair Roster Scraper

Extracts artist lists from juried art fair websites.

```bash
npx tsx tools/recruit/src/art-fair/cli.ts --url https://example-fair.com/artists
npx tsx tools/recruit/src/art-fair/cli.ts --url https://example-fair.com/artists --push-to-notion --dry-run
npx tsx tools/recruit/src/art-fair/cli.ts --url https://example-fair.com/artists --output csv
```

### Notion Pipeline Enricher

Auto-fills missing Instagram links by scraping artist websites already in the pipeline.

```bash
npx tsx tools/recruit/src/enricher/cli.ts --dry-run --limit 10
npx tsx tools/recruit/src/enricher/cli.ts --stage Identified --verbose
npx tsx tools/recruit/src/enricher/cli.ts --field instagram --limit 25
```

### Etsy Category Browser

Searches Etsy for handmade sellers matching Surfaced Art's categories.

```bash
npx tsx tools/recruit/src/etsy/cli.ts --category ceramics
npx tsx tools/recruit/src/etsy/cli.ts --category jewelry --min-price 5000 --max-price 50000 --limit 20
npx tsx tools/recruit/src/etsy/cli.ts --category painting --push-to-notion --dry-run
```

## Development

```bash
cd tools/recruit
npm run test              # run all tests
npm run test:watch        # watch mode
npm run typecheck         # TypeScript checking
npm run build             # build for distribution
```

## Architecture

Each tool follows the same pattern:

- `cli.ts` — CLI entry point with argument parsing
- `<tool>.ts` — orchestrator (fetches data, applies logic, handles output)
- `<tool>-lib.ts` — pure functions (testable without mocking)
- `tests/<tool>/` — test files with static fixtures

Shared infrastructure in `src/shared/`:

- `types.ts` — shared TypeScript interfaces
- `http-client.ts` — polite HTTP client with retry and rate limiting
- `rate-limiter.ts` — per-domain request throttling
- `notion-pipeline.ts` — Notion Artist Pipeline read/write
- `output-formatter.ts` — table/json/csv console output
