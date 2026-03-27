# The Cursed Times

The Cursed Times is a NYT-inspired daily historical homepage: every visit reconstructs what The New York Times was covering on the same month and day, years earlier.

## MVP

- Daily historical homepage keyed to the current month/day with a free year selector
- Front-page style reconstruction with hero, secondary stories, books, weather, and market context
- Durable server-side caches for raw NYT archive months, books payloads, and rendered editions
- Server-side date handling anchored to `America/New_York`

## Local development

1. Install dependencies with `npm install`
2. Copy `.env.example` to `.env.local`
3. Add `NYT_ARCHIVE_API_KEY` if available
4. Run `npm run dev`

## Production caching

- Raw NYT archive months are cached under `.cache/cursed-times-store/nyt/archive`
- NYT Books responses are cached under `.cache/cursed-times-store/nyt/books`
- Fully rendered editions are cached under `.cache/cursed-times-store/editions`
- When `BLOB_READ_WRITE_TOKEN` is set on Vercel, the same cache keys are stored in Vercel Blob instead of local disk

The app now serves cached editions first and only calls NYT on cache misses.

## Precompute

Use `GET /api/precompute` to warm the common years for the current day. Protect it with `CRON_SECRET` in production.

## Vercel deployment

Set these environment variables on Vercel:

- `NYT_ARCHIVE_API_KEY`
- `BLOB_READ_WRITE_TOKEN`
- `CRON_SECRET`

`vercel.json` includes a daily cron job that warms the common editions for the current day.
