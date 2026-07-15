# Plan review — How Risky Is Today?

**Reviewed:** 13 July 2026  
**Decision:** Do not implement `WEBAPP-PLAN.md` unchanged. Keep the product idea and coded stack, but revise the measurement model, incident evidence model, security, and build order first.

## Plain-English conclusion

The strongest part of the project is the civic-accountability product: an official Delhi risk baseline, a reviewed incident feed, and a negligence ledger with traceable sources. Next.js plus Supabase is a sensible way to build it, and almost all technical work can be handled by the AI assistant.

The weak part is the promise that the app can calculate a district-, age-, sex-, and activity-specific probability of dying **today** and adjust that probability using recent news reports. The named official sources do not establish all the denominators needed for that level of precision. News coverage is not a complete incident registry, so it cannot safely be converted into a mortality-rate adjustment merely by adding a cap and decay rule.

The recommended v1 therefore keeps micromorts, but uses them only for official baselines at the finest grain genuinely supported by the data. Recent incidents remain a separate, prominent **civic hazard signal** and accountability ledger. They do not change the mortality probability until a later statistical validation proves that they can.

## What should stay

- Product name: **How Risky Is Today?**
- Delhi-first pilot and civic-accountability purpose.
- Next.js, TypeScript, Supabase Postgres, and Vercel.
- Official statistics as the baseline; GDELT/RSS as candidate discovery only.
- Human review before anything becomes public.
- Micromorts as an explanatory unit for supported official rates.
- A prominent negligence ledger with sources and follow-up status.
- Mobile-first public pages and a simple private review screen.

## What must change before implementation

### 1. Do not publish unsupported personal precision — critical

The current formula assumes compatible official data for cause × district × age × sex, then multiplies it by activity. The official sources cited in the plan publish useful state/UT/city tables, but not necessarily that full cross-tabulation. Current district denominators are also not established: the seed file's 11 Delhi district estimates total 20.65 million, while the seed NCT total is 20 million and the official 2026 NCT projection is 22.54 million.

**Change:** every rate row must declare its actual grain, numerator, denominator, period, geography definition, source table, and uncertainty. The score engine may only filter on dimensions supported by that row. Unsupported dimensions must display “not available at this level,” not fall back silently to a different population while retaining personalized wording.

### 2. Separate official risk from news signals — critical

The proposed 14-day live adjustment treats reviewed news deaths as though they are a complete and stable surveillance sample. They are not: coverage varies by cause, district, language, newsworthiness, syndication, and publication delay. The ±50% cap limits the size of the error but does not make the estimate statistically valid. The current design also describes a negative adjustment although the incident-only formula has no defensible mechanism for producing one.

**Change:** v1 has two side-by-side outputs:

1. **Official baseline:** annual official rate converted to average daily micromorts, with source year and uncertainty.
2. **Recent civic hazard signals:** verified incident counts, deaths/injuries, recency, and source coverage, explicitly not added to the probability.

A live mortality adjustment becomes a later research feature only if validated against a sufficiently complete official incident time series.

### 3. Do not derive travel risk from fatality shares alone — critical

MoRTH road-user shares describe who died, not risk per trip, kilometre, or hour of exposure. A group can represent many deaths because many people use that mode, not because each journey is five times riskier.

**Change:** remove numeric activity multipliers from public v1 unless matching exposure denominators are available. Activity can filter relevant hazards or show evidence-backed comparisons, but not multiply micromorts based on starter guesses.

### 4. Replace the incident deduplication rule — high

`YYYY-MM-DD_<area>_<cause>` merges distinct incidents that happen in the same area, on the same day, for the same cause. It can erase real events. Conversely, one incident reported on multiple dates or with different cause wording can escape that key.

**Change:** store every source article separately, link one or more articles to a reviewed incident, and use a similarity fingerprint only to suggest duplicates. A human decides whether records describe the same event. Source URLs should have their own uniqueness constraint.

### 5. Make authority attribution evidence-based — critical

One incident can involve a road-owning agency, contractor, utility, police, organiser, or property owner. The present singular `responsible_authority` and default mappings can turn an assumption into a public accusation. For example, road ownership varies among MCD, PWD, DDA, and NHAI, while “DISCOM” combines three separate companies.

**Change:** use a many-to-many incident-authority table with:

- authority and role;
- attribution status: `reported`, `alleged`, `officially-confirmed`, `disputed`, or `unknown`;
- evidence URL and quoted/paraphrased basis;
- reviewer confidence and review timestamp.

AI may suggest a cause or possible authority, but it may not publish preventability or responsibility as fact.

### 6. Use real authentication and database permissions — critical

The plan asks the owner to paste a service-role key and database connection string into chat, and it does not specify Row Level Security. Supabase states that exposed tables need RLS and that secret/service-role keys bypass it.

**Change:** never paste secret keys into chat. Store them only in a local ignored environment file and in Vercel's encrypted environment settings. Use Supabase Auth for the one admin account, an explicit admin allowlist, RLS on every exposed table, public read-only views, server-only ingestion credentials, CSRF-safe mutations, rate limiting, and a review audit log.

### 7. Change the build order — high

The plan allows the data backbone to run alongside the ingestion, score, and public interface. That risks building a polished claim before proving the underlying data supports it.

**Change:** complete a small source audit and one reconciled Delhi baseline before implementing any user-facing score. The visual prototype and database shell may be built in parallel, but public numbers remain fixtures clearly marked as examples until reconciliation passes.

### 8. Tighten operational assumptions — medium

- Node 26 is currently a “Current” release; Node's own guidance says production apps should use an LTS line. Pin Node 24 LTS for development and deployment.
- Vercel Hobby supports daily cron jobs, but timing within the scheduled hour is not exact. The ingestion job must be idempotent and record each run.
- Supabase says free projects can pause for low activity after seven days. A daily cron may generate activity, but this is not a backup or availability guarantee. Add a downloadable database backup/runbook and surface the free-tier limitation honestly.
- GDELT DOC is useful discovery infrastructure, but it is a full-text news search rather than a complete Delhi incident registry. Measure feed coverage and review precision; do not label it as complete or inherently district-geocoded.

## Recommended v1 product

### Public page 1 — Delhi risk baseline

- Official Delhi acute external-cause micromorts per average day.
- Only supported breakdowns are selectable.
- Source year, publication date, numerator, denominator, and a clear uncertainty/coverage note appear with every number.
- Wording: “annual official rate expressed as an average day,” not “your probability today.”

### Public page 2 — recent civic hazard signals

- Verified recent incidents, grouped by place and cause.
- Counts and recency, not a mortality-probability adjustment.
- Clear coverage statement: this is a reviewed news/official-feed sample and may be incomplete.

### Public page 3 — accountability ledger

- Preventable or potentially preventable incidents.
- Evidence-backed authority roles and attribution status.
- Official response, FIR, compensation, remediation, and unresolved status.
- Multiple sources per incident and a visible corrections trail.

### Public page 4 — methodology

- What is known, what is estimated, what is missing, and what would change the method.
- Versioned methodology and dataset release date.

### Private admin

- Supabase-authenticated review queue.
- Source article → candidate incident → merged/verified incident workflow.
- Cause, location, casualties, event date, evidence, attribution, and confidence review.
- Full audit history for edits and status changes.

## Revised implementation sequence

### Phase A — evidence audit and specification

1. Download the exact official tables that will support the Delhi baseline.
2. Create a source inventory with grain, period, numerator, denominator, and licensing notes.
3. Reconcile one Delhi-wide acute-risk total and selected cause groups.
4. Freeze the v1 claims to what those tables can support.

### Phase B — secure application foundation

1. Scaffold Next.js with Node 24 LTS pinned.
2. Create the revised Supabase schema, migrations, seed files, RLS policies, and public views.
3. Add Supabase Auth for the owner and an audit log.
4. Add local setup and double-clickable start helpers; secrets remain outside chat and version control.

### Phase C — public baseline and methodology

1. Build the baseline page from reconciled official rates.
2. Build source and methodology views.
3. Add automated checks for units, denominator consistency, source completeness, and unsupported fallbacks.

### Phase D — incident discovery and review

1. Add GDELT and verified RSS/official sources as candidate discovery inputs.
2. Store source articles separately from incidents.
3. Build duplicate suggestions, the human merge/review flow, and evidence-based attribution.
4. Measure precision, duplicate rate, review backlog, source coverage, and correction rate.

### Phase E — ledger, deployment, and handoff

1. Build recent-signals and accountability-ledger pages.
2. Run accessibility, mobile, security, and data-honesty checks.
3. Deploy only after no example or unverified value can appear as a factual public score.
4. Provide a plain-English operations guide and backup/export procedure.

## Launch guardrails and success measures

- **Rate provenance:** 100% of displayed rates have a source table, URL, year, numerator, denominator, and grain.
- **No unsupported precision:** 0 public filters imply a breakdown absent from the source.
- **Incident evidence:** 100% of public incidents have at least one accessible source; public attribution has an evidence basis and status.
- **Review quality:** track candidate precision, duplicate-suggestion precision, correction rate, and pending-review age.
- **Security:** RLS enabled and tested on every exposed table; no elevated key reaches browser code or version control.
- **Operational clarity:** every page shows its data-as-of date and coverage limitations.

## Evidence checked

- [NCRB ADSI 2023 catalog](https://www.data.gov.in/catalog/accidental-deaths-suicides-india-adsi-2023) — useful official state/UT/city resources, but the plan still needs an exact table-by-table grain audit.
- [Delhi Crash Report 2023](https://traffic.delhipolice.gov.in/delhi-crash-report-2023) and [MoRTH Road Accidents in India 2023](https://morth.nic.in/sites/default/files/Road-Accident-in-India-2023-Publications.pdf) — suitable official road-fatality inputs; fatality shares alone are not exposure-normalized risk.
- [Official population projections, 2011–2036](https://www.mohfw.gov.in/sites/default/files/Population%20Projection%20Report%202011-2036%20-%20upload_compressed_0.pdf) — NCT-level projections; current district estimates still require a defensible method.
- [GDELT DOC 2.0 documentation](https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/) — full-text news discovery API with JSON article-list mode.
- [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [database security](https://supabase.com/docs/guides/database/secure-data), and [free-project pausing](https://supabase.com/docs/guides/platform/free-project-pausing).
- [Vercel cron limits](https://vercel.com/docs/cron-jobs/manage-cron-jobs) — Hobby supports once-daily scheduling with within-hour timing.
- [Node release status](https://nodejs.org/en/about/previous-releases) — Node 24 is LTS; Node 26 is Current as of this review.
- [WHO guidance on communicating uncertainty](https://www.who.int/publications/i/item/communicating-risk-in-public-health-emergencies) — public risk communication should state what is known and unknown.

## Decision needed

Approve the revised v1 above, or explicitly instruct the implementation to retain the original live-adjusted personal micromort formula despite these limitations. The recommended choice is the revised v1.
