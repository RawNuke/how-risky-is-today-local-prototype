# Delhi/NCR ingestion audit evidence

Audit snapshot: 2026-07-14 12:57 UTC / 18:27 IST. This was a read-only production audit; no schedules, functions, database rows, or deployments were changed.

## Production freshness

- Supabase Cron jobs are active at `*/5 * * * *` for environment/RSS ingestion and `17 */2 * * *` for deep discovery.
- Between 12:00 and 12:50 UTC, all 11 fast-job enqueue operations were marked succeeded by pg_cron, but the actual Edge responses were 7 HTTP 200 and 4 HTTP 500.
- All four HTTP 500 responses contained `api.open-meteo.com returned 503`. Weather, air, and RSS are coupled in one `Promise.all`, so a weather failure aborts otherwise usable RSS ingestion.
- The latest successful environment run was 12:50 UTC.
- Every stored deep-discovery snapshot inspected was `partial`. A direct read-only request using the production GDELT query returned HTTP 429. The IMD CAP feed returned HTTP 200 but contributed no persisted located signal.

## Current feed inventory and replayed funnel

The production fast path has five configured RSS endpoints: Hindustan Times Delhi, NDTV Cities, Indian Express Delhi, The Hindu Delhi, and NDMA/SACHET India CAP.

At 12:51 UTC the five endpoints returned 419 parsed items. Replaying the production parser and filters without writing data produced:

| Feed | Raw items | Delhi-scoped and <=48h | Risk-keyword match | Historical stored located leads | Current public signals |
|---|---:|---:|---:|---:|---:|
| Hindustan Times Delhi | 40 | 40 | 9 | 25 | 3 |
| NDTV Cities | 20 | 4 | 0 | 10 | 0 |
| Indian Express Delhi | 200 | 25 | 5 | 21 | 4 |
| The Hindu Delhi | 60 | 27 | 4 | 21 | 1 |
| NDMA/SACHET India CAP | 99 | 0 | 0 | 0 | 0 |
| Total | 419 | 96 | 18 | 77 | 8 |

Of 96 recent Delhi-scoped items, 18 passed the risk vocabulary, 12 matched one of 46 hard-coded gazetteer entries, and 8 survived location-plus-mechanism deduplication. The overall yield was 8.3% of the recent Delhi-scoped set.

All 18 candidate article pages loaded successfully during the replay. Article extraction was therefore not the main bottleneck in this sample.

## Why the UI changes slowly

1. Five-minute polling repeatedly upserts the same URLs; it does not manufacture new incidents.
2. Only five fast feeds are configured, and no smaller local-only or Hindi-language publisher is currently in production.
3. Risk classification uses the headline and RSS description. Article text may rescue a location only after the item has already passed the risk-keyword gate.
4. The risk vocabulary is narrow and English-only.
5. A location must match the 46-entry gazetteer. Relevant neighbourhoods such as Kalyanpuri, Rajghat, and East Vinod Nagar are missing.
6. Deduplication uses only `location::mechanism`, so unrelated incidents at the same broad place can suppress one another.
7. A global 24-candidate cap can favor earlier feeds in configuration order during busy cycles.
8. GDELT is currently rate-limited, and weather API failures can cancel the entire fast ingestion run.
9. Static incidents can remain visible for seven days, so the same eight cards can persist while `last_observed_at` continues to advance.

## Data-quality defect found

One current high-risk Kalyanpuri shooting is stored at `Central Noida`. The article context says the incident occurred in Kalyanpuri near Mayur Vihar metro and East Vinod Nagar, while Greater Noida appears later as the victim family's home. Because the actual incident neighbourhoods are missing from the gazetteer, the first recognized secondary location is selected. This is a confirmed location-precision defect, not just a coverage gap.

## Vetted source expansion

### Valid current RSS feeds suitable for an implementation pass

- The Patriot Delhi/NCR: https://thepatriot.in/delhi-ncr/feed/ — HTTP 200, valid RSS, 10 current items.
- Live Hindustan NCR: https://api.livehindustan.com/feeds/rss/ncr/rssfeed.xml
- Live Hindustan New Delhi: https://api.livehindustan.com/feeds/rss/ncr/new-delhi/rssfeed.xml
- Live Hindustan Noida: https://api.livehindustan.com/feeds/rss/ncr/noida/rssfeed.xml
- Live Hindustan Ghaziabad: https://api.livehindustan.com/feeds/rss/ncr/ghaziabad/rssfeed.xml
- Live Hindustan Gurugram: https://api.livehindustan.com/feeds/rss/ncr/gurgaon/rssfeed.xml
- Live Hindustan Greater Noida: https://api.livehindustan.com/feeds/rss/ncr/greater-noida/rssfeed.xml
- Live Hindustan Faridabad: https://api.livehindustan.com/feeds/rss/ncr/faridabad/rssfeed.xml
- Live Hindustan Trans-Hindon: https://api.livehindustan.com/feeds/rss/ncr/trans-hindon/rssfeed.xml

All eight Live Hindustan feeds returned HTTP 200, valid RSS 2.0, 50 items, and current content. The publisher's feed directory is https://www.livehindustan.com/rss.

### Strong official sources requiring adapters rather than guessed RSS URLs

- Delhi Police current press releases: https://delhipolice.gov.in/newpressrelease
- Delhi Police notifications: https://delhipolice.gov.in/notification
- Delhi Traffic Police traffic diversions: https://www.traffic.delhipolice.gov.in/traffic-diversions
- Delhi Fire Service news and updates: https://dfs.delhi.gov.in/news-update
- GNCTD Directorate of Information and Publicity press releases: https://publicity.delhi.gov.in/press-releases

No valid RSS endpoint was confirmed for these official sources. They need source-specific HTML or API adapters with terms-of-use and reliability checks.

### Feeds not suitable for immediate addition

- Gurgaon Mail and New Delhi Times returned valid feeds but showed weak local relevance in the current sample.
- CitySpidey, Ten News, and Tricity Today feed endpoints timed out or failed from the audit environment.
- Delhi NCR Times was valid but stale; Millennium Post exposed an empty/stale channel.
- Guessed DMRC RSS endpoints returned HTML, not RSS.

## Recommended order

1. Decouple RSS ingestion from weather and record actual Edge response and per-feed health.
2. Correct incident-location extraction and expand Delhi/NCR geocoding before multiplying feeds.
3. Replace coarse location/mechanism deduplication and the global 24-item cap with time-aware similarity and fair per-source quotas.
4. Add The Patriot and the granular Live Hindustan feeds, including Hindi risk vocabulary.
5. Add official Delhi Police, traffic, fire, and civic adapters.
6. Add GDELT backoff/caching or replace it with a reliable discovery path.

## Query and code provenance

- Production SQL: `source.query.sql` in this folder.
- Feed definitions and fast funnel: `webapp/supabase/functions/_shared/refresh-environment.ts`.
- Deep discovery: `webapp/supabase/functions/_shared/refresh-risk.ts`.
- Risk vocabulary, gazetteer, severity, and expiry: `webapp/lib/risk-signal-filter.ts`.
- Public API cache behavior: `webapp/app/api/risk/route.ts`.
