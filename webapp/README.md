# How Risky Is Today?

A year-round Delhi/NCR civic-risk atlas and presentation artifact. It combines a stable official mortality baseline with live weather, air quality, official alerts, and location-filtered risk events.

## What is implemented

- Interactive Delhi/NCR map using MapLibre and OpenFreeMap/OpenStreetMap data
- Automatic visual scenes for rain, heat, haze, road strain, and quiet days
- Current weather and air-quality readings with a local fallback
- Located event index, ledger, and methodology pages
- Delhi weather, air quality, newspaper RSS, and NDMA/SACHET alerts every five minutes
- Broader discovery every two hours using GDELT and official IMD CAP alerts
- Automated risk-and-location filtering with direct publisher links; no manual review gate
- Precise map points for accepted venues and neighbourhoods, with clickable event popups
- Event-level risk type, consequence, five-band severity reasoning, and live/static behavior
- Six-hour refreshable live-event expiry and seven-day maximum static-event retention
- Separate, inspectable 0–100 Live Risk Pressure with environmental, event, freshness, and interaction inputs
- Accessible baseline explanation and distinct stable-baseline / current-pressure legends
- Apple-like day/night glass surfaces with stronger foreground contrast and reduced-transparency fallbacks
- Animated dual-layer live markers, fixed static markers, hollow recent high/severe incident halos, wider event cards, and responsive mobile presentation
- Responsive 420 px map popups that wrap long copy and automatically anchor away from the evidence rail
- RSS sources from Hindustan Times Delhi, NDTV Cities, The Indian Express Delhi, and The Hindu Delhi
- Source-reconciliation warnings wherever the official baseline or fixtures still need final evidence

## Start it locally

The easiest option on a Mac is to double-click `Start How Risky Is Today.command` in the project folder. Your browser can then open:

`http://localhost:3000`

For a developer terminal:

```bash
npm install
npm run dev
```

## Verify it

```bash
npm run check
```

This runs linting, the risk-engine tests, and a production Next.js build.

## Connect the live database

1. Create a Supabase project.
2. For a new database, run `supabase/migrations/0001_risk_atlas.sql`, `supabase/migrations/0002_event_risk_intelligence.sql`, and `supabase/migrations/0003_reclassify_legacy_signals.sql` in order in its SQL editor.
3. Deploy the `refresh-environment` and `refresh-risk` Edge Functions, then store their invocation keys in Supabase Vault under the names documented in `0004_supabase_edge_cron.sql`.
4. Run `supabase/migrations/0004_supabase_edge_cron.sql` to install the five-minute and two-hour database-owned schedules.
5. The existing production database already has all four migrations, both Edge Functions, both Vault entries, and both active Cron jobs as of 14 July 2026.
6. Copy `.env.example` to `.env.local`.
7. Add the Supabase URL, anonymous key, and service-role key for local development.

Never put the service-role key in browser code or paste it into chat. Until these values are present, the atlas uses its local fallback fixture.

## Publish on Netlify

Use `webapp` as the Netlify base directory. The repository already contains `netlify.toml`; Netlify runs `npm run build` and serves the Next.js application. Recurring ingestion is deliberately not hosted or scheduled on Netlify.

Add the same values listed in `.env.example` under Netlify **Site configuration → Environment variables**. Set `URL` to the final public address.

The production application is at `https://how-risky-is-today-delhi.netlify.app`. Production deploy `6a562e0be8a5ba7b102c806e` published the glass-interface pass and the frontend-only Netlify configuration. The deployed inventory contains only Netlify's internal Next.js server handler; the former `refresh-environment` and `refresh-risk` Netlify endpoints return HTTP 404. Supabase Edge Functions and Cron are now the sole recurring ingestion path.

## Recurring ingestion

- `refresh-environment` runs in Supabase every five minutes.
- `refresh-risk` runs in Supabase at minute 17 every two hours, avoiding a simultaneous start with the fast job.
- Supabase Vault stores the invocation keys; the repository contains only their names.
- Both endpoints reject requests without a valid project secret key.
- GitHub Actions is intentionally not used: a private five-minute workflow would exhaust the included hosted-runner allowance, while making this private artifact public would change the project’s privacy model.

## Data policy

- The `0.87 µmort/day` number is a baseline conversion, not a live daily score.
- Weather and air readings may change the atmosphere and context, but never silently alter that baseline.
- Live Risk Pressure is an inspectable product interpretation, not a probability of death or an official warning scale.
- A headline is shown only when it has a relevant current risk mechanism and a plotable Delhi/NCR location.
- Generic policy, political, cultural and administrative news is excluded.
- Automated map signals are source leads, not independently verified facts.
- Every lead retains its source URL and publisher attribution.
- Headline metadata is displayed; the app does not copy full publisher articles.
- Duplicate, incomplete, or incorrectly matched leads are expected during prototype evaluation.

See `/methodology` in the app for the visitor-facing explanation.
